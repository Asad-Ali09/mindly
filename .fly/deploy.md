# Fly.io Deployment Guide

This guide explains how to deploy both the Node.js server and TTS service on Fly.io in a single container.

## Prerequisites

1. Install Fly.io CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Login to Fly.io:
   ```bash
   fly auth login
   ```

## Initial Setup

1. Create a new Fly.io app (if not already created):
   ```bash
   fly apps create surge-ai-hackathon
   ```

2. Set up secrets (environment variables):
   ```bash
   fly secrets set GEMINI_API_KEY="your-gemini-api-key"
   fly secrets set MONGO_URI="your-mongodb-connection-string"
   fly secrets set JWT_SECRET="your-jwt-secret-key"
   fly secrets set FRONTEND_URL="https://your-frontend-url.com"
   ```

## Deployment

1. Deploy the application:
   ```bash
   fly deploy
   ```

2. Check the deployment status:
   ```bash
   fly status
   ```

3. View logs:
   ```bash
   fly logs
   ```

## Configuration Details

### Dockerfile
- Uses Python 3.10 slim as base image
- Installs Node.js 20.x
- Uses Supervisor to run both services simultaneously
- TTS service runs on port 8001 (internal)
- Node.js server runs on port 5000 (mapped to 8080 by Fly.io)

### fly.toml
- Configured for automatic scaling
- 2GB RAM, 2 shared CPUs
- Auto-stop and auto-start enabled
- Environment variables set for both services

### Services Running
1. **Node.js Server** (port 5000): Express API server with Socket.IO
2. **TTS Service** (port 8001): FastAPI service for text-to-speech

### Internal Communication
The Node.js server communicates with the TTS service via `http://localhost:8001` since both services run in the same container.

## Monitoring

- View application metrics: `fly dashboard`
- Check machine status: `fly machine list`
- SSH into the container: `fly ssh console`

## Scaling

To change resources:
```bash
fly scale vm shared-cpu-2x --memory 4096
```

## Troubleshooting

1. Check logs for both services:
   ```bash
   fly logs
   ```

2. SSH into the container to debug:
   ```bash
   fly ssh console
   ```

3. Check supervisor status:
   ```bash
   fly ssh console -C "supervisorctl status"
   ```

4. Restart services:
   ```bash
   fly ssh console -C "supervisorctl restart all"
   ```

## Useful Commands

- Update secrets: `fly secrets set KEY=value`
- List secrets: `fly secrets list`
- Deploy with no cache: `fly deploy --no-cache`
- Force restart: `fly apps restart surge-ai-hackathon`

## Notes

- The TTS service downloads models on first run, which may take a few minutes
- Ensure your MongoDB is accessible from Fly.io (use MongoDB Atlas or configure firewall rules)
- The container uses supervisor to manage both services, ensuring they stay running
