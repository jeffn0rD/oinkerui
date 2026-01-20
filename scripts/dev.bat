@echo off
echo Starting OinkerUI Development Environment...

if not exist .env (
    echo Error: .env file not found. Run 'npm run setup' first.
    exit /b 1
)

start "Python Backend" cmd /k "cd backend_python && ..\venv\Scripts\activate && python src/main.py"
start "Node.js Backend" cmd /k "npm run dev:backend"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services started!
echo Frontend: http://localhost:5173
echo Node.js API: http://localhost:3000
echo Python Tools: http://localhost:8000