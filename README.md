# OinkerUI

An LLM-assisted development workbench that provides an interactive chat interface for building software projects with AI assistance.

## Overview

OinkerUI is a full-stack application that combines:
- **Svelte Frontend**: Modern, reactive UI with Tailwind CSS
- **Node.js Backend**: Fastify-based API server with OpenRouter integration
- **Python Tools**: FastAPI service for Jinja2 rendering and code execution
- **Git Integration**: Automatic version control for all projects

## Features

### Core Functionality
- 🤖 **LLM Integration**: Chat with AI assistants via OpenRouter
- 💬 **Multi-Chat Support**: Multiple conversation threads per project
- 🔄 **Context Management**: Intelligent context construction from project files
- 📦 **Git Integration**: Automatic commits and version tracking
- 🎨 **Modern UI**: Clean, responsive interface built with Svelte

### Advanced Features
- 📝 **Prompt Templates**: Pre-built and custom Jinja2 templates for code generation
  - Code review, concept explanation, test generation, refactoring, summarization
  - Variable substitution with live preview
  - Template categories and search
- 🧪 **Code Execution**: Sandboxed Python and shell code execution
  - Timeout protection
  - Output capture and file modification tracking
  - Virtual environment management
- 🚩 **Message Flags**: Advanced message context control
  - Pin important messages (blue indicator)
  - Mark as aside (yellow indicator) - excluded from context
  - Mark as pure aside (pink indicator) - system + current message only
  - Discard messages (strikethrough) - hidden from context
- ⏹️ **Request Cancellation**: Cancel in-progress LLM requests with timeout configuration
- 🔢 **Token Counting**: Accurate token counting with tiktoken
- 📊 **Diff Generation**: Generate unified diffs for code changes
- 🎯 **Slash Commands**: Quick commands for common actions
  - `/aside` - Send as aside message
  - `/aside-pure` - Send as pure aside message
- ⌨️ **Keyboard Shortcuts**: Efficient workflow with keyboard navigation
  - `Ctrl+T` - Open template selector
  - `Ctrl+Enter` - Send as aside
  - `Ctrl+Alt+Enter` - Send as pure aside

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git
- OpenRouter API key

### Linux / macOS

```bash
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup script
npm run setup

# Configure environment
# Edit .env and add your OPENROUTER_API_KEY
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your_key_here

# Start development environment
npm run dev
```

### Windows

#### Using PowerShell

```powershell
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup script
npm run setup

# Configure environment
# Edit .env and add your OPENROUTER_API_KEY
Copy-Item .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your_key_here

# Start development environment
npm run dev
```

#### Using Command Prompt (cmd)

```cmd
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup script
npm run setup

# Configure environment
# Edit .env and add your OPENROUTER_API_KEY
copy .env.example .env
REM Edit .env and set OPENROUTER_API_KEY=your_key_here

# Start development environment
npm run dev
```

#### Using Git Bash (Recommended)

```bash
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup script
npm run setup

# Configure environment
# Edit .env and add your OPENROUTER_API_KEY
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your_key_here

# Start development environment
npm run dev
```

**Note for Windows Users**: If you encounter line ending issues with shell scripts, configure Git to use Unix line endings:

```bash
git config --global core.autocrlf input
git rm --cached -r .
git reset --hard
```

### Docker

#### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Using Docker CLI

```bash
# Clone the repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Build the image
docker build -t oinkerui .

# Run the container
docker run -it -p 5173:5173 -p 3000:3000 -p 8000:8000 \
  -e OPENROUTER_API_KEY=your_key_here \
  oinkerui

# Or with environment file
docker run -it -p 5173:5173 -p 3000:3000 -p 8000:8000 \
  --env-file .env \
  oinkerui
```

#### Docker Environment Variables

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3000
FRONTEND_PORT=5173
PYTHON_PORT=8000
```

#### Docker Troubleshooting

If you encounter line ending issues in Docker:

```bash
# Fix line endings in shell scripts
find scripts -name "*.sh" -exec sed -i 's/\r$//' {} \;
```

## Development

### Starting Services

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

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:backend
npm run test:frontend
npm run test:python
```

### Code Quality

```bash
# Run linters
npm run lint

# Format code
npm run format
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