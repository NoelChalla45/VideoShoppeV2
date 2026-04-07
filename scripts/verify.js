#!/usr/bin/env node

/**
 * 🧪 Video Shoppe - Cross-Platform Verification Script
 * Works on Windows, macOS, and Linux
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPath(filePath, description) {
  process.stdout.write(`Checking ${description}...`);
  if (fs.existsSync(filePath)) {
    log(' ✓', 'green');
    return true;
  } else {
    log(' ✗', 'red');
    return false;
  }
}

function checkServer(port, name, callback) {
  process.stdout.write(`Testing ${name}...`);
  
  const req = http.get(`http://localhost:${port}`, (res) => {
    log(' ✓ Running on port ' + port, 'green');
    callback(true);
  });

  req.on('error', () => {
    log(' ⚠ Not running', 'yellow');
    log(`  (Start with: npm run ${name.toLowerCase()})`, 'gray');
    callback(false);
  });

  req.setTimeout(2000, () => {
    req.destroy();
    log(' ⚠ Not running (timeout)', 'yellow');
    callback(false);
  });
}

console.log('');
log('🧪 Video Shoppe System Check', 'cyan');
log('================================', 'cyan');
console.log('');

let allPassed = true;

// Check Node.js
log(`Node.js ${process.version}`, 'green');

// Check Frontend dependencies
if (!checkPath(path.join(__dirname, '..', 'Frontend', 'React', 'node_modules'), 'Frontend dependencies')) {
  allPassed = false;
}

// Check Backend dependencies
if (!checkPath(path.join(__dirname, '..', 'Backend', 'node_modules'), 'Backend dependencies')) {
  allPassed = false;
}

// Check Prisma Client
if (!checkPath(path.join(__dirname, '..', 'Backend', 'node_modules', '.prisma', 'client'), 'Prisma Client')) {
  allPassed = false;
}

// Check Frontend .env
if (!checkPath(path.join(__dirname, '..', 'Frontend', 'React', '.env'), 'Frontend config')) {
  allPassed = false;
}

// Check Backend .env
if (!checkPath(path.join(__dirname, '..', 'Backend', '.env'), 'Backend config')) {
  allPassed = false;
}

// Test servers (async)
let serversChecked = 0;
const totalServers = 2;
const serverResults = [];

function onServerCheck(result) {
  serversChecked++;
  serverResults.push(result);
  
  if (serversChecked === totalServers) {
    log('');
    log('================================', 'cyan');
    
    if (allPassed) {
      log('✨ All core components ready!', 'green');
      log('');
      log('Application URLs:', 'cyan');
      log('  Frontend: http://localhost:5173', 'white');
      log('  Backend:  http://localhost:5000', 'white');
      log('');
      log('Quick commands:', 'cyan');
      log('  npm start      - Start both servers', 'white');
      log('  npm run verify - Run this check again', 'white');
    } else {
      log('⚠ Some components need setup', 'yellow');
      log('');
      log('Run: npm run setup', 'cyan');
    }
    log('');
  }
}

checkServer(5000, 'Backend', onServerCheck);
checkServer(5173, 'Frontend', onServerCheck);
