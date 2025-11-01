# Local Test Script for Fly.io Deployment
# This script builds and tests the Docker container locally before deploying to Fly.io

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Local Docker Build & Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
    
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Docker Image" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$imageName = "surge-ai-test"

Write-Host "Building image: $imageName" -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Gray
docker build -t $imageName .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Build successful!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Container" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop and remove existing container if it exists
docker stop surge-ai-test-container 2>$null
docker rm surge-ai-test-container 2>$null

Write-Host "Starting container..." -ForegroundColor Yellow
Write-Host "Node server will be available at: http://localhost:5000" -ForegroundColor White
Write-Host "TTS service will be available at: http://localhost:8001" -ForegroundColor White
Write-Host ""

# Load environment variables from server/.env if it exists
$envArgs = @()
if (Test-Path "server\.env") {
    Write-Host "Loading environment variables from server\.env" -ForegroundColor Gray
    Get-Content "server\.env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $envArgs += "-e"
            $envArgs += "$($matches[1])=$($matches[2])"
        }
    }
}

# Default environment variables
$defaultEnvVars = @(
    "-e", "NODE_ENV=production",
    "-e", "PORT=5000",
    "-e", "TTS_SERVICE_URL=http://localhost:8001",
    "-e", "PYTHONUNBUFFERED=1"
)

docker run -d `
    --name surge-ai-test-container `
    -p 5000:5000 `
    -p 8001:8001 `
    @defaultEnvVars `
    @envArgs `
    $imageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Container started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow

# Wait for services to start
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Node server
Write-Host "Testing Node server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Node server is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Node server is not responding" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
}

Write-Host ""

# Test TTS service
Write-Host "Testing TTS service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ TTS service is responding" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ TTS service is not responding" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Container Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Showing last 30 lines of logs:" -ForegroundColor Yellow
docker logs --tail 30 surge-ai-test-container

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:         docker logs -f surge-ai-test-container" -ForegroundColor White
Write-Host "  Stop container:    docker stop surge-ai-test-container" -ForegroundColor White
Write-Host "  Remove container:  docker rm surge-ai-test-container" -ForegroundColor White
Write-Host "  SSH into container: docker exec -it surge-ai-test-container /bin/bash" -ForegroundColor White
Write-Host "  Check services:    docker exec surge-ai-test-container supervisorctl status" -ForegroundColor White
Write-Host ""

$keepRunning = Read-Host "Keep container running? (y/n)"
if ($keepRunning -ne "y") {
    Write-Host ""
    Write-Host "Stopping and removing container..." -ForegroundColor Yellow
    docker stop surge-ai-test-container
    docker rm surge-ai-test-container
    Write-Host "✓ Container stopped and removed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Container is still running. Access it at:" -ForegroundColor Green
    Write-Host "  Node server: http://localhost:5000" -ForegroundColor White
    Write-Host "  TTS service: http://localhost:8001" -ForegroundColor White
}

Write-Host ""
Write-Host "Ready to deploy to Fly.io! Run:" -ForegroundColor Green
Write-Host "  .\setup-fly.ps1" -ForegroundColor White
Write-Host "or" -ForegroundColor Green
Write-Host "  fly deploy" -ForegroundColor White
