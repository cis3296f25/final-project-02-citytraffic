import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Link } from "react-router-dom"; // Import Link for navigation
// We don't import 'leaflet/dist/leaflet.css' here
// because it's already imported in src/main.jsx

// --- Map Tile URLs ---
// Day mode: OpenStreetMap
const dayTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const dayAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Night mode: CartoDB Dark Matter
const nightTileUrl =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const nightAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// --- Main App Component ---
function SimulationPage() {
  // Renamed from App
  // This state will hold all data from the backend
  const [simState, setSimState] = useState({
    vehicles: {},
    trafficLights: {},
  });

  // State for day/night mode
  const [theme, setTheme] = useState("day"); // 'day' or 'night'

  // Refs to hold the Leaflet map and layer instances
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const vehicleMarkersRef = useRef({});
  const lightMarkersRef = useRef({});

  // --- Effect 1: Initialize Map and WebSocket ---
  useEffect(() => {
    // 1. Initialize the Leaflet map
    mapRef.current = L.map("map").setView(
      [39.952583, -75.165222], // Start at Philadelphia City Hall
      16 // Zoom level
    );

    // 2. Add the initial tile layer (day)
    tileLayerRef.current = L.tileLayer(dayTileUrl, {
      attribution: dayAttribution,
      maxZoom: 19,
    }).addTo(mapRef.current);

    // 3. Connect to the Python WebSocket server
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");

    // 4. Listen for messages
    ws.onmessage = (event) => {
      try {
        const newState = JSON.parse(event.data);
        setSimState(newState); // Update state, which triggers Effect 3
      } catch (error) {
        console.error("Failed to parse message:", event.data);
      }
    };

    // 5. Cleanup: close the connection when the component is removed
    return () => {
      ws.close();
      if (mapRef.current) {
        mapRef.current.remove(); // Clean up the map instance
        mapRef.current = null;
      }
    };
  }, []); // The empty array [] means this effect runs only once on mount

  // --- Effect 2: Handle Theme Change ---
  useEffect(() => {
    // Set the theme class on the root <html> element for Tailwind
    document.documentElement.className = `theme-${theme}`;

    // Apply the theme class to the map container itself for the CSS filter
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      // We use 'leaflet-container' to reset classes, then add the theme
      mapContainer.className = `leaflet-container theme-${theme}`;
    }

    /*
    // This section is for a "real" tile-switching implementation
    // if you don't want to use the CSS filter trick.
    if (!mapRef.current || !tileLayerRef.current) return; // Map not ready yet

    const newUrl = theme === "day" ? dayTileUrl : nightTileUrl;
    const newAttribution =
      theme === "day" ? dayAttribution : nightAttribution;

    tileLayerRef.current.setUrl(newUrl);
    tileLayerRef.current.options.attribution = newAttribution;
    tileLayerRef.current.redraw();
    */
  }, [theme]);

  // --- Effect 3: Update Markers from Simulation State ---
  useEffect(() => {
    if (!mapRef.current) return; // Map not ready yet

    const map = mapRef.current;

    // --- Update Vehicles ---
    Object.entries(simState.vehicles).forEach(([id, vehicle]) => {
      const { lat, lng, color, bearing } = vehicle;
      const latLng = [lat, lng];

      // Custom icon using HTML and CSS (defined in index.css via Tailwind)
      const carIcon = L.divIcon({
        className: "car-icon",
        html: `<div style="background-color: ${color}; width: 100%; height: 100%; transform: rotate(${bearing}deg); transition: transform 0.1s linear;"></div>`,
      });

      if (!vehicleMarkersRef.current[id]) {
        // First time seeing this vehicle? Create a new marker.
        vehicleMarkersRef.current[id] = L.marker(latLng, {
          icon: carIcon,
        }).addTo(map);
      } else {
        // Vehicle exists? Update its position and icon.
        const marker = vehicleMarkersRef.current[id];
        marker.setLatLng(latLng);
        marker.setIcon(carIcon);
      }
    });

    // --- Update Traffic Lights ---
    Object.entries(simState.trafficLights).forEach(([id, light]) => {
      const { lat, lng, status } = light;
      const latLng = [lat, lng];

      // Custom HTML icon for the traffic light
      const lightIcon = L.divIcon({
        className: "traffic-light-icon-container",
        html: `
          <div class="traffic-light-icon">
            <div class="light ${status === "red" ? "red" : ""}"></div>
            <div class="light ${status === "yellow" ? "yellow" : ""}"></div>
            <div class="light ${status === "green" ? "green" : ""}"></div>
          </div>
        `,
      });

      if (!lightMarkersRef.current[id]) {
        // Create new light marker
        lightMarkersRef.current[id] = L.marker(latLng, {
          icon: lightIcon,
          zIndexOffset: -100, // Keep lights behind cars
        }).addTo(map);
      } else {
        // Update existing light icon
        lightMarkersRef.current[id].setIcon(lightIcon);
      }
    });

    // TODO: Add logic to remove markers that are no longer in simState
  }, [simState]);

  return (
    // Use a React Fragment <> to avoid adding an extra div
    <>
      {/* The map container div */}
      <div id="map" />

      {/* Day/Night Toggle Button */}
      <button
        onClick={() => setTheme(theme === "day" ? "night" : "day")}
        className="absolute top-4 right-4 z-[1000] px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg font-semibold transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {theme === "day" ? "Night Mode 🌙" : "Day Mode ☀️"}
      </button>

      {/* --- Link to Layout Editor Page --- */}
      <Link
        to="/edit"
        className="absolute top-16 right-4 z-[1000] px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg font-semibold transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Create Layout ✏️
      </Link>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-900 dark:text-white rounded-lg shadow-lg">
        <h1 className="text-xl font-bold text-center">
          Live Traffic Simulation
        </h1>
      </div>
    </>
  );
}

export default SimulationPage;
