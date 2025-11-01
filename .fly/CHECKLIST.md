# Pre-Deployment Checklist

## ✅ Before You Deploy

### 1. Prerequisites Installed
- [ ] Docker Desktop installed and running
- [ ] Fly.io CLI installed (`iwr https://fly.io/install.ps1 -useb | iex`)
- [ ] Fly.io account created (https://fly.io/signup)
- [ ] Git installed (for version control)

### 2. Environment Variables Ready
- [ ] `GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey
- [ ] `MONGO_URI` - MongoDB connection string (use MongoDB Atlas)
- [ ] `JWT_SECRET` - Strong secret key for JWT (32+ random characters)
- [ ] `FRONTEND_URL` - URL where your frontend will be hosted

### 3. MongoDB Setup
- [ ] MongoDB Atlas account created (or other MongoDB host)
- [ ] Database created
- [ ] User with read/write permissions created
- [ ] Network access configured (allow 0.0.0.0/0 or Fly.io IPs)
- [ ] Connection string tested

### 4. Code Verification
- [ ] Server code builds successfully (`cd server && npm run build`)
- [ ] No TypeScript errors
- [ ] All dependencies in package.json
- [ ] Environment variable names match in code

### 5. Configuration Files
- [ ] `fly.toml` exists in root directory
- [ ] `Dockerfile` exists in root directory
- [ ] `.dockerignore` exists
- [ ] `.flyignore` exists
- [ ] App name in `fly.toml` is unique

## 🧪 Testing Locally (Recommended)

### 1. Test Docker Build
```powershell
.\test-docker.ps1
```
Or manually:
```powershell
docker build -t surge-ai-test .
docker run -d -p 5000:5000 -p 8001:8001 surge-ai-test
```

### 2. Verify Services
- [ ] Node.js server responds: http://localhost:5000
- [ ] TTS service responds: http://localhost:8001/health
- [ ] Health check works: http://localhost:5000/health
- [ ] API endpoints work: http://localhost:5000/api/...

### 3. Check Logs
```powershell
docker logs surge-ai-test-container
```
- [ ] No error messages
- [ ] Both services started successfully
- [ ] MongoDB connection successful

## 🚀 Deployment Steps

### 1. Login to Fly.io
```powershell
fly auth login
```
- [ ] Successfully logged in

### 2. Create App
```powershell
fly apps create your-app-name
```
- [ ] App created successfully
- [ ] Name matches `fly.toml`

### 3. Set Secrets
```powershell
fly secrets set GEMINI_API_KEY="..." -a your-app-name
fly secrets set MONGO_URI="..." -a your-app-name
fly secrets set JWT_SECRET="..." -a your-app-name
fly secrets set FRONTEND_URL="..." -a your-app-name
```
- [ ] All secrets set
- [ ] Verify with: `fly secrets list -a your-app-name`

### 4. Deploy
```powershell
fly deploy
```
Or use setup script:
```powershell
.\setup-fly.ps1
```
- [ ] Build completed successfully
- [ ] Deployment successful
- [ ] App is running

## ✅ Post-Deployment Verification

### 1. Check Deployment Status
```powershell
fly status -a your-app-name
```
- [ ] Status shows "running"
- [ ] Health checks passing

### 2. Test Endpoints
- [ ] Root: https://your-app-name.fly.dev/
- [ ] Health: https://your-app-name.fly.dev/health
- [ ] API: https://your-app-name.fly.dev/api/...

### 3. Check Logs
```powershell
fly logs -a your-app-name
```
- [ ] No critical errors
- [ ] Both services started
- [ ] MongoDB connected
- [ ] TTS model loaded

### 4. Test Functionality
- [ ] Can create user / login
- [ ] API endpoints respond correctly
- [ ] TTS generation works
- [ ] Socket.IO connections work
- [ ] Database operations work

### 5. Monitor Performance
- [ ] Check dashboard: `fly dashboard -a your-app-name`
- [ ] Memory usage < 80%
- [ ] CPU usage normal
- [ ] No frequent restarts

## 🔧 Common Issues & Solutions

### Build Fails
- [ ] Run `fly deploy --no-cache`
- [ ] Check Dockerfile syntax
- [ ] Verify all COPY paths exist

### Services Won't Start
- [ ] Check logs: `fly logs`
- [ ] Verify secrets are set
- [ ] SSH in: `fly ssh console` → `supervisorctl status`

### MongoDB Connection Issues
- [ ] Verify MONGO_URI is correct
- [ ] Check MongoDB Atlas network access (0.0.0.0/0)
- [ ] Ensure user has correct permissions

### Health Check Fails
- [ ] Wait 1-2 minutes for services to fully start
- [ ] Check logs for errors
- [ ] Verify both services are running

### High Memory Usage
- [ ] TTS model is ~600MB (normal)
- [ ] Consider upgrading to 4GB if needed: `fly scale memory 4096`

### Slow Response Times
- [ ] First request may be slow (cold start)
- [ ] Set `min_machines_running = 1` in fly.toml to keep warm
- [ ] Check database response times

## 📱 Frontend Integration

### Update Frontend Environment
- [ ] Set `NEXT_PUBLIC_API_URL=https://your-app-name.fly.dev`
- [ ] Update Socket.IO connection URL
- [ ] Update CORS in server if needed
- [ ] Test from frontend

### CORS Configuration
In `server/src/main.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL, // Should match your frontend URL
}));
```
- [ ] FRONTEND_URL secret matches actual frontend URL
- [ ] CORS allows your frontend domain

## 🔐 Security Checklist

- [ ] All secrets stored in Fly.io secrets (not in code)
- [ ] MongoDB uses strong password
- [ ] JWT_SECRET is strong and random
- [ ] HTTPS enabled (automatic with Fly.io)
- [ ] No sensitive data in logs
- [ ] MongoDB network access properly configured

## 📊 Monitoring Setup

- [ ] Fly.io dashboard accessible
- [ ] Understand metrics (CPU, RAM, requests)
- [ ] Know how to check logs
- [ ] Have alerting plan for downtime

## 💰 Cost Management

- [ ] Understand Fly.io pricing
- [ ] Auto-scaling configured
- [ ] Monitor usage in dashboard
- [ ] Set billing alerts (if available)
- [ ] Scale to zero when possible

## 📚 Documentation

- [ ] Team knows how to check logs
- [ ] Team knows how to deploy updates
- [ ] Emergency contacts documented
- [ ] Deployment process documented

## 🎯 Optional Enhancements

- [ ] Custom domain configured: `fly certs create domain.com`
- [ ] GitHub Actions CI/CD set up
- [ ] Monitoring/alerting configured
- [ ] Backup strategy for database
- [ ] Staging environment created

## ✅ Final Checklist

- [ ] Application is accessible
- [ ] All features work as expected
- [ ] No errors in logs
- [ ] Performance is acceptable
- [ ] Frontend can connect
- [ ] Database operations work
- [ ] TTS service generates audio
- [ ] Socket.IO real-time features work

---

## 🆘 Getting Help

If you encounter issues:
1. Check `DEPLOYMENT.md` for troubleshooting
2. Review logs: `fly logs`
3. SSH into container: `fly ssh console`
4. Fly.io community: https://community.fly.io/
5. Fly.io docs: https://fly.io/docs/

---

**Checklist Version**: 1.0  
**Last Updated**: November 2025
