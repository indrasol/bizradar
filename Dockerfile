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
ENV CHROME_PATH=/usr/bin/google-chrome \
    CHROME_BIN=/usr/bin/google-chrome
ENV PLAYWRIGHT_MCP_BIN=/usr/local/bin/playwright-mcp

WORKDIR /src

# System deps (curl for healthcheck); keep it slim
RUN echo "deb http://deb.debian.org/debian/ stable main" > /etc/apt/sources.list \
    && apt-get update

# Install basic dependencies first (curl, wget, gnupg, lsb-release, etc.)
RUN apt-get install -y --no-install-recommends \
    curl \
    wget \
    gnupg \
    ca-certificates \
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
    libcurl4 \
    libxss1 \
    libappindicator3-1 \
    libindicator3-7 \
 && rm -rf /var/lib/apt/lists/*

# Add Google Chrome repository and install it
RUN curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && DISTRO=$(lsb_release -c | awk '{print $2}') \
 && echo "deb [signed-by=/usr/share/keyrings/google-archive-keyring.gpg] https://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Install Google Chrome stable
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux.gpg \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Install Node.js (for npx to run @playwright/mcp) and preinstall MCP
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get update && apt-get install -y --no-install-recommends nodejs \
 && npm i -g @playwright/mcp@latest \
 && node -v && npm -v && playwright-mcp --version || true \
 && rm -rf /var/lib/apt/lists/*

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
