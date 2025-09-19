# ────────── build image ──────────
FROM python:3.11-slim

# Minimal, safe defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /src

# System deps (curl for healthcheck); keep it slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    gnupg \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    libgtk-3-0 \
 && rm -rf /var/lib/apt/lists/*

# Install Node.js (for npx) to run the Playwright MCP server
# Using NodeSource for a modern LTS version
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && node --version \
  && npm --version

# Copy requirements first to leverage cache
COPY backend/app/requirements.txt ./app/requirements.txt
RUN pip install --no-cache-dir -r ./app/requirements.txt

# Install Playwright and Chromium
RUN pip install playwright && playwright install --with-deps chromium

# Preinstall Playwright (Node) browsers so @playwright/mcp can start without downloading at runtime
RUN npx -y playwright install --with-deps chromium

# Copy application code
COPY backend/app/ ./app/

# Non-root user
RUN useradd --create-home --shell /bin/bash appuser \
 && chown -R appuser:appuser /src
USER appuser

# App Service probes default to this; still useful for docs
EXPOSE 8000

# Healthcheck — expects a fast endpoint; change /healthz if needed
HEALTHCHECK --interval=30s --timeout=3s --retries=5 \
  CMD curl --fail --silent --max-time 2 http://127.0.0.1:${PORT}/healthz || exit 1

# Start: bind to $PORT set by Azure; sh -c allows env expansion
CMD ["sh","-c","python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port ${PORT:-8000} \
  --workers ${UVICORN_WORKERS:-2} \
  --log-level ${LOG_LEVEL:-info}"]