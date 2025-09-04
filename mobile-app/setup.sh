#!/bin/bash

echo "🚀 Setting up ETF Trading Mobile App..."

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

# Install Expo CLI globally
echo "📦 Installing Expo CLI..."
npm install -g @expo/cli

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=https://api.mstocks.in
EXPO_PUBLIC_PROXY_URL=http://localhost:3001
EOF
    echo "✅ Created .env file with default values"
fi

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update API endpoints in .env file if needed"
echo "2. Run 'npm start' to start the development server"
echo "3. Use Expo Go app to scan QR code and test on device"
echo "4. Or press 'i' for iOS simulator or 'a' for Android emulator"
echo ""
echo "📱 Happy coding!"

