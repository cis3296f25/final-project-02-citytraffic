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
npm install

echo.
echo Step 3: Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Step 4: Setting up backend virtual environment...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Step 5: Running Django migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo Step 6: Starting both servers...
cd ..
echo Backend will run at: http://localhost:8000
echo Frontend will run at: http://localhost:5173
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev
pause