@echo off
echo Building OinkerUI for production...

echo Building frontend...
cd frontend
call npm run build
cd ..

echo Build complete!
echo Frontend build: frontend\dist\
echo Backend: backend\src\
echo Python tools: backend_python\src\