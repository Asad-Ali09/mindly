# Fly.io Quick Reference Card

## 🚀 Essential Commands

### Deployment
```bash
fly deploy                    # Deploy application
fly deploy --no-cache         # Deploy with fresh build
fly deploy --remote-only      # Build in cloud (slower, saves bandwidth)
```

### App Management
```bash
fly apps list                 # List all your apps
fly apps create app-name      # Create new app
fly apps destroy app-name     # Delete app (careful!)
fly status                    # Check app status
fly open                      # Open app in browser
```

### Secrets & Config
```bash
fly secrets list              # View secret names (not values)
fly secrets set KEY=value     # Set a secret
fly secrets unset KEY         # Remove a secret
```

### Monitoring & Logs
```bash
fly logs                      # Stream logs
fly logs -a app-name          # Logs for specific app
fly dashboard                 # Open web dashboard
fly machine list              # List machines
```

### Scaling
```bash
fly scale count 2             # Scale to 2 machines
fly scale memory 4096         # Scale to 4GB RAM
fly scale vm shared-cpu-4x    # Change VM type
```

### SSH & Debugging
```bash
fly ssh console               # SSH into container
fly ssh console -C "command"  # Run command in container
supervisorctl status          # Check services (inside container)
```

---

## 📱 Your App URLs

**Main App**: `https://your-app-name.fly.dev`  
**API Base**: `https://your-app-name.fly.dev/api`  
**Health**: `https://your-app-name.fly.dev/health`

---

## 🔧 Common Tasks

### View Both Service Logs
```bash
fly ssh console -C "tail -f /var/log/supervisor/*.log"
```

### Restart Services
```bash
fly ssh console -C "supervisorctl restart all"
fly ssh console -C "supervisorctl restart node-server"
fly ssh console -C "supervisorctl restart tts-service"
```

### Check Service Status
```bash
fly ssh console -C "supervisorctl status"
```

### Update Secrets
```bash
fly secrets set MONGO_URI="new-value"
# App will automatically restart
```

---

## 🐛 Troubleshooting

### App Won't Start
1. `fly logs` - check for errors
2. `fly ssh console` → `supervisorctl status`
3. Check secrets: `fly secrets list`

### Build Fails
1. `fly deploy --no-cache`
2. Check Dockerfile syntax
3. Verify all files exist

### High Memory
1. `fly status` - check usage
2. `fly scale memory 4096` - increase if needed

### Slow Performance
1. Set `min_machines_running = 1` in fly.toml
2. Check cold start time
3. Consider keeping app warm

---

## 📊 Files Structure

```
surge-ai-hackathon/
├── Dockerfile           # Container definition
├── fly.toml            # Fly.io config
├── setup-fly.ps1       # Setup script
├── test-docker.ps1     # Test locally
└── .fly/
    ├── DEPLOYMENT.md   # Full guide
    ├── CHECKLIST.md    # Pre-deploy checklist
    └── ARCHITECTURE.md # System design
```

---

## 🔐 Required Secrets

```bash
GEMINI_API_KEY      # Google AI API
MONGO_URI           # Database connection
JWT_SECRET          # Auth secret
FRONTEND_URL        # CORS origin
```

---

## 💡 Tips

- **Test locally first**: Run `.\test-docker.ps1`
- **Check logs often**: `fly logs` is your friend
- **Scale to zero**: Save costs when idle
- **Use secrets**: Never commit sensitive data
- **Monitor dashboard**: Check resource usage

---

## 📞 Help Resources

- **Docs**: https://fly.io/docs/
- **Community**: https://community.fly.io/
- **Status**: https://status.fly.io/
- **Local Docs**: `DEPLOYMENT.md`

---

## ⚡ Quick Deploy Workflow

1. **First Time**:
   ```powershell
   .\setup-fly.ps1      # Interactive setup
   ```

2. **Updates**:
   ```bash
   git add .
   git commit -m "Update"
   fly deploy           # Manual
   # or git push (with GitHub Actions)
   ```

3. **Verify**:
   ```bash
   fly status
   fly logs
   curl https://your-app.fly.dev/health
   ```

---

**Print this and keep it handy!**  
**Version**: 1.0 | **Updated**: Nov 2025
