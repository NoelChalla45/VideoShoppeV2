#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🎬 Video Shoppe - Setup Script for Linux/macOS
# ═══════════════════════════════════════════════════════════════
# This script installs all dependencies and sets up the project
# Works on macOS and Linux (Ubuntu, Debian, Fedora, etc.)
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "$1"
}

# Start setup
clear
echo ""
print_header "🎬 Video Shoppe Setup"
print_header "====================="
echo ""

# Check if running on macOS or Linux
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=macOS;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_info "Detected OS: ${MACHINE}"
echo ""

# Check for Node.js
print_info "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION detected"
    else
        print_warning "Node.js $NODE_VERSION detected (v18+ recommended)"
    fi
else
    print_error "Node.js is not installed!"
    echo ""
    print_info "Please install Node.js v18 or higher:"
    
    if [ "$MACHINE" = "macOS" ]; then
        echo "  Using Homebrew: brew install node"
        echo "  Or download from: https://nodejs.org/"
    else
        echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
        echo "  Fedora: sudo dnf install nodejs npm"
        echo "  Or download from: https://nodejs.org/"
    fi
    
    exit 1
fi

# Check for npm
print_info "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION detected"
else
    print_error "npm is not installed!"
    exit 1
fi

# Install Frontend Dependencies
echo ""
print_header "📦 Installing Frontend Dependencies..."
cd ../Frontend/React

if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Frontend installation failed"
    exit 1
fi

cd ../..

# Install Backend Dependencies
echo ""
print_header "📦 Installing Backend Dependencies..."
cd Backend

if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Backend installation failed"
    exit 1
fi

# Generate Prisma Client
echo ""
print_header "🔧 Generating Prisma Client..."
if npx prisma generate; then
    print_success "Prisma client generated"
else
    print_error "Prisma generation failed"
    exit 1
fi

cd ..

# Success message
echo ""
print_header "✨ Setup Complete!"
echo ""
print_info "To start the application:"
print_info "  ${CYAN}npm start${NC}          - Start both servers"
print_info "  ${CYAN}npm run frontend${NC}   - Start frontend only"
print_info "  ${CYAN}npm run backend${NC}    - Start backend only"
print_info "  ${CYAN}npm run verify${NC}     - Verify installation"
echo ""
print_info "Application will run at:"
print_info "  Frontend: ${GREEN}http://localhost:5173${NC}"
print_info "  Backend:  ${GREEN}http://localhost:5000${NC}"
echo ""
