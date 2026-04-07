#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🧪 Video Shoppe - Verification Script for Linux/macOS
# ═══════════════════════════════════════════════════════════════
# Checks if all components are properly installed and running
# ═══════════════════════════════════════════════════════════════

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

# Helper functions
print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC}"
}

print_error() {
    echo -e "${RED}✗${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}"
}

check_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
        return $?
    elif command -v timeout &> /dev/null; then
        timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$port" 2>/dev/null
        return $?
    else
        # Fallback: assume not running
        return 1
    fi
}

# Start verification
clear
echo ""
print_header "🧪 Video Shoppe System Check"
print_header "================================"
echo ""

ALL_PASSED=true

# Check Node.js
echo -n "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success
    echo "  Node.js $NODE_VERSION"
else
    print_error
    ALL_PASSED=false
fi

# Check npm
echo -n "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success
    echo "  npm $NPM_VERSION"
else
    print_error
    ALL_PASSED=false
fi

# Check Frontend dependencies
echo -n "Checking Frontend dependencies..."
if [ -d "../Frontend/React/node_modules" ]; then
    print_success
else
    print_error
    ALL_PASSED=false
fi

# Check Backend dependencies
echo -n "Checking Backend dependencies..."
if [ -d "../Backend/node_modules" ]; then
    print_success
else
    print_error
    ALL_PASSED=false
fi

# Check Prisma Client
echo -n "Checking Prisma Client..."
if [ -d "../Backend/node_modules/.prisma/client" ]; then
    print_success
else
    print_error
    ALL_PASSED=false
fi

# Check Frontend .env
echo -n "Checking Frontend config..."
if [ -f "../Frontend/React/.env" ]; then
    print_success
else
    print_error
    ALL_PASSED=false
fi

# Check Backend .env
echo -n "Checking Backend config..."
if [ -f "../Backend/.env" ]; then
    print_success
else
    print_error
    ALL_PASSED=false
fi

# Test Backend API
echo -n "Testing Backend API..."
if check_port 5000; then
    echo -e " ${GREEN}✓ Running on port 5000${NC}"
else
    echo -e " ${YELLOW}⚠ Not running${NC}"
    echo -e "${GRAY}  (Start with: npm run backend)${NC}"
fi

# Test Frontend server
echo -n "Testing Frontend server..."
if check_port 5173; then
    echo -e " ${GREEN}✓ Running on port 5173${NC}"
else
    echo -e " ${YELLOW}⚠ Not running${NC}"
    echo -e "${GRAY}  (Start with: npm run frontend)${NC}"
fi

echo ""
print_header "================================"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✨ All core components ready!${NC}"
    echo ""
    print_header "Application URLs:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:5000"
    echo ""
    print_header "Quick commands:"
    echo "  npm start      - Start both servers"
    echo "  npm run verify - Run this check again"
else
    echo -e "${YELLOW}⚠ Some components need setup${NC}"
    echo ""
    echo "Run: ${CYAN}npm run setup${NC}"
fi

echo ""
