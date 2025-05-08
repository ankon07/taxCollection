#!/bin/bash

# Run the backend and frontend servers concurrently
# This script helps test the connection between the frontend and backend

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting ZKP Tax System Development Environment${NC}"
echo -e "${BLUE}This script will start both the backend and frontend servers${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
echo ""

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT

# Start the backend server
echo -e "${GREEN}Starting Backend Server...${NC}"
cd "$(dirname "$0")/backend" && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend server
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd "$(dirname "$0")/frontend" && npm start &
FRONTEND_PID=$!

# Keep the script running
echo -e "\n${GREEN}Both servers are running!${NC}"
echo -e "${BLUE}Backend: http://localhost:5000${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
