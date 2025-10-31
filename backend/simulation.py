import asyncio
import json
import random
import time
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow all origins for simplicity in this example
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Simulation:
    """
    Manages the state and logic of the traffic simulation on a real map.
    Coordinates are now (latitude, longitude).
    """
    def __init__(self):
        self.simulation_start_time = time.time()
        
        # Define simulation boundaries and waypoints (around Philadelphia City Hall)
        # We'll simulate one car going north on 15th St, stopping at Arch St.
        self.start_point = {"lat": 39.9515, "lng": -75.1646} # 15th & Market
        self.end_point = {"lat": 39.9545, "lng": -75.1646}   # 15th & Arch (approx)
        self.light_point = {"lat": 39.9535, "lng": -75.1646} # 15th & Arch St intersection
        
        self.car_speed_lat_per_sec = 0.00005 # Simulated speed

        # The initial state of the simulation.
        self.state = {
            "vehicles": {
                "car1": {
                    "lat": self.start_point["lat"],
                    "lng": self.start_point["lng"],
                    "color": "#3b82f6", # Blue
                    "bearing": 0 # 0 degrees = North
                }
            },
            "trafficLights": {
                "light1": {
                    "lat": self.light_point["lat"],
                    "lng": self.light_point["lng"],
                    "status": "red" # Start as red
                }
            }
        }

    def tick(self):
        """
        Advances the simulation by one step.
        """
        
        # --- 1. Update Traffic Lights ---
        # Get simulation time in seconds
        elapsed = time.time() - self.simulation_start_time
        # Toggle light every 15 seconds
        if int(elapsed // 15) % 2 == 0:
            self.state["trafficLights"]["light1"]["status"] = "red"
        else:
            self.state["trafficLights"]["light1"]["status"] = "green"

        # --- 2. Update Vehicles ---
        car = self.state["vehicles"]["car1"]
        light = self.state["trafficLights"]["light1"]
        
        # Check if car is approaching the red light
        is_approaching = car["lat"] < self.light_point["lat"]
        # Check if the car is *at* the light (within a small threshold)
        is_at_light = abs(car["lat"] - self.light_point["lat"]) < 0.0001

        move_car = True
        
        # Simple stop logic
        if light["status"] == "red" and is_approaching and is_at_light:
            move_car = False
        
        if move_car:
            # Move car north
            car["lat"] += self.car_speed_lat_per_sec
        
        # If the car has moved past the end point, reset its
        # position back to the start to create a continuous loop.
        if car["lat"] > self.end_point["lat"]:
            car["lat"] = self.start_point["lat"]

    def get_state(self):
        """
        Returns the current state of the simulation.
        """
        return self.state

# --- WebSocket Endpoint ---
# This is the main communication channel with the frontend.
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation = Simulation()
    print("Frontend connected.")
    try:
        # Loop forever, sending updates to the frontend.
        while True:
            # 1. Advance the simulation by one step.
            simulation.tick()
            # 2. Get the new state.
            state = simulation.get_state()
            # 3. Send the new state to the frontend as a JSON string.
            await websocket.send_text(json.dumps(state))
            # 4. Wait for a short period (~30 FPS).
            # We use a slightly slower rate as map updates are more intensive.
            await asyncio.sleep(1/30)
    except Exception as e:
        # This will happen if the user closes the browser tab.
        print(f"Client disconnected: {e}")

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

