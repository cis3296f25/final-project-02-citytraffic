import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";

// We can re-use the tile URLs
const dayTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const dayAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function LayoutEditorPage() {
  const mapRef = useRef(null);
  const [isMapLocked, setIsMapLocked] = useState(false);

  // --- New State and Ref for Placed Markers ---
  const [markers, setMarkers] = useState([]); // Holds data for placed markers
  const placedMarkersRef = useRef({}); // Holds the Leaflet layer instances

  // --- Effect 1: Initialize Map and Drop Listeners ---
  useEffect(() => {
    // 1. Initialize the Leaflet map
    mapRef.current = L.map("editor-map").setView(
      [39.952583, -75.165222], // Start at Philadelphia
      16
    );

    // 2. Add the initial tile layer
    L.tileLayer(dayTileUrl, {
      attribution: dayAttribution,
      maxZoom: 19,
    }).addTo(mapRef.current);

    // 3. --- Add Drag/Drop Event Listeners ---
    const mapContainer = mapRef.current.getContainer();

    // We MUST preventDefault on dragover for the drop event to fire
    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();

      // Get the item type ("car" or "traffic-light")
      const itemType = e.dataTransfer.getData("itemType");
      if (!itemType) return;

      // Convert screen pixels to map coordinates
      const latlng = mapRef.current.mouseEventToLatLng(e);

      // Create a new marker object
      const newMarker = {
        id: `marker-${Date.now()}`, // Simple unique ID
        type: itemType,
        latlng: [latlng.lat, latlng.lng],
      };

      // Add the new marker to our state
      setMarkers((currentMarkers) => [...currentMarkers, newMarker]);
    };

    mapContainer.addEventListener("dragover", handleDragOver);
    mapContainer.addEventListener("drop", handleDrop);

    // 4. Cleanup
    return () => {
      mapContainer.removeEventListener("dragover", handleDragOver);
      mapContainer.removeEventListener("drop", handleDrop);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Runs once on mount

  // --- Effect 2: Handle Map Lock ---
  useEffect(() => {
    if (!mapRef.current) return;

    if (isMapLocked) {
      mapRef.current.dragging.disable();
      mapRef.current.zoomControl.disable();
      mapRef.current.scrollWheelZoom.disable();
      mapRef.current.doubleClickZoom.disable();
    } else {
      mapRef.current.dragging.enable();
      mapRef.current.zoomControl.enable();
      mapRef.current.scrollWheelZoom.enable();
      mapRef.current.doubleClickZoom.enable();
    }
  }, [isMapLocked, mapRef.current]); // Also run if mapRef changes

  // --- Effect 3: Draw/Update Markers from State ---
  useEffect(() => {
    if (!mapRef.current) return; // Map not ready
    const map = mapRef.current;

    // Sync Leaflet markers with the `markers` state
    markers.forEach((markerData) => {
      const { id, type, latlng } = markerData;

      if (!placedMarkersRef.current[id]) {
        // This marker is new, create it
        let icon;
        if (type === "car") {
          icon = L.divIcon({
            className: "editor-car-icon",
            html: "🚗",
          });
        } else {
          icon = L.divIcon({
            className: "editor-light-icon",
            html: "🚦",
          });
        }

        const newLeafletMarker = L.marker(latlng, {
          icon: icon,
          draggable: true, // Let's make them draggable
        }).addTo(map);

        // Add a dragend listener to update state
        newLeafletMarker.on("dragend", (e) => {
          const newLatLng = e.target.getLatLng();
          setMarkers((currentMarkers) =>
            currentMarkers.map((m) =>
              m.id === id ? { ...m, latlng: [newLatLng.lat, newLatLng.lng] } : m
            )
          );
        });

        // Store the Leaflet instance in our ref
        placedMarkersRef.current[id] = newLeafletMarker;
      } else {
        // Marker already exists, just update its position
        placedMarkersRef.current[id].setLatLng(latlng);
      }
    });

    // TODO: Add logic to remove markers if they are removed from state
    // (For now, we're only adding, so this is fine)
  }, [markers]); // Run this effect whenever the `markers` state changes

  // This is where you would add your drag-and-drop logic
  const handleDragStart = (e, itemType) => {
    // Set the data so the drop handler knows what's being dragged
    e.dataTransfer.setData("itemType", itemType);
  };

  return (
    <div className="editor-layout">
      {/* --- Sidebar --- */}
      <div className="editor-sidebar">
        <h2 className="text-xl font-bold mb-4">Layout Editor</h2>
        <p className="text-sm mb-4">Drag items onto the map.</p>

        {/* Draggable Items */}
        <div
          className="draggable-item"
          draggable
          onDragStart={(e) => handleDragStart(e, "car")}
        >
          🚗 Car
        </div>
        <div
          className="draggable-item"
          draggable
          onDragStart={(e) => handleDragStart(e, "traffic-light")}
        >
          🚦 Traffic Light
        </div>

        <div className="mt-auto">
          {/* Lock Map Toggle */}
          <button
            onClick={() => setIsMapLocked(!isMapLocked)}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
              isMapLocked
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            {isMapLocked ? "Unlock Map 🔓" : "Lock Map 🔒"}
          </button>

          {/* Back Button */}
          <Link
            to="/"
            className="block w-full text-center mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg font-semibold hover:bg-blue-700"
          >
            Back to Simulation
          </Link>
        </div>
      </div>

      {/* --- Map Container --- */}
      <div id="editor-map" />
    </div>
  );
}

export default LayoutEditorPage;
