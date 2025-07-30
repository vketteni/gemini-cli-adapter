#!/bin/bash

# Script to update Google's CLI frontend from upstream
# This maintains the ability to automatically sync with Google's changes

set -e

echo "🔄 Updating Google CLI frontend from upstream..."

# Fetch latest from Google's repository
git fetch google-cli main

# Create a temporary directory to extract just the CLI package
TEMP_DIR=$(mktemp -d)
echo "📁 Using temporary directory: $TEMP_DIR"

# Clone Google's repo to temp location
git clone --depth 1 https://github.com/google-gemini/gemini-cli.git "$TEMP_DIR/google-cli"

# Get the current commit hash for attribution
GOOGLE_COMMIT=$(cd "$TEMP_DIR/google-cli" && git rev-parse HEAD)
echo "📝 Google CLI commit: $GOOGLE_COMMIT"

# Remove existing CLI frontend (except our modifications)
# TODO: Add logic to preserve adapter-specific modifications
rm -rf packages/cli-frontend
mkdir -p packages/cli-frontend

# Copy the CLI package
cp -r "$TEMP_DIR/google-cli/packages/cli/"* packages/cli-frontend/

# Clean up
rm -rf "$TEMP_DIR"

# Stage the changes
git add packages/cli-frontend

# Create commit with proper attribution
git commit -m "feat: update Google CLI frontend to commit $GOOGLE_COMMIT

Synced with upstream Google Gemini CLI
Source: https://github.com/google-gemini/gemini-cli/tree/$GOOGLE_COMMIT/packages/cli

Changes:
- Updated all UI components and themes  
- Latest command implementations
- Bug fixes and improvements from Google team

Next step: Re-apply adapter interface modifications"

echo "✅ Google CLI frontend updated successfully!"
echo "⚠️  Remember to re-apply adapter interface modifications"
echo "🔧 Run: npm run adapt-cli-for-adapters"