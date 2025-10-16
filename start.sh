#!/bin/bash

# Quiz Generator - Docker Startup Script

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║         Quiz Generator - Docker Setup                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your Google Gemini API key"
    echo "   Run: nano .env"
    echo "   Or: vim .env"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Validate API key
if grep -q "your_google_gemini_api_key_here" .env; then
    echo "❌ Please set your Google Gemini API key in .env file"
    exit 1
fi

echo "✅ Environment file configured"
echo ""

# Check if ports are available
echo "🔍 Checking port availability..."

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "❌ Port $1 is already in use. Please free it or change the port in docker-compose.yml"
        exit 1
    fi
}

check_port 8080
check_port 3001
check_port 5001

echo "✅ All ports are available"
echo ""

# Ask user for build or start
echo "🚀 Starting Quiz Generator..."
echo ""
echo "Options:"
echo "  1) Build and start (first time or after code changes)"
echo "  2) Start only (if already built)"
echo "  3) Start in detached mode (background)"
echo ""
read -p "Choose option [1-3]: " choice

case $choice in
    1)
        echo "🔨 Building and starting services..."
        docker-compose up --build
        ;;
    2)
        echo "▶️  Starting services..."
        docker-compose up
        ;;
    3)
        echo "▶️  Starting services in detached mode..."
        docker-compose up -d
        echo ""
        echo "✅ Services started in background"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║             Quiz Generator is Running!                 ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Frontend:        http://localhost:8080                ║"
echo "║  Backend API:     http://localhost:3001                ║"
echo "║  YouTube Service: http://localhost:5001                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📝 To stop: Press Ctrl+C (or run 'docker-compose down')"
echo ""
