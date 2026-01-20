@echo off
echo Cleaning build artifacts...

echo Cleaning Node.js...
rmdir /s /q node_modules 2>nul
rmdir /s /q backend\node_modules 2>nul
del package-lock.json 2>nul

echo Cleaning frontend...
rmdir /s /q frontend\node_modules 2>nul
rmdir /s /q frontend\dist 2>nul
del frontend\package-lock.json 2>nul

echo Cleaning Python...
rmdir /s /q venv 2>nul
rmdir /s /q backend_python\__pycache__ 2>nul
rmdir /s /q backend_python\.pytest_cache 2>nul
rmdir /s /q backend_python\.mypy_cache 2>nul

echo Clean complete!