#!/usr/bin/env bash

set -e

echo "Starting City Builder Fullstack App..."
echo

echo "Step 1: Checking Python and Node.js..."
python3 --version || { echo "Error: python3 is not installed or not in PATH"; exit 1; }
node --version || { echo "Error: Node.js is not installed or not in PATH"; exit 1; }

echo
echo "Step 2: Installing root (Node) dependencies..."
npm install

echo
echo "Step 3: Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo
echo "Step 4: Setting up virtual environment at project root..."
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

echo "Activating virtual environment and installing Python dependencies..."
# Use 'source' for POSIX shells
source venv/bin/activate
pip install -r requirements.txt

echo
echo "Step 5: Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

echo
echo "Step 6: Starting both servers..."

# Start Django in a new Terminal tab / background process
# Option A: background process in same terminal
python manage.py runserver &
DJANGO_PID=$!

cd frontend
echo "Backend will run at: http://localhost:8000"
echo "Frontend will run at: http://localhost:5173"
echo
echo "Press Ctrl+C to stop the frontend dev server; Django will be killed automatically."
echo

npm run dev

# When frontend stops, kill Django
kill $DJANGO_PID 2>/dev/null || true
