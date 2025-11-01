# Fly.io Deployment Setup Script
# This script helps you set up and deploy your application to Fly.io

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fly.io Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if flyctl is installed
Write-Host "Checking for Fly.io CLI..." -ForegroundColor Yellow
$flyCmd = Get-Command fly -ErrorAction SilentlyContinue
if (-not $flyCmd) {
    Write-Host "Fly.io CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Running: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Gray
    iwr https://fly.io/install.ps1 -useb | iex
} else {
    Write-Host "✓ Fly.io CLI is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Login to Fly.io" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
fly auth login

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "App Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$appName = Read-Host "Enter your app name (default: surge-ai-hackathon)"
if ([string]::IsNullOrWhiteSpace($appName)) {
    $appName = "surge-ai-hackathon"
}

Write-Host ""
Write-Host "Creating app: $appName" -ForegroundColor Yellow
fly apps create $appName 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "App might already exist or there was an error. Continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "You need to set the following secrets:" -ForegroundColor Yellow
Write-Host "1. GEMINI_API_KEY" -ForegroundColor White
Write-Host "2. MONGO_URI" -ForegroundColor White
Write-Host "3. JWT_SECRET" -ForegroundColor White
Write-Host "4. FRONTEND_URL" -ForegroundColor White
Write-Host ""

$setupSecrets = Read-Host "Do you want to set secrets now? (y/n)"
if ($setupSecrets -eq "y") {
    $geminiKey = Read-Host "Enter GEMINI_API_KEY"
    if (![string]::IsNullOrWhiteSpace($geminiKey)) {
        fly secrets set GEMINI_API_KEY="$geminiKey" -a $appName
    }
    
    $mongoUri = Read-Host "Enter MONGO_URI"
    if (![string]::IsNullOrWhiteSpace($mongoUri)) {
        fly secrets set MONGO_URI="$mongoUri" -a $appName
    }
    
    $jwtSecret = Read-Host "Enter JWT_SECRET"
    if (![string]::IsNullOrWhiteSpace($jwtSecret)) {
        fly secrets set JWT_SECRET="$jwtSecret" -a $appName
    }
    
    $frontendUrl = Read-Host "Enter FRONTEND_URL"
    if (![string]::IsNullOrWhiteSpace($frontendUrl)) {
        fly secrets set FRONTEND_URL="$frontendUrl" -a $appName
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update fly.toml" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Update app name in fly.toml
$flyToml = Get-Content "fly.toml" -Raw
$flyToml = $flyToml -replace 'app = ".*"', "app = `"$appName`""
$flyToml | Set-Content "fly.toml"
Write-Host "✓ Updated app name in fly.toml" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to Deploy!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To deploy your application, run:" -ForegroundColor Yellow
Write-Host "  fly deploy" -ForegroundColor White
Write-Host ""
Write-Host "To view logs after deployment:" -ForegroundColor Yellow
Write-Host "  fly logs" -ForegroundColor White
Write-Host ""
Write-Host "To check status:" -ForegroundColor Yellow
Write-Host "  fly status" -ForegroundColor White
Write-Host ""

$deploy = Read-Host "Do you want to deploy now? (y/n)"
if ($deploy -eq "y") {
    Write-Host ""
    Write-Host "Deploying..." -ForegroundColor Yellow
    fly deploy
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your app is deployed at: https://$appName.fly.dev" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Setup complete! Check .fly/deploy.md for more information." -ForegroundColor Green
