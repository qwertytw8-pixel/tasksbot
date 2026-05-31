# Contributing to TasksBot

Thanks for your interest in contributing to TasksBot! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or fix
4. Make your changes
5. Submit a pull request

## Development Setup

### Backend (Python)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

Create a `.env` file based on `.env.example` with your credentials.

### Frontend (React)

```bash
cd webapp
pnpm install
pnpm dev
```

## Code Style

- **Python**: We use `ruff` for linting. Run `ruff check app/` before committing.
- **TypeScript**: Run `pnpm exec tsc -b` to check types.
- Follow existing patterns in the codebase.

## Pull Request Guidelines

- Keep PRs focused on a single change
- Write clear commit messages
- Update documentation if needed
- Add tests for new features when possible
- Ensure CI passes before submitting

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Mention your environment (OS, Python version, Node version)

## Code of Conduct

Be respectful and constructive. We're building something cool together.

## Questions?

Open an issue or reach out to the maintainers.
