#!/bin/bash

# DoAll Service Platform Setup Script
# This script helps you set up the application for development or production

set -e

echo "🚀 DoAll Service Platform Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Check if Docker is installed (optional)
if command -v docker &> /dev/null; then
    echo "✓ Docker $(docker -v | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1) detected"
else
    echo "⚠️  Docker not found (optional - needed for containerized deployment)"
fi

if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose detected"
else
    echo "⚠️  Docker Compose not found (optional)"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your credentials:"
    echo "   - MongoDB connection string"
    echo "   - JWT secrets"
    echo "   - Payment gateway keys (Razorpay)"
    echo "   - Email/SMS credentials"
    echo "   - Cloudinary credentials"
    echo "   - Google Maps API key"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if user wants to use Docker
echo "Do you want to start the application with Docker? (y/n)"
read -r USE_DOCKER

if [ "$USE_DOCKER" = "y" ] || [ "$USE_DOCKER" = "Y" ]; then
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is required but not installed."
        exit 1
    fi
    
    echo ""
    echo "🐳 Starting services with Docker Compose..."
    echo "This will start MongoDB, Redis, and the Backend API"
    echo ""
    
    docker-compose up -d
    
    echo ""
    echo "✓ Services started!"
    echo ""
    echo "📍 Application URLs:"
    echo "   - Backend API: http://localhost:11000"
    echo "   - Health Check: http://localhost:11000/health"
    echo "   - MongoDB: localhost:11300"
    echo "   - Redis: localhost:11200"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart: docker-compose restart"
    echo ""
else
    echo ""
    echo "📋 Manual Setup Instructions:"
    echo ""
    echo "1. Ensure MongoDB is running (or use a cloud MongoDB Atlas instance)"
    echo "2. Ensure Redis is running (optional - for caching)"
    echo "3. Update .env file with your database connection strings"
    echo "4. Start the application:"
    echo ""
    echo "   Development mode:"
    echo "   $ npm run dev"
    echo ""
    echo "   Production mode:"
    echo "   $ npm start"
    echo ""
    echo "📍 Application will run on: http://localhost:11000"
    echo ""
fi

echo "📚 Documentation:"
echo "   - README.md - General project documentation"
echo "   - DOCKER_DEPLOYMENT.md - Docker deployment guide"
echo "   - DRIVER_BULAAO_README.md - Driver service features"
echo ""
echo "✅ Setup complete!"
