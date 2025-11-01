# Fly.io Deployment - Files Created

## Summary
This document lists all files created for deploying both Node.js server and TTS service on Fly.io in a single container.

## 📁 Core Deployment Files

### 1. `Dockerfile`
- Multi-stage build combining Python 3.10 and Node.js 20.x
- Installs dependencies for both services
- Uses Supervisor to manage both processes
- Exposes ports 5000 (Node.js) and 8001 (TTS)
- **Location**: Root directory

### 2. `fly.toml`
- Fly.io application configuration
- Sets app name, region, and resources (2GB RAM, 2 CPUs)
- Configures HTTP service on port 5000
- Includes environment variables for both services
- **Location**: Root directory

### 3. `.dockerignore`
- Excludes unnecessary files from Docker build
- Reduces image size and build time
- **Location**: Root directory

### 4. `.flyignore`
- Excludes files from Fly.io deployment
- Similar to .dockerignore but Fly.io specific
- **Location**: Root directory

## 🔧 Setup & Testing Scripts

### 5. `setup-fly.ps1`
- PowerShell script for automated Fly.io setup
- Interactive prompts for configuration
- Handles app creation, secrets setup, and deployment
- **Location**: Root directory
- **Usage**: `.\setup-fly.ps1`

### 6. `test-docker.ps1`
- Local Docker testing script
- Builds and runs container locally
- Tests both services before deployment
- **Location**: Root directory
- **Usage**: `.\test-docker.ps1`

## 📚 Documentation

### 7. `DEPLOYMENT.md`
- Comprehensive deployment guide
- Includes troubleshooting tips
- Covers monitoring and scaling
- **Location**: Root directory

### 8. `.fly/deploy.md`
- Quick reference guide
- Common commands and workflows
- **Location**: `.fly/` directory

## 🚀 CI/CD

### 9. `.github/workflows/deploy.yml`
- GitHub Actions workflow for automatic deployment
- Triggers on push to main branch
- Requires FLY_API_TOKEN secret in GitHub
- **Location**: `.github/workflows/` directory

## 🩺 Code Updates

### 10. `server/src/main.ts` (Modified)
- Added `/health` endpoint
- Checks both Node.js API and TTS service health
- Returns service status for monitoring

## 🗂️ Directory Structure

```
surge-ai-hackathon/
├── Dockerfile                  # Multi-service container build
├── fly.toml                    # Fly.io configuration
├── .dockerignore              # Docker build exclusions
├── .flyignore                 # Fly.io deployment exclusions
├── setup-fly.ps1              # Automated setup script
├── test-docker.ps1            # Local testing script
├── DEPLOYMENT.md              # Comprehensive guide
├── .fly/
│   └── deploy.md              # Quick reference
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD workflow
└── server/
    └── src/
        └── main.ts            # Updated with health check
```

## 🎯 Quick Start

### For first-time deployment:
```powershell
# Run automated setup
.\setup-fly.ps1
```

### For testing locally first:
```powershell
# Test with Docker locally
.\test-docker.ps1

# Then deploy to Fly.io
fly deploy
```

### For manual deployment:
```powershell
# Login
fly auth login

# Deploy
fly deploy

# Check status
fly status

# View logs
fly logs
```

## 🔐 Required Secrets

Set these via `fly secrets set` or the setup script:
- `GEMINI_API_KEY` - Google Gemini API key
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `FRONTEND_URL` - Frontend application URL

## ✅ Verification Checklist

After deployment, verify:
- [ ] App is accessible at `https://your-app.fly.dev`
- [ ] Health endpoint returns OK: `https://your-app.fly.dev/health`
- [ ] Node.js API responds: `https://your-app.fly.dev/api/...`
- [ ] TTS service is running (check logs)
- [ ] Database connection works
- [ ] Socket.IO connections work
- [ ] Frontend can connect to backend

## 📊 Monitoring

- **Dashboard**: `fly dashboard`
- **Logs**: `fly logs`
- **Status**: `fly status`
- **Metrics**: View in Fly.io web dashboard
- **SSH Access**: `fly ssh console`

## 🆘 Support Resources

- **Documentation**: `DEPLOYMENT.md`
- **Quick Reference**: `.fly/deploy.md`
- **Fly.io Docs**: https://fly.io/docs/
- **Community**: https://community.fly.io/

## 🎉 Next Steps

1. Run `.\setup-fly.ps1` for automated setup
2. Or run `.\test-docker.ps1` to test locally first
3. Deploy with `fly deploy`
4. Update frontend to use deployed API URL
5. Test all functionality
6. Set up custom domain (optional)
7. Configure monitoring and alerts

---

**Created**: November 2025  
**Purpose**: Single-container deployment of Node.js + TTS services on Fly.io
