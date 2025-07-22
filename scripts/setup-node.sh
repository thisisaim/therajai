#!/bin/bash

# Script to ensure correct Node.js version is used for Therajai
echo "🔧 Setting up Node.js environment for Therajai..."

# Source nvm to ensure it's available
if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh
elif [ -f /usr/local/share/nvm/nvm.sh ]; then
    source /usr/local/share/nvm/nvm.sh
fi

# Check if nvm is available after sourcing
if ! command -v nvm &> /dev/null; then
    echo "❌ nvm is not installed or not available"
    echo "Please install nvm from: https://github.com/nvm-sh/nvm"
    echo "After installation, restart your terminal and try again"
    exit 1
fi

# Check if .nvmrc exists
if [ ! -f .nvmrc ]; then
    echo "❌ .nvmrc file not found"
    exit 1
fi

# Read the required Node.js version from .nvmrc
REQUIRED_VERSION=$(cat .nvmrc)
echo "📋 Required Node.js version: $REQUIRED_VERSION"

# Check if the required version is installed
if ! nvm list | grep -q "$REQUIRED_VERSION"; then
    echo "📦 Installing Node.js $REQUIRED_VERSION..."
    nvm install "$REQUIRED_VERSION"
else
    echo "✅ Node.js $REQUIRED_VERSION is already installed"
fi

# Use the required version
echo "🔄 Switching to Node.js $REQUIRED_VERSION..."
nvm use "$REQUIRED_VERSION"

# Set as default if not already
if [ "$(nvm alias default)" != "default -> $REQUIRED_VERSION" ]; then
    echo "🎯 Setting Node.js $REQUIRED_VERSION as default..."
    nvm alias default "$REQUIRED_VERSION"
fi

# Verify the version
CURRENT_VERSION=$(node --version)
echo "✅ Current Node.js version: $CURRENT_VERSION"

# Check if it matches the required version
if [[ "$CURRENT_VERSION" == "$REQUIRED_VERSION" ]]; then
    echo "🎉 Node.js environment is correctly configured!"
    echo ""
    echo "You can now run:"
    echo "  npm install    # Install dependencies"
    echo "  npm run dev    # Start development server"
else
    echo "⚠️  Warning: Current version ($CURRENT_VERSION) doesn't match required version ($REQUIRED_VERSION)"
    echo "You may need to restart your terminal or run: source ~/.nvm/nvm.sh && nvm use"
fi