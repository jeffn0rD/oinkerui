@echo off
echo Formatting code...

echo Formatting Node.js...
call npm run format

echo Formatting Python...
call venv\Scripts\activate
black backend_python\src

echo Formatting frontend...
cd frontend
call npm run format
cd ..

echo Code formatting complete!