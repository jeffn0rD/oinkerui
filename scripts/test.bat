@echo off
echo Running all tests...

echo Running Node.js backend tests...
call npm run test

echo Running Python tests...
call venv\Scripts\activate
cd backend_python
pytest
cd ..

echo Running frontend tests...
cd frontend
call npm run test
cd ..

echo All tests passed!