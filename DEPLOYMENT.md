# Surge AI Hackathon - Fly.io Deployment

This repository contains both a Node.js server and a Python TTS (Text-to-Speech) service deployed together in a single Fly.io container.

## 🏗️ Architecture

The deployment uses a multi-process container managed by Supervisor:
- **Node.js Server** (Port 5000): Express API with Socket.IO for real-time communication
- **TTS Service** (Port 8001): FastAPI service for text-to-speech generation

Both services run in the same container and communicate via localhost.

## 📋 Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly.io CLI**: Install the CLI tool
   ```powershell
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```
3. **Environment Variables**: Prepare the following:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `MONGO_URI`: MongoDB connection string (use MongoDB Atlas for cloud)
   - `JWT_SECRET`: Secret key for JWT token generation
   - `FRONTEND_URL`: URL of your frontend application

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script:
```powershell
.\setup-fly.ps1
```

This script will:
- Install Fly.io CLI (if needed)
- Log you into Fly.io
- Create the app
- Set up secrets
- Deploy the application

### Option 2: Manual Setup

1. **Login to Fly.io**
   ```bash
   fly auth login
   ```

2. **Create a new app** (replace `your-app-name` with your desired name)
   ```bash
   fly apps create your-app-name
   ```

3. **Update `fly.toml`**
   
   Edit the `app` field in `fly.toml`:
   ```toml
   app = "your-app-name"
   ```

4. **Set secrets**
   ```bash
   fly secrets set GEMINI_API_KEY="your-key-here"
   fly secrets set MONGO_URI="mongodb+srv://..."
   fly secrets set JWT_SECRET="your-secret-key"
   fly secrets set FRONTEND_URL="https://your-frontend.com"
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

## 📦 What Gets Deployed

### Services
1. **Node.js Server**
   - Express REST API
   - Socket.IO for real-time features
   - MongoDB integration
   - JWT authentication

2. **TTS Service**
   - FastAPI server
   - Glow-TTS model for text-to-speech
   - Audio file generation and caching
   - Automatic cleanup of old files

### Resource Allocation
- **Memory**: 2GB RAM
- **CPU**: 2 shared CPUs
- **Auto-scaling**: Enabled (scales to zero when idle)

## 🔧 Configuration Files

- `Dockerfile`: Multi-stage build for both Node.js and Python services
- `fly.toml`: Fly.io application configuration
- `.dockerignore` / `.flyignore`: Files to exclude from build
- `setup-fly.ps1`: Automated setup script

## 📊 Monitoring & Management

### View Logs
```bash
fly logs
```

### Check Status
```bash
fly status
```

### SSH into Container
```bash
fly ssh console
```

### Check Both Services Status
```bash
fly ssh console -C "supervisorctl status"
```

### Restart Services
```bash
# Restart both services
fly ssh console -C "supervisorctl restart all"

# Restart specific service
fly ssh console -C "supervisorctl restart node-server"
fly ssh console -C "supervisorctl restart tts-service"
```

## 🔍 Health Checks

The application includes health check endpoints:
- Main API: `https://your-app.fly.dev/health`
- TTS Service: `https://your-app.fly.dev/api/tts/health` (if exposed)

Fly.io automatically performs health checks on port 5000.

## 📈 Scaling

### Change Resources
```bash
# Scale to 4GB RAM
fly scale vm shared-cpu-2x --memory 4096

# Scale to 4 CPUs
fly scale vm shared-cpu-4x
```

### Adjust Auto-scaling
Edit `fly.toml`:
```toml
[http_service]
  min_machines_running = 1  # Keep at least 1 machine running
  auto_stop_machines = false  # Disable auto-stop
```

Then deploy:
```bash
fly deploy
```

## 🐛 Troubleshooting

### Deployment Issues

**Problem**: Build fails
```bash
# Clear build cache and redeploy
fly deploy --no-cache
```

**Problem**: Services not starting
```bash
# Check supervisor logs
fly ssh console
tail -f /var/log/supervisor/*.log
```

### Runtime Issues

**Problem**: TTS service not responding
```bash
# Check TTS service logs
fly ssh console -C "tail -n 100 /var/log/supervisor/tts-service.out.log"
```

**Problem**: Node server crashes
```bash
# Check Node server logs
fly ssh console -C "tail -n 100 /var/log/supervisor/node-server.err.log"
```

### Database Connection Issues

**Problem**: Can't connect to MongoDB
- Ensure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Fly.io IPs
- Check that MONGO_URI secret is set correctly:
  ```bash
  fly secrets list
  ```

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use Fly.io secrets** for sensitive data
3. **Configure MongoDB IP whitelist** (or use 0.0.0.0/0 with strong credentials)
4. **Enable HTTPS** (Fly.io provides this automatically)
5. **Review CORS settings** in your Node.js server

## 💰 Cost Considerations

- **Free tier**: Includes generous resources for hobby projects
- **Auto-scaling**: App scales to zero when idle (saves costs)
- **Resource usage**: Monitor via `fly dashboard`

## 📚 Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Status](https://status.fly.io/)

## 🤝 Support

For deployment issues:
1. Check logs: `fly logs`
2. Review Fly.io status: https://status.fly.io/
3. Fly.io community: https://community.fly.io/

## 📝 Notes

- First deployment takes longer due to TTS model downloads (~5-10 minutes)
- The TTS service uses CPU-only PyTorch for cost efficiency
- Audio files are automatically cleaned up after 1 hour
- Both services share the same filesystem and network

## 🎯 Next Steps After Deployment

1. Test the API endpoints
2. Update your frontend `NEXT_PUBLIC_API_URL` to point to your Fly.io app
3. Configure custom domain (optional): `fly certs create your-domain.com`
4. Set up monitoring and alerts in Fly.io dashboard

---

**Deployment Date**: November 2025  
**Last Updated**: November 2025
