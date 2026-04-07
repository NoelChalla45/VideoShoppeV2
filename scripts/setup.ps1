#!/usr/bin/env powershell
# Video Shoppe Setup Script
# This script installs all dependencies and sets up the project

Write-Host "🎬 Video Shoppe Setup" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install Frontend Dependencies
Write-Host "`n📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location "Frontend\React"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location "..\..\"

# Install Backend Dependencies
Write-Host "`n📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "Backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Generate Prisma Client
Write-Host "`n🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Prisma generation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

Set-Location ".."

Write-Host "`n✨ Setup Complete!" -ForegroundColor Green
Write-Host "`nTo start the application:" -ForegroundColor Cyan
Write-Host "  Frontend: cd Frontend\React && npm run dev" -ForegroundColor White
Write-Host "  Backend:  cd Backend && npm run dev" -ForegroundColor White
Write-Host "`nOr use: npm start (starts both servers)" -ForegroundColor Cyan
