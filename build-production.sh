#!/bin/bash

# Production Build Script for English Quiz App

echo "🚀 Building English Quiz App for Production..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Check if dist directory was created
if [ ! -d "dist" ]; then
    echo "❌ Build output directory 'dist' not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📁 Build output: ./dist/"
echo "📊 Build size:"
du -sh dist/

echo ""
echo "🎯 Next steps:"
echo "1. Deploy ./dist/ to Vercel"
echo "2. Deploy ./server/ to Render"
echo "3. Configure environment variables"
echo "4. Test production deployment"

echo ""
echo "🌐 Quick test local build:"
echo "   npm run preview"
