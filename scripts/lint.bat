@echo off
echo Running linters...

echo Linting Node.js backend...
call npm run lint

echo Linting Python...
call venv\Scripts\activate
flake8 backend_python\src
mypy backend_python\src

echo Linting frontend...
cd frontend
call npm run lint
cd ..

echo All linting passed!