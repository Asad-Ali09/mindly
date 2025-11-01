# Fly.io Deployment Documentation

This directory contains all documentation and guides for deploying the Surge AI Hackathon application to Fly.io.

## 📚 Documentation Files

### 🎯 Start Here
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Essential commands and quick tips (print this!)
- **[CHECKLIST.md](./CHECKLIST.md)** - Pre-deployment checklist and verification steps

### 📖 Detailed Guides
- **[deploy.md](./deploy.md)** - Step-by-step deployment guide with commands
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Visual architecture and system design
- **[FILES.md](./FILES.md)** - List and purpose of all deployment files

### 📋 Also Check Root Directory
- **[../DEPLOYMENT.md](../DEPLOYMENT.md)** - Comprehensive deployment documentation
- **[../Dockerfile](../Dockerfile)** - Container build instructions
- **[../fly.toml](../fly.toml)** - Fly.io configuration
- **[../setup-fly.ps1](../setup-fly.ps1)** - Automated setup script
- **[../test-docker.ps1](../test-docker.ps1)** - Local testing script

## 🚀 Quick Start

### For First-Time Deployment

```powershell
# Option 1: Automated (Recommended)
.\setup-fly.ps1

# Option 2: Manual
fly auth login
fly apps create your-app-name
fly secrets set GEMINI_API_KEY="..." MONGO_URI="..." JWT_SECRET="..." FRONTEND_URL="..."
fly deploy
```

### For Testing Locally First

```powershell
.\test-docker.ps1
```

## 📖 Reading Order

If you're new to this deployment:

1. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Get familiar with commands
2. **[CHECKLIST.md](./CHECKLIST.md)** - Follow the checklist
3. **[deploy.md](./deploy.md)** or **[../DEPLOYMENT.md](../DEPLOYMENT.md)** - Detailed walkthrough
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the system (optional)
5. **[FILES.md](./FILES.md)** - Know what each file does (optional)

## 🎯 Quick Navigation

**Need to deploy?** → [deploy.md](./deploy.md)  
**Having issues?** → [../DEPLOYMENT.md](../DEPLOYMENT.md) (Troubleshooting section)  
**Forgot a command?** → [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)  
**Want to understand the system?** → [ARCHITECTURE.md](./ARCHITECTURE.md)  
**Need a pre-flight check?** → [CHECKLIST.md](./CHECKLIST.md)

## 💡 Tips

- Print **QUICK-REFERENCE.md** and keep it nearby
- Use **CHECKLIST.md** before every deployment
- Read **DEPLOYMENT.md** for comprehensive troubleshooting
- Check **ARCHITECTURE.md** to understand how it all works

## 🆘 Getting Help

1. Check the troubleshooting section in **[../DEPLOYMENT.md](../DEPLOYMENT.md)**
2. Run `fly logs` to see what's happening
3. Use `fly ssh console` to debug inside the container
4. Visit [Fly.io Community](https://community.fly.io/)

## 📝 Contributing

When updating these docs:
- Keep QUICK-REFERENCE.md concise and command-focused
- Add detailed explanations to DEPLOYMENT.md
- Update CHECKLIST.md with new verification steps
- Keep FILES.md in sync with actual files

---

**Last Updated**: November 2025  
**Maintained by**: Development Team
