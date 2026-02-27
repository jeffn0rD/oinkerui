@echo off
echo Starting OinkerUI Development Environment...

REM Start Python backend (optional)
start "Python Tools" cmd /k "cd backend_python && python src/main.py"

REM Start Node.js backend
start "Node.js Backend" cmd /k "cd backend && npm run dev:backend"

REM Start frontend
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services started!
echo Frontend: http://localhost:5173
echo Node.js API: http://localhost:3000
echo Python Tools: http://localhost:8000
pause
