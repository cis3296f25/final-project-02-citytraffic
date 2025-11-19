#!/bin/bash

echo "Starting City Builder Fullstack App..."
echo

echo "Step 1: Checking Python and Node.js..."
python3 --version || { echo "Error: Python is not installed"; exit 1; }
node --version || { echo "Error: Node.js is not installed"; exit 1; }

echo
echo "Step 2: Installing root dependencies..."
npm install

echo
echo "Step 3: Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo
echo "Step 4: Setting up backend virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo
echo "Step 5: Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

echo
echo "Step 6: Starting both servers..."
cd ..
echo "Backend will run at: http://localhost:8000"
echo "Frontend will run at: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"
echo

npm run dev