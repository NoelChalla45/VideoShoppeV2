#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 Video Shoppe - Quick Start Script
# ═══════════════════════════════════════════════════════════════
# Starts both frontend and backend servers concurrently
# Press Ctrl+C to stop both servers
# ═══════════════════════════════════════════════════════════════

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🎬 Starting Video Shoppe...${NC}"
echo ""

# Check if concurrently is installed
if ! npm list -g concurrently &> /dev/null && ! npm list concurrently &> /dev/null; then
    echo -e "${YELLOW}Installing concurrently...${NC}"
    npm install
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill 0
    exit
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start backend in background
echo -e "${GREEN}Starting Backend (port 5000)...${NC}"
cd ../Backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in background
echo -e "${GREEN}Starting Frontend (port 5173)...${NC}"
cd Frontend/React
npm run dev &
FRONTEND_PID=$!
cd ../..

sleep 2

echo ""
echo -e "${GREEN}✨ Both servers started!${NC}"
echo ""
echo -e "  Frontend: ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend:  ${CYAN}http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for background processes
wait
