# Contributing to OPEN CLI

Thank you for your interest in contributing to OPEN CLI! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests for bug fixes and features
- **Adapter Development**: Create adapters for new AI providers
- **Documentation**: Improve our docs and guides
- **Testing**: Help test new features and report issues

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- TypeScript knowledge

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/open-cli.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

### Building and Testing

```bash
# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## 📝 Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `adapter/provider-name` - New adapter implementations
- `docs/description` - Documentation updates

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add OpenAI adapter support
fix: resolve chat session timeout issue
docs: update adapter creation guide
```

### Pull Request Process

1. Ensure all tests pass
2. Update documentation as needed
3. Add tests for new functionality
4. Follow the existing code style
5. Fill out the PR template completely

## 🔌 Creating Adapters

### Adapter Structure

New adapters should implement the `CLIProvider` interface:

```typescript
import { CLIProvider } from '@open-cli/interface';

export class MyAdapter implements CLIProvider {
  readonly id = 'my-provider';
  readonly name = 'My Provider';
  readonly version = '0.1.0';
  
  // Implement required methods...
}
```

### Adapter Guidelines

- Follow the existing patterns in `packages/google-adapter`
- Include comprehensive tests
- Add configuration validation
- Document all public methods
- Handle errors gracefully

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test -w packages/interface

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

We aim for 90%+ test coverage. Please include tests for:

- New features and bug fixes
- Edge cases and error conditions
- Adapter implementations
- Configuration validation

## 📚 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update relevant docs with changes
- Follow existing formatting patterns

### Documentation Structure

- `docs/guides/` - User guides and tutorials
- `docs/api/` - API reference documentation
- `README.md` - Project overview and quick start
- Package-level README files for detailed usage

## 🐛 Reporting Issues

When reporting issues, please include:

- Version information
- Steps to reproduce
- Expected vs actual behavior
- Relevant log output
- Environment details (OS, Node.js version)

## 💬 Getting Help

- GitHub Discussions for questions and ideas
- GitHub Issues for bugs and feature requests
- Check existing issues before creating new ones

## 📄 License

By contributing to OPEN CLI, you agree that your contributions will be licensed under the MIT License.

## 🎉 Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make OPEN CLI better!
