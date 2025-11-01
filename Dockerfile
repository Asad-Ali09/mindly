# Multi-stage build for Node.js server and Python TTS service
FROM python:3.10-slim as base

# Install system dependencies for both Node.js and Python TTS
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libsndfile1 \
    ffmpeg \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# ===== TTS Service Setup =====
WORKDIR /app/tts-service

# Copy TTS requirements and install Python dependencies
COPY tts-service/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy TTS service code
COPY tts-service/main.py .

# Create output directory for TTS
RUN mkdir -p output

# ===== Node.js Server Setup =====
WORKDIR /app/server

# Copy package files and install ALL dependencies (including devDependencies for TypeScript)
COPY server/package*.json ./
RUN npm install

# Copy TypeScript config and source code
COPY server/tsconfig.json ./
COPY server/src ./src

# Build TypeScript code
RUN npm run build

# Remove devDependencies to reduce image size (keep only production deps)
RUN npm prune --production

# ===== Final Setup =====
WORKDIR /app

# Create supervisor configuration
RUN mkdir -p /var/log/supervisor

COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:tts-service]
directory=/app/tts-service
command=uvicorn main:app --host 0.0.0.0 --port 8001
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/tts-service.err.log
stdout_logfile=/var/log/supervisor/tts-service.out.log
environment=PYTHONUNBUFFERED=1

[program:node-server]
directory=/app/server
command=node dist/main.js
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/node-server.err.log
stdout_logfile=/var/log/supervisor/node-server.out.log
environment=NODE_ENV=production
EOF

# Expose ports
# Port 5000 for Node.js server (will be remapped to 8080 by Fly.io)
# Port 8001 for TTS service (internal)
EXPOSE 5000 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# Start supervisor to run both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
