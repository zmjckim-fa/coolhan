# Contributing to CoolHan Framework

Thank you for your interest in contributing to CoolHan! We welcome contributions from the community. This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please search existing issues to avoid duplicates.

**When creating a bug report, please include:**
- Clear title and description
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Node.js version, npm version)
- Screenshots or logs if applicable
- Error messages (full stack traces)

### Suggesting Features

Feature suggestions are welcome! Please:
- Use a clear title
- Provide a detailed description of the feature
- Explain why this feature would be useful
- List any similar features in other projects

### Pull Requests

1. **Fork the repository** and create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Keep changes focused and atomic
   - Write clear, descriptive commit messages
   - Update documentation as needed
   - Add tests for new functionality

3. **Test your changes**:
   ```bash
   npm run spec:validate
   npm run env:validate
   npm test
   ```

4. **Ensure code quality**:
   - Follow existing code style
   - Run linters before committing
   - No console logs or debug code
   - Comments only for non-obvious logic

5. **Commit your changes**:
   - Use clear, present-tense commit messages
   - Reference any related issues: "Fix #123"
   - One logical change per commit

6. **Push to your fork** and submit a pull request:
   - Compare against `main` branch
   - Provide a clear description of your changes
   - Link any related issues
   - Include before/after screenshots if UI changes
   - List any breaking changes

## Development Setup

### Prerequisites
- Node.js 14.0.0 or higher
- npm 7.0.0 or higher
- Git 2.30 or higher
- TypeScript 4.5 or higher (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/zmjckim-fa/coolhan.git
cd coolhan

# Install dependencies
npm install

# Run validation
npm run spec:validate
npm run env:validate
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="validation"

# Run with coverage
npm run test:coverage
```

### Running Validation Hooks

```bash
# Validate specifications
npm run spec:validate

# Analyze code
npm run spec:analyze

# Check environment
npm run env:validate

# Check deployment locks
npm run lock:status
```

## Project Structure

```
coolhan/
├── .claude/                          # Claude Code configuration
│   ├── hooks/                        # Validation hook scripts
│   ├── agents/                       # AI agent definitions
│   └── skills/                       # Claude Code skills
├── knowledge_base/                   # Core documentation
│   ├── 00_AI_MASTER_RULES.md        # Core operational rules
│   ├── 00_DEVELOPMENT_LOCKED_MODE.md
│   ├── 00_MASTER_SPECIFICATION_MODULE.md
│   └── ...                           # Additional documentation
├── install.js                        # Node.js installer
├── install.sh                        # Bash installer
├── install.ps1                       # PowerShell installer
├── package.json                      # npm package definition
├── CLAUDE.md                         # Project operations guide
├── README.md                         # Project overview
└── LICENSE                           # MIT License
```

## Coding Standards

### JavaScript/Node.js
- Use `const` by default, `let` if reassignment needed
- Use arrow functions for callbacks
- Use template literals instead of concatenation
- Keep functions small and focused
- Use descriptive variable names

### Markdown Documentation
- Use clear headings hierarchy (H1, H2, H3)
- Include code examples where helpful
- Keep lines to 100 characters where possible
- Use consistent formatting
- Include table of contents for long documents

### File Naming
- Installer scripts: `install.{js,sh,ps1}`
- Documentation: `DOCUMENT_NAME.md` (uppercase, hyphens for multi-word)
- Hooks: `hook-name.js` (lowercase, hyphens)
- Agents: `agent-name.md` (lowercase, hyphens)

## Commit Messages

Follow this format:

```
type(scope): brief description

More detailed explanation if needed. Keep line length under 72 characters.
Explain the "why", not the "what" — the code shows what changed.

References: Fix #123, Resolves #456
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (no logic change)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build, CI, dependencies

**Scope examples:**
- `installer`: Changes to install.js/install.sh/install.ps1
- `hooks`: Changes to validation hooks
- `docs`: Changes to documentation
- `agents`: Changes to agent definitions
- `framework`: Framework files or architecture

## Release Process

CoolHan follows semantic versioning (MAJOR.MINOR.PATCH).

### Version Bumping
- **MAJOR**: Breaking changes or major features
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes and patches

### Release Steps
1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Commit: `git commit -m "chore: release v1.2.3"`
4. Tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
5. Push: `git push origin main --tags`
6. GitHub Actions will automatically:
   - Run tests and validation
   - Publish to npm
   - Create GitHub release

## Testing Guidelines

### What to Test
- New features with unit tests
- Bug fixes with regression tests
- Edge cases and error conditions
- Integration between modules

### Test Structure
```javascript
describe('Feature name', () => {
  test('should do X when Y', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = ...;
    
    // Assert
    expect(result).toBe(...);
  });
});
```

## Documentation Guidelines

### README Updates
- Keep summary concise
- Add examples for new features
- Update troubleshooting if needed
- Link to detailed docs

### New Feature Documentation
- Add to feature list
- Include usage examples
- Explain configuration options
- Link from main README

### API Documentation
- Document all parameters
- Include return types
- Provide usage examples
- Note any breaking changes

## Performance Considerations

When contributing, consider:
- Hook performance (should complete quickly)
- File system operations (batch when possible)
- Memory usage for large projects
- Network requests (use timeouts)

## Accessibility and Localization

- Keep UI text clear and concise
- Use proper heading hierarchy
- Provide meaningful error messages
- Support both English and other languages where feasible

## Questions or Issues?

- Check existing [issues](https://github.com/zmjckim-fa/coolhan/issues)
- Check [CLAUDE.md](CLAUDE.md) for project guidelines
- Review [knowledge_base](knowledge_base/) documentation
- Open a discussion or issue for questions

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub Contributors page
- Project documentation

Thank you for contributing to make CoolHan better! 🚀
