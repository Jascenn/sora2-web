#!/bin/bash

# Sora2 Development Startup Script
# This script starts both the backend API and frontend in development mode

set -e

echo "🚀 Starting Sora2 Development Servers..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}⚠️  Port $port is already in use. Attempting to free it...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check and handle port conflicts
echo -e "${BLUE}📡 Checking ports...${NC}"

if check_port 3101; then
    kill_port 3101
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use. Frontend will use port 3200 instead.${NC}"
    FRONTEND_PORT=3200
else
    FRONTEND_PORT=3000
fi

# Check if backend API exists
if [ ! -d "apps/api" ]; then
    echo -e "${RED}❌ Error: apps/api directory not found${NC}"
    exit 1
fi

# Check if node_modules exist
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Root dependencies not found. Installing...${NC}"
    npm install
fi

if [ ! -d "apps/api/node_modules" ]; then
    echo -e "${YELLOW}⚠️  API dependencies not found. Installing...${NC}"
    cd apps/api
    npm install
    cd ../..
fi

# Check environment files
echo -e "${BLUE}🔧 Checking environment configuration...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3101" > .env.local
fi

if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/api/.env not found. Creating from template...${NC}"
    if [ -f ".env" ]; then
        cp .env apps/api/.env
    else
        echo -e "${RED}❌ Error: No .env template found${NC}"
        exit 1
    fi
fi

# Create log directory
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit
}

trap cleanup EXIT INT TERM

# Start backend API
echo ""
echo -e "${GREEN}🔧 Starting Backend API on port 3101...${NC}"
cd apps/api
npm run dev > ../../logs/api.log 2>&1 &
API_PID=$!
cd ../..

# Wait a bit for API to start
sleep 2

# Check if API started successfully
if check_port 3101; then
    echo -e "${GREEN}✅ Backend API started successfully on http://localhost:3101${NC}"
    echo -e "${BLUE}📚 API Documentation: http://localhost:3101/api-docs${NC}"
else
    echo -e "${RED}❌ Failed to start Backend API${NC}"
    echo -e "${YELLOW}Check logs/api.log for details${NC}"
    tail -20 logs/api.log
    exit 1
fi

# Start frontend
echo ""
echo -e "${GREEN}🎨 Starting Frontend on port $FRONTEND_PORT...${NC}"
npm run dev -- -p $FRONTEND_PORT > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if check_port $FRONTEND_PORT; then
    echo -e "${GREEN}✅ Frontend started successfully on http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${RED}❌ Failed to start Frontend${NC}"
    echo -e "${YELLOW}Check logs/frontend.log for details${NC}"
    tail -20 logs/frontend.log
    exit 1
fi

# Display status
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Sora2 Development Servers Running ✨${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC}       http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}Backend API:${NC}    http://localhost:3101"
echo -e "${BLUE}API Docs:${NC}       http://localhost:3101/api-docs"
echo -e "${BLUE}Health Check:${NC}   http://localhost:3101/api/health"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo -e "  Frontend: logs/frontend.log"
echo -e "  Backend:  logs/api.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Tail both logs
tail -f logs/api.log logs/frontend.log 2>/dev/null || wait
