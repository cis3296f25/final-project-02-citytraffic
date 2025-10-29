import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Import this
import App from "./App.jsx";

import "leaflet/dist/leaflet.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Wrap App in the router */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
