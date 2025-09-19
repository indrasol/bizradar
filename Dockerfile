# ────────── build image ──────────
FROM python:3.11-slim

# Minimal, safe defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV LOG_LEVEL=debug \
    PYTHONLOGLEVEL=DEBUG

WORKDIR /src

# System deps (curl for healthcheck); keep it slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Debug step to check apt sources
RUN apt-get update

# Install Chrome dependencies
RUN apt-get install -y --no-install-recommends \
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
    ca-certificates \
    libcurl4 \
    libxss1 \
    libappindicator3-1 \
    libindicator3-7 \
 && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && DISTRO=$(lsb_release -c | awk '{print $2}') \
 && echo "deb [signed-by=/usr/share/keyrings/google-archive-keyring.gpg] https://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Install Node.js (for npx to run @playwright/mcp)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get update && apt-get install -y --no-install-recommends nodejs \
 && node -v && npm -v \
 && rm -rf /var/lib/apt/lists/*

# Pre-install Playwright MCP globally to avoid runtime fetch via npx
RUN npm install -g @playwright/mcp@latest \
 && which playwright-mcp || true

# Copy requirements first to leverage cache
COPY backend/app/requirements.txt ./app/requirements.txt
RUN pip install --no-cache-dir -r ./app/requirements.txt

# Install Playwright and Chromium
RUN pip install playwright && playwright install --with-deps chromium

# Copy application code
COPY backend/app/ ./app/

# Non-root user
RUN useradd --create-home --shell /bin/bash appuser \
 && mkdir -p ${PLAYWRIGHT_BROWSERS_PATH} \
 && chown -R appuser:appuser /src ${PLAYWRIGHT_BROWSERS_PATH}
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
