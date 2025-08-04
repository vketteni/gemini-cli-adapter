# Release Management

This document describes the release management process for Open CLI.

## Overview

Open CLI uses a comprehensive release management system that includes:

- **Semantic Versioning**: Following [semver](https://semver.org/) principles
- **Conventional Commits**: Using [conventional commits](https://www.conventionalcommits.org/) for automated versioning
- **Automated Releases**: GitHub Actions workflows for CI/CD
- **Changelog Management**: Automated CHANGELOG.md updates
- **NPM Publishing**: Automated publishing to npm registry

## Release Types

### Automatic Releases (Recommended)

The project uses semantic-release for automatic versioning based on commit messages:

- **Patch Release** (`0.1.0` → `0.1.1`): Bug fixes
  ```bash
  git commit -m "fix: resolve authentication issue"
  ```

- **Minor Release** (`0.1.0` → `0.2.0`): New features
  ```bash
  git commit -m "feat: add OpenAI adapter support"
  ```

- **Major Release** (`0.1.0` → `1.0.0`): Breaking changes
  ```bash
  git commit -m "feat!: redesign CLI interface"
  # or
  git commit -m "feat: major CLI redesign

  BREAKING CHANGE: CLI interface has been completely redesigned"
  ```

### Manual Releases

For manual releases, use the provided npm scripts:

```bash
# Patch release (0.1.0 → 0.1.1)
npm run version:patch
npm run tag:release
git push origin main --tags

# Minor release (0.1.0 → 0.2.0)
npm run version:minor
npm run tag:release
git push origin main --tags

# Major release (0.1.0 → 1.0.0)
npm run version:major
npm run tag:release
git push origin main --tags
```

## Release Workflows

### 1. Semantic Release Workflow

**Trigger**: Push to `main` branch  
**File**: `.github/workflows/semantic-release.yml`

This workflow:
- Analyzes commit messages since the last release
- Determines the next version number
- Updates package.json files across all workspaces
- Generates release notes
- Creates a GitHub release
- Publishes to npm
- Updates CHANGELOG.md
- Commits version changes back to main

### 2. Tag-based Release Workflow

**Trigger**: Push tags matching `v*` pattern  
**File**: `.github/workflows/release.yml`

This workflow:
- Builds and tests the project
- Creates a GitHub release from the tag
- Publishes to npm
- Creates a post-release issue for manual tasks

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```bash
# Feature
git commit -m "feat(adapter): add Claude adapter support"

# Bug fix
git commit -m "fix(cli): resolve command parsing issue"

# Breaking change
git commit -m "feat!: redesign provider interface"

# With body and footer
git commit -m "feat(auth): add OAuth2 support

Add OAuth2 authentication flow for enterprise users.
Includes token refresh and scope management.

Closes #123"
```

## Release Process

### For Maintainers

1. **Ensure all tests pass**: `npm test`
2. **Update CHANGELOG.md**: Add unreleased changes if not using semantic-release
3. **Commit changes**: Use conventional commit format
4. **Push to main**: This triggers the semantic-release workflow
5. **Monitor the release**: Check GitHub Actions and npm registry

### For Contributors

1. **Use conventional commits**: This ensures proper version bumping
2. **Include breaking change notes**: For any breaking changes
3. **Update documentation**: If adding new features
4. **Add tests**: For new functionality

## Testing Releases

### Dry Run

Test the release process without actually releasing:

```bash
npm run release:dry
```

### Local Testing

1. Build the project: `npm run build`
2. Test locally: `npm run demo`
3. Verify package contents: `npm pack`

## Post-Release Tasks

After each release, the system automatically creates an issue with these tasks:

- [ ] Update documentation if needed
- [ ] Announce release in community channels
- [ ] Update any dependent projects
- [ ] Monitor for issues in the first 24-48 hours

## Troubleshooting

### Release Failed

1. Check GitHub Actions logs
2. Verify npm token is valid (`NPM_TOKEN` secret)
3. Ensure all tests pass
4. Check for conflicting tags

### Version Conflicts

1. Ensure main branch is up to date
2. Check for uncommitted changes
3. Verify semantic-release configuration

### NPM Publishing Issues

1. Verify package is public: `"publishConfig": {"access": "public"}`
2. Check npm token permissions
3. Ensure package names are available

## Configuration Files

- **`.releaserc.json`**: Semantic-release configuration
- **`.github/workflows/semantic-release.yml`**: Automated release workflow  
- **`.github/workflows/release.yml`**: Tag-based release workflow
- **`CHANGELOG.md`**: Release history following Keep a Changelog format

## Security

- Never commit tokens or secrets to the repository
- Use GitHub secrets for sensitive configuration
- Regularly rotate npm tokens
- Monitor releases for security vulnerabilities