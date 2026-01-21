# Contributing to OinkerUI

Thank you for your interest in contributing to OinkerUI! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Run `npm run setup` to install dependencies
3. Copy `.env.example` to `.env` and configure
4. Run `npm run dev` to start development servers

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write/update tests
4. Run tests: `npm test`
5. Run linters: `npm run lint`
6. Format code: `npm run format`
7. Commit with descriptive message
8. Push and create a pull request

## Coding Standards

### JavaScript/Svelte
- Use ESLint configuration provided
- Format with Prettier
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow Svelte best practices

### Python
- Follow PEP 8 style guide
- Use Black for formatting
- Use type hints
- Add docstrings for functions
- Maximum line length: 100

### Commit Messages
- Use present tense: "Add feature" not "Added feature"
- Use imperative mood: "Move cursor to..." not "Moves cursor to..."
- Reference issues: "Fix #123: Description"
- Keep first line under 72 characters

## Testing Requirements

- Write unit tests for new functions
- Write integration tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

## Code Review Guidelines

- Be respectful and constructive
- Focus on code, not the person
- Explain reasoning for suggestions
- Be open to discussion
- Approve when satisfied

## Reporting Issues

- Use issue templates
- Provide clear description
- Include steps to reproduce
- Add relevant logs/screenshots
- Specify environment details

## Questions?

Feel free to open an issue for questions or join our community discussions.