# City Traffic

For anyone working in city planning who needs to visualize a traffic situation, the City Traffic Project is a Web-based program that provides a simulation of traffic in a real life location, allows environemtal adjustments, and other options. Unlike other services or simulators, our product provides a simple program with adjustable situations.
Adding an screenshot or a mockup of your application in action would be nice.

![This is a screenshot.](images.png)

# How to run

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v18.0 or newer)
- npm (which comes with Node.js)

## Installation Steps

Follow these steps to get the development environment running.

1.  **Clone the repository**

    ```bash
    git clone https://github.com/cis3296f25/final-project-02-citytraffic.git
    cd final-project-02-citytraffic
    ```

2.  **Install dependencies**
    This command reads the `package.json` file and installs all required libraries (like React, Leaflet, and React Router).

    ```bash
    npm install
    ```

3.  **Create 2 Terminals (PowerShell)**

4.  **Setup Virtual Environment using Terminal 1**
    This creates a virtual environment.

    ```bash
    cd backend
    python -m venv venv
    pip install "fastapi[all]" uvicorn

    ```

5.  **Run the backend server on Terminal 1**
    This starts the backend server.

    ```bash
    python -m uvicorn simulation:app --reload
    ```

6.  **Run the development server on Terminal 2**
    This starts the Vite dev server.

    ```bash
    cd frontend
    npm run dev
    ```

7.  **Open the application**
    The terminal will output a URL, typically `http://localhost:5173`. Open this address in your web browser.

# How to contribute

Follow this project board to know the latest status of the project: https://github.com/cis3296f25/final-project-02-citytraffic.git
