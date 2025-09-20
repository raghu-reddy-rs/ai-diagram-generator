#!/bin/bash

# Analyzer Setup Script
echo "🚀 Setting up Analyzer..."

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

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if Gemini CLI is installed
if ! command -v gemini &> /dev/null; then
    echo "📦 Installing Gemini CLI..."
    npm install -g @google/gemini-cli
    
    if ! command -v gemini &> /dev/null; then
        echo "❌ Failed to install Gemini CLI. Please install manually:"
        echo "   npm install -g @google/gemini-cli"
        exit 1
    fi
    echo "✅ Gemini CLI installed successfully"
else
    echo "✅ Gemini CLI is already installed"
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check for API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo "⚠️  GEMINI_API_KEY environment variable is not set"
    echo "💡 To set your API key, run:"
    echo "   export GEMINI_API_KEY=\"your-api-key-here\""
else
    echo "✅ GEMINI_API_KEY is already set"
fi

# Test the setup
echo ""
echo "🧪 Testing the setup..."
if [ -n "$GEMINI_API_KEY" ]; then
    node src/cli.js test
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Setup completed successfully!"
        echo ""
        echo "📝 Quick start:"
        echo "   # Analyze current directory"
        echo "   node src/cli.js analyze"
        echo ""
        echo "   # Analyze a git repository"
        echo "   node src/cli.js analyze https://github.com/user/repo.git"
        echo ""
        echo "   # Use custom prompt"
        echo "   node src/cli.js analyze --prompt \"Create a sequence diagram\""
        echo ""
    else
        echo "❌ Setup test failed. Please check your configuration."
        exit 1
    fi
else
    echo "⚠️  Skipping test due to missing API key"
    echo "🎉 Setup completed! Set GEMINI_API_KEY to start using the analyzer."
fi
