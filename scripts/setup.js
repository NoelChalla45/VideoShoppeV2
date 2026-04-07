#!/usr/bin/env node

/**
 * 🎬 Video Shoppe - Cross-Platform Setup Script
 * Works on Windows, macOS, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function run(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major < 18) {
    log('⚠️  Warning: Node.js 18+ recommended. Current: ' + version, 'yellow');
  } else {
    log('✓ Node.js ' + version + ' detected', 'green');
  }
}

console.log('');
log('🎬 Video Shoppe Setup', 'cyan');
log('=====================\n', 'cyan');

// Check Node.js version
checkNodeVersion();

// Install Frontend Dependencies
log('\n📦 Installing Frontend Dependencies...', 'yellow');
const frontendPath = path.join(__dirname, '..', 'Frontend', 'React');
if (run('npm install', frontendPath)) {
  log('✓ Frontend dependencies installed', 'green');
} else {
  log('✗ Frontend installation failed', 'red');
  process.exit(1);
}

// Install Backend Dependencies
log('\n📦 Installing Backend Dependencies...', 'yellow');
const backendPath = path.join(__dirname, '..', 'Backend');
if (run('npm install', backendPath)) {
  log('✓ Backend dependencies installed', 'green');
} else {
  log('✗ Backend installation failed', 'red');
  process.exit(1);
}

// Generate Prisma Client
log('\n🔧 Generating Prisma Client...', 'yellow');
if (run('npx prisma generate', backendPath)) {
  log('✓ Prisma client generated', 'green');
} else {
  log('✗ Prisma generation failed', 'red');
  process.exit(1);
}

log('\n✨ Setup Complete!', 'green');
log('\nTo start the application:', 'cyan');
log('  npm start          - Start both servers', 'white');
log('  npm run frontend   - Start frontend only', 'white');
log('  npm run backend    - Start backend only', 'white');
log('  npm run verify     - Verify installation\n', 'white');
