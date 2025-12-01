@echo off
echo Starting City Builder Fullstack App...
echo.

echo Step 1: Checking Python and Node.js...
python --version
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

node --version
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Step 2: Installing root dependencies...
call npm install

echo.
echo Step 3: Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Step 4: Setting up virtual environment at project root...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
call pip install -r requirements.txt

echo.
echo Step 5: Running Django migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Step 6: Starting both servers...

rem Start Django
start "Django Server" cmd /k "cd /d %cd% && call venv\Scripts\activate.bat && python manage.py runserver"

cd frontend
echo Backend will run at: http://localhost:8000
echo Frontend will run at: http://localhost:5173
echo.
echo Press Ctrl+C in this window to stop the frontend dev server
echo.

npm run dev
