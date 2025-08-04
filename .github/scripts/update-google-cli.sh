#!/bin/bash

# Script to facilitate updating the refactored open-cli module from Google's original CLI.
# This script implements the "Upstream-Diff" workflow.

set -e

UPSTREAM_REMOTE="upstream"
UPSTREAM_BRANCH="main"
UPSTREAM_PATH="packages/cli"

LOCAL_PATH="packages/open-cli"
TEMP_COMPARISON_DIR="tmp/upstream-cli"

echo "🔄 Starting the 'Upstream-Diff' workflow to update from Google's Gemini CLI..."

# 1. Fetch latest from the upstream repository
echo "📡 Fetching latest changes from $UPSTREAM_REMOTE..."
git fetch $UPSTREAM_REMOTE $UPSTREAM_BRANCH

# 2. Create a clean, temporary directory for comparison
echo "📁 Clearing and creating temporary comparison directory: $TEMP_COMPARISON_DIR"
rm -rf $TEMP_COMPARISON_DIR
mkdir -p $TEMP_COMPARISON_DIR

# 3. Checkout the original Google CLI source into the temporary directory
echo "🔍 Checking out the contents of '$UPSTREAM_PATH' from '$UPSTREAM_REMOTE/$UPSTREAM_BRANCH'...
"
git checkout $UPSTREAM_REMOTE/$UPSTREAM_BRANCH -- $UPSTREAM_PATH

# Move the checked-out files to the clean temporary directory
mv $UPSTREAM_PATH/* $TEMP_COMPARISON_DIR

# Restore the state of the local repository (git checkout modifies the index)
git restore $UPSTREAM_PATH

echo "✅ The latest upstream code is now available in: $TEMP_COMPARISON_DIR"

# 4. Provide clear instructions for the manual merge
echo "
---

##  actionable-instruction

**Next Steps: Manual Merge Required**

The automated part of the update is complete. Now, you must manually merge the changes.

1.  **Use a Diff Tool:**
    Open your preferred visual diffing tool to compare the following two directories:
    - **Your local module:** `$LOCAL_PATH`
    - **The upstream code:** `$TEMP_COMPARISON_DIR`

    *Suggestion: In VS Code, right-click on the first folder, select 'Select for Compare', then right-click on the second folder and select 'Compare with Selected'.*

2.  **Port Relevant Changes:**
    Carefully review the differences and manually port the necessary updates from the upstream code into your local module. Remember to adapt the changes to the refactored architecture of Open CLI.

3.  **Commit Your Changes:**
    Once you have integrated the changes, commit them to your repository.

---
