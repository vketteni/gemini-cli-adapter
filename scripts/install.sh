#!/bin/bash
# OpenCLI - Installation Script

set -euo pipefail
IFS=$'\n\t'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_FILE="${PROJECT_ROOT}/install-$(date +%Y%m%d-%H%M%S).log"
readonly REQUIRED_NODE_VERSION="20"
readonly REQUIRED_NPM_VERSION="9"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Global state
INSTALL_MODE="development"
CLEANUP_FILES=()

# Logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $*${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $*${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $*${NC}" | tee -a "$LOG_FILE" >&2
}

log_step() {
    echo -e "\n${BOLD}${BLUE}🔧 $*${NC}" | tee -a "$LOG_FILE"
}

# Cleanup handler
cleanup() {
    if [[ ${#CLEANUP_FILES[@]} -gt 0 ]]; then
        log "Cleaning up temporary files..."
        for file in "${CLEANUP_FILES[@]}"; do
            [[ -f "$file" ]] && rm -f "$file" 2>/dev/null || true
        done
    fi
}

# Error handler
error_exit() {
    local line_no=${1:-"unknown"}
    local error_code=${2:-1}
    log_error "Installation failed at line $line_no"
    log_error "See log: $LOG_FILE"
    cleanup
    exit "$error_code"
}

trap 'error_exit ${LINENO} $?' ERR
trap cleanup EXIT

# Usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    -m, --mode MODE     Installation mode: development (default) or production
    -h, --help          Show this help message

MODES:
    development         Fast npm link for local development (default)
    production          Create distributable package for deployment

EXAMPLES:
    $0                  # Development install with npm link
    $0 --mode production # Create production package
EOF
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                INSTALL_MODE="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate mode
    if [[ ! "$INSTALL_MODE" =~ ^(development|production)$ ]]; then
        log_error "Invalid mode: $INSTALL_MODE"
        show_usage
        exit 1
    fi
}

# System requirements check
check_requirements() {
    log_step "Checking system requirements"

    # OS check
    case "$(uname -s)" in
        Linux|Darwin)
            log "Operating system: $(uname -s) ✓"
            ;;
        *)
            log_warning "Unsupported OS: $(uname -s). May not work properly."
            ;;
    esac

    # Node.js check
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found. Install Node.js $REQUIRED_NODE_VERSION+ from https://nodejs.org/"
        exit 1
    fi

    local node_version
    node_version=$(node --version | sed 's/v//')
    if ! printf '%s\n%s\n' "$REQUIRED_NODE_VERSION" "$node_version" | sort -V -C; then
        log_error "Node.js $node_version is too old. Required: $REQUIRED_NODE_VERSION+"
        exit 1
    fi
    log "Node.js version: $node_version ✓"

    # npm check
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        exit 1
    fi

    local npm_version
    npm_version=$(npm --version)
    if ! printf '%s\n%s\n' "$REQUIRED_NPM_VERSION" "$npm_version" | sort -V -C; then
        log_error "npm $npm_version is too old. Required: $REQUIRED_NPM_VERSION+"
        exit 1
    fi
    log "npm version: $npm_version ✓"
}

# Validate project structure
validate_project() {
    log_step "Validating project structure"

    cd "$PROJECT_ROOT" || exit 1

    # Check required files
    local required_files=(
        "package.json"
        "apps/open-cli/package.json"
        "apps/open-cli/src/index.ts"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done

    # Validate JSON files
    for json_file in package.json apps/open-cli/package.json; do
        if ! node -e "JSON.parse(require('fs').readFileSync('$json_file', 'utf8'))" 2>/dev/null; then
            log_error "Invalid JSON: $json_file"
            exit 1
        fi
    done

    log_success "Project structure validated"
}

# Build project
build_project() {
    log_step "Building project"

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        npm install --no-audit --no-fund >> "$LOG_FILE" 2>&1
    fi

    # Build TypeScript
    log "Building TypeScript..."
    npm run build >> "$LOG_FILE" 2>&1

    # Verify build output
    if [[ ! -f "apps/open-cli/dist/index.js" ]]; then
        log_error "Build failed - missing apps/open-cli/dist/index.js"
        exit 1
    fi

    log_success "Project built successfully"
}

# Development installation
install_development() {
    log_step "Installing for development (npm link)"

    # Uninstall any existing global installation
    if npm list -g @open-cli/open-cli >/dev/null 2>&1; then
        log "Removing existing global installation..."
        npm uninstall -g @open-cli/open-cli >> "$LOG_FILE" 2>&1 || true
    fi

    # Link the CLI
    log "Creating npm link..."
    (cd apps/open-cli && npm link) >> "$LOG_FILE" 2>&1

    log_success "Development installation complete"
    log_warning "Note: This creates a symlink to your development directory"
}

# Production packaging
install_production() {
    log_step "Creating production package"

    # Create tarball
    local tarball_name
    log "Creating package tarball..."
    (cd apps/open-cli && npm pack --pack-destination="$PROJECT_ROOT") >> "$LOG_FILE" 2>&1

    # Find the created tarball
    tarball_name=$(find "$PROJECT_ROOT" -name "open-cli-*.tgz" -o -name "*open-cli*.tgz" | head -1)
    if [[ ! -f "$tarball_name" ]]; then
        log_error "Package tarball not found"
        exit 1
    fi

    CLEANUP_FILES+=("$tarball_name")
    
    log_success "Package created: $(basename "$tarball_name")"
    
    # Create installation instructions
    create_distribution_readme "$tarball_name"
    
    log_success "Production package ready for distribution"
}

# Create distribution README
create_distribution_readme() {
    local tarball_name="$1"
    local readme_file="${PROJECT_ROOT}/INSTALL.md"
    
    cat > "$readme_file" << EOF
# OpenCLI Installation

## Quick Install
\`\`\`bash
npm install -g $(basename "$tarball_name")
\`\`\`

## Usage
\`\`\`bash
open-cli --help
open-cli list-adapters
\`\`\`

## Configuration
\`\`\`bash
export OPENCLI_ADAPTER_TYPE=google
open-cli list-adapters
\`\`\`

## Uninstall
\`\`\`bash
npm uninstall -g @open-cli/open-cli
\`\`\`

---
Package: $(basename "$tarball_name")  
Created: $(date)  
Log: $(basename "$LOG_FILE")
EOF

    log "Installation guide created: INSTALL.md"
}

# Verify installation
verify_installation() {
    log_step "Verifying installation"

    # Check if command exists
    if ! command -v open-cli >/dev/null 2>&1; then
        log_error "open-cli command not found in PATH"
        log "Your PATH: $PATH"
        log "Try adding npm global bin to PATH: export PATH=\"\$(npm bin -g):\$PATH\""
        exit 1
    fi

    # Test version command
    local version
    if ! version=$(open-cli --version 2>/dev/null); then
        log_error "open-cli command failed to execute"
        log "Try running 'open-cli --help' for more information"
        exit 1
    fi

    log_success "Installation verified - Version: $version"

    # Test help command
    if open-cli --help >/dev/null 2>&1; then
        log "Help command working ✓"
    else
        log_warning "Help command may have issues"
    fi
}

# Show completion info
show_completion() {
    echo ""
    echo -e "${GREEN}${BOLD}🎉 Installation Complete!${NC}"
    echo ""
    
    case "$INSTALL_MODE" in
        development)
            echo -e "${BOLD}Development Installation:${NC}"
            echo "   • npm link created"
            echo "   • Changes to source code will be reflected immediately"
            echo ""
            ;;
        production)
            echo -e "${BOLD}Production Package:${NC}"
            echo "   • Package created and ready for distribution"
            echo "   • See INSTALL.md for deployment instructions"
            echo ""
            ;;
    esac

    echo -e "${BOLD}Quick Start:${NC}"
    echo "   open-cli --help"
    echo "   open-cli list-adapters"
    echo ""
    echo -e "${BOLD}Configuration:${NC}"
    echo "   export OPENCLI_ADAPTER_TYPE=google"
    echo ""
    echo -e "${BOLD}Support:${NC}"
    echo "   GitHub: https://github.com/vketteni/open-cli"
    echo "   Log: $LOG_FILE"
    echo ""
}

# Main function
main() {
    local start_time
    start_time=$(date +%s)

    echo -e "${BOLD}${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║             OpenCLI Installer              ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"

    log "Installation started - Mode: $INSTALL_MODE"
    log "Log file: $LOG_FILE"

    # Run installation pipeline
    check_requirements
    validate_project
    build_project

    case "$INSTALL_MODE" in
        development)
            install_development
            verify_installation
            ;;
        production)
            install_production
            # Skip verification for production mode
            ;;
    esac

    show_completion

    local end_time duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log_success "Installation completed in ${duration}s"
}

# Entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi