#!/bin/bash
# =============================================================================
# OinkerUI Installation Verification Script
# 
# Checks that all dependencies are installed and the environment is configured.
# Run this after 'npm run setup' to verify everything is working.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN + 1)); }

echo "============================================"
echo "  OinkerUI Installation Verification"
echo "============================================"
echo ""

# -----------------------------------------------
# 1. Node.js
# -----------------------------------------------
echo "📦 Node.js Environment"
if command -v node &> /dev/null; then
  NODE_VER=$(node --version)
  pass "Node.js installed: $NODE_VER"
  
  # Check minimum version (18+)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    pass "Node.js version >= 18"
  else
    fail "Node.js version $NODE_VER is below minimum (18.x required)"
  fi
else
  fail "Node.js not found"
fi

if command -v npm &> /dev/null; then
  pass "npm installed: $(npm --version)"
else
  fail "npm not found"
fi

# -----------------------------------------------
# 2. Node Dependencies
# -----------------------------------------------
echo ""
echo "📦 Node.js Dependencies"
if [ -d "node_modules" ]; then
  pass "Root node_modules exists"
else
  fail "Root node_modules missing - run 'npm install'"
fi

if [ -d "frontend/node_modules" ]; then
  pass "Frontend node_modules exists"
else
  fail "Frontend node_modules missing - run 'cd frontend && npm install'"
fi

# Check key packages
for pkg in fastify axios uuid; do
  if [ -d "node_modules/$pkg" ]; then
    pass "Backend package: $pkg"
  else
    fail "Missing backend package: $pkg"
  fi
done

for pkg in svelte vite; do
  if [ -d "frontend/node_modules/$pkg" ] || [ -d "frontend/node_modules/.vite" ]; then
    pass "Frontend package: $pkg"
  else
    fail "Missing frontend package: $pkg"
  fi
done

# -----------------------------------------------
# 3. Python Environment
# -----------------------------------------------
echo ""
echo "🐍 Python Environment"
if command -v python3 &> /dev/null; then
  PY_VER=$(python3 --version)
  pass "Python3 installed: $PY_VER"
  
  PY_MAJOR=$(echo "$PY_VER" | awk '{print $2}' | cut -d. -f1)
  PY_MINOR=$(echo "$PY_VER" | awk '{print $2}' | cut -d. -f2)
  if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 9 ]; then
    pass "Python version >= 3.9"
  else
    fail "Python version $PY_VER is below minimum (3.9+ required)"
  fi
else
  fail "Python3 not found"
fi

# Check for virtual environment
if [ -d "venv" ]; then
  pass "Python venv exists"
  
  # Check if venv has the required packages
  if [ -f "venv/bin/pip" ] || [ -f "venv/Scripts/pip.exe" ]; then
    # Try to check installed packages
    VENV_PIP="venv/bin/pip"
    if [ -f "venv/Scripts/pip.exe" ]; then
      VENV_PIP="venv/Scripts/pip.exe"
    fi
    
    for pkg in fastapi uvicorn jinja2 pydantic tiktoken pydantic-settings; do
      if "$VENV_PIP" show "$pkg" &> /dev/null 2>&1; then
        pass "Python package: $pkg"
      else
        fail "Missing Python package: $pkg - run 'source venv/bin/activate && pip install -r requirements.txt'"
      fi
    done
  fi
else
  warn "Python venv not found - run 'python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt'"
fi

# -----------------------------------------------
# 4. Environment Configuration
# -----------------------------------------------
echo ""
echo "⚙️  Environment Configuration"
if [ -f ".env" ]; then
  pass ".env file exists"
  
  # Check for API key
  if grep -q "OPENROUTER_API_KEY=" .env; then
    API_KEY=$(grep "OPENROUTER_API_KEY=" .env | cut -d= -f2)
    if [ "$API_KEY" = "your-api-key-here" ] || [ -z "$API_KEY" ]; then
      warn "OPENROUTER_API_KEY is not set - edit .env with your API key from https://openrouter.ai/keys"
    else
      pass "OPENROUTER_API_KEY is configured"
    fi
  else
    fail "OPENROUTER_API_KEY not found in .env"
  fi
else
  fail ".env file missing - run 'cp .env.example .env' and edit it"
fi

if [ -f ".env.example" ]; then
  pass ".env.example exists"
else
  warn ".env.example missing"
fi

# -----------------------------------------------
# 5. Directory Structure
# -----------------------------------------------
echo ""
echo "📁 Directory Structure"
for dir in workspaces data backend/src frontend/src backend_python/src templates; do
  if [ -d "$dir" ]; then
    pass "Directory: $dir"
  else
    if [ "$dir" = "workspaces" ] || [ "$dir" = "data" ]; then
      warn "Directory missing: $dir - will be created on first run"
      mkdir -p "$dir"
    else
      fail "Directory missing: $dir"
    fi
  fi
done

# -----------------------------------------------
# 6. Quick Backend Test
# -----------------------------------------------
echo ""
echo "🧪 Quick Verification"

# Test that backend can start
if node -e "
  try {
    const buildApp = require('./backend/src/index');
    const app = buildApp({ logger: false });
    app.ready().then(() => {
      app.close().then(() => {
        console.log('OK');
        process.exit(0);
      });
    }).catch(err => {
      console.error(err.message);
      process.exit(1);
    });
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
" 2>/dev/null; then
  pass "Backend server starts successfully"
else
  fail "Backend server failed to start"
fi

# Test that Python backend can import
if [ -d "venv" ]; then
  PYTHON_BIN="venv/bin/python"
  if [ -f "venv/Scripts/python.exe" ]; then
    PYTHON_BIN="venv/Scripts/python.exe"
  fi
  
  if "$PYTHON_BIN" -c "
import sys
sys.path.insert(0, 'backend_python')
from src.main import app
print('OK')
" 2>/dev/null; then
    pass "Python backend imports successfully"
  else
    warn "Python backend import failed - check backend_python/src/main.py"
  fi
fi

# -----------------------------------------------
# Summary
# -----------------------------------------------
echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "❌ Some checks failed. Please fix the issues above."
  echo ""
  echo "Quick fix commands:"
  echo "  npm run setup          # Full setup"
  echo "  npm install            # Backend deps only"
  echo "  cd frontend && npm install  # Frontend deps only"
  echo "  source venv/bin/activate && pip install -r requirements.txt  # Python deps"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo ""
  echo "⚠️  Setup is mostly complete but has warnings. Review above."
  exit 0
else
  echo ""
  echo "✅ All checks passed! Run 'npm run dev' to start."
  exit 0
fi
