FROM node:20-slim

# Install dependencies for Chromium
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    fonts-liberation \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxdamage1 libxcomposite1 libxrandr2 \
    libgbm1 libgtk-3-0 libnss3 libxshmfence1 libgdk-pixbuf2.0-0 \
    xvfb \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Container working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm ci

# Install latest Chrome for Puppeteer
RUN npx puppeteer browsers install chrome && \
    rm -rf /root/.npm /tmp/*

# Copy project files
COPY . .

# Start the server
CMD ["npm", "start"]
