@echo off
echo Setting up Python environment...

python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

echo.
echo Python environment setup complete!
echo.
echo To activate the virtual environment:
echo   venv\Scripts\activate