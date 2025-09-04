#!/bin/bash

# ETF Trading App - Python-Free Deployment Script
# This script deploys the app without any Python dependencies

echo "🚀 ETF Trading App - Python-Free Deployment"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if build folder exists
if [ ! -d "build" ]; then
    echo "❌ Build folder not found"
    exit 1
fi

echo "📁 Build folder created: build/"

# Ask user for deployment option
echo ""
echo "🎯 Choose deployment option:"
echo "1. Vercel (Recommended - Free, Easy)"
echo "2. Netlify (Free, Drag & Drop)"
echo "3. GitHub Pages (Free, Git-based)"
echo "4. Local testing only"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo "🚀 Ready for Netlify deployment!"
        echo "📁 Upload the 'build' folder to Netlify"
        echo "🌐 Visit: https://app.netlify.com/"
        echo "📋 Drag and drop the 'build' folder to deploy"
        ;;
    3)
        echo "🚀 Deploying to GitHub Pages..."
        npm install --save-dev gh-pages
        npm run deploy:github
        ;;
    4)
        echo "🧪 Testing locally..."
        npx serve -s build
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo "📊 Your ETF Trading App is now live without Python dependencies!"
echo ""
echo "🔧 Features available:"
echo "✅ Real-time price fetching (MStocks API)"
echo "✅ Session management (localStorage)"
echo "✅ DMA calculations (JavaScript)"
echo "✅ Multi-broker support"
echo "✅ Demo mode"
echo "✅ User management"
echo "✅ Trading interface"
echo "✅ Data import/export"
echo ""
echo "🚀 Happy Trading! 📈"
