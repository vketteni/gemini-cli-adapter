#!/bin/bash

# OpenCLI - Global Installation Script

set -e

echo "🚀 Installing OpenCLI globally..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "🏗️  Building project..."
npm run build

# Install the CLI globally
echo "📦 Installing OpenCLI globally..."
npm install -g ./apps/open-cli

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 You can now use the CLI with these commands:"
echo "   open-cli --help"
echo "   open-cli list-adapters"
echo ""
echo "🔧 Set your preferred adapter:"
echo "   export GEMINI_ADAPTER_TYPE=google"
echo ""
echo "📋 To uninstall:"
echo "   npm uninstall -g @open-cli/open-cli"