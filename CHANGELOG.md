# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated release management system with GitHub Actions
- CHANGELOG.md following Keep a Changelog format
- Semantic versioning support

## [0.1.0] - 2025-08-04

### Added
- Initial release of Open CLI platform
- Core `CLIProvider` interface for adapter development
- Modular architecture separating CLI frontend from agentic cores
- Google Gemini adapter (`@open-cli/gemini-adapter`)
- Rich terminal UI with React + Ink (`@open-cli/cli`)
- Core interface definitions (`@open-cli/interface`)
- Main CLI application (`@open-cli/open-cli`)
- Comprehensive documentation and contribution guidelines
- Apache 2.0 license
- TypeScript support across all packages
- Monorepo setup with npm workspaces
- Build and development scripts
- Demo functionality

### Security
- No known security issues in initial release

[Unreleased]: https://github.com/vketteni/open-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vketteni/open-cli/releases/tag/v0.1.0