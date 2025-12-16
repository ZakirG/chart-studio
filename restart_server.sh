#!/bin/bash

echo "🔄 Restarting development server on port 3019..."

# Kill any existing process on port 3019
echo "🛑 Killing existing process on port 3019..."
lsof -ti:3019 | xargs kill -9 2>/dev/null || echo "No existing process found on port 3019"

# Wait a moment for the port to be freed
sleep 2

# Start the development server
echo "🚀 Starting development server..."
npm run dev -- -p 3019

echo "✅ Development server should now be running on http://localhost:3019"
