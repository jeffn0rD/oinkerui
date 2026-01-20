@echo off
echo Setting up OinkerUI development environment...

echo Installing Node.js dependencies...
call npm install

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Setting up Python virtual environment...
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo IMPORTANT: Edit .env and set your OPENROUTER_API_KEY
)

echo Creating workspace directories...
mkdir workspaces 2>nul
mkdir data 2>nul
mkdir backend_python\templates 2>nul
mkdir backend_python\sandboxes 2>nul

echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env and set your OPENROUTER_API_KEY
echo 2. Run 'npm run dev' to start development servers