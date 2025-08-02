#!/bin/bash

# Gemini CLI Adapter - Global Installation Script

set -e

echo "🚀 Installing Gemini CLI Adapter globally..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "🏗️  Building project..."
npm run build

# Install the CLI globally
echo "📦 Installing CLI globally..."
npm install -g ./apps/gemini-cli

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 You can now use the CLI with these commands:"
echo "   gemini-adapter --help"
echo "   gemini-adapter list-adapters"
echo "   demo-cli --help         (legacy alias)"
echo ""
echo "🔧 Set your preferred adapter:"
echo "   export GEMINI_ADAPTER_TYPE=google"
echo ""
echo "📋 To uninstall:"
echo "   npm uninstall -g @gemini-cli-adapter/gemini-cli"