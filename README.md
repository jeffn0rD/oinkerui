# OinkerUI

An LLM-assisted development workbench that provides an interactive chat interface for building software projects with AI assistance.

## Overview

OinkerUI is a full-stack application that combines:
- **Svelte Frontend**: Modern, reactive UI with Tailwind CSS
- **Node.js Backend**: Fastify-based API server with OpenRouter integration
- **Python Tools**: FastAPI service for Jinja2 rendering and code execution
- **Git Integration**: Automatic version control for all projects

## Features

- 🤖 **LLM Integration**: Chat with AI assistants via OpenRouter
- 💬 **Multi-Chat Support**: Multiple conversation threads per project
- 🔄 **Context Management**: Intelligent context construction from project files
- 📝 **Template System**: Jinja2 templates for code generation
- 🔧 **Code Execution**: Sandboxed Python code execution
- 📦 **Git Integration**: Automatic commits and version tracking
- 🎨 **Modern UI**: Clean, responsive interface built with Svelte

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git
- OpenRouter API key

### Installation

```bash
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup script
npm run setup

# Configure environment
# Edit .env and add your OPENROUTER_API_KEY
```

### Development

```bash
# Start all services (frontend + Node.js + Python)
npm run dev

# Or start services individually
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
npm run dev:python    # http://localhost:8000
```

### Building for Production

```bash
npm run build
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [API Documentation](docs/API.md) - REST API reference
- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow
- [Configuration](docs/CONFIGURATION.md) - Environment configuration
- [Testing](docs/TESTING.md) - Testing guide
- [Deployment](docs/DEPLOYMENT.md) - Deployment instructions
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

## Project Structure

```
oinkerui/
├── frontend/           # Svelte frontend application
├── backend/            # Node.js backend (Fastify)
├── backend_python/     # Python tools backend (FastAPI)
├── spec/               # Specification documents
├── docs/               # Documentation
├── scripts/            # Build and utility scripts
├── tests/              # Integration tests
└── tools/              # Development tools
```

## Technology Stack

### Frontend
- Svelte 5 - Component framework
- Vite 7 - Build tool
- Tailwind CSS 3 - Styling
- Marked - Markdown rendering
- Highlight.js - Syntax highlighting

### Backend (Node.js)
- Fastify 4 - Web framework
- simple-git - Git operations
- axios - HTTP client
- tiktoken - Token counting

### Backend (Python)
- FastAPI - Web framework
- Jinja2 - Template engine
- uvicorn - ASGI server

## Scripts

- `npm run dev` - Start all services
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Run linters
- `npm run format` - Format code
- `npm run setup` - Initial setup
- `npm run clean` - Clean build artifacts

## License

ISC

## Acknowledgments

Built with modern web technologies and powered by OpenRouter's LLM API.
Developed by NinjaTech AI.