import React from "react";
import { Routes, Route } from "react-router-dom";
import SimulationPage from "./SimulationPage.jsx"; // Your old App.jsx
import LayoutEditorPage from "./LayoutEditorPage.jsx"; // Your new page

function App() {
  return (
    <Routes>
      {/* Path "/" will show the simulation */}
      <Route path="/" element={<SimulationPage />} />

      {/* Path "/edit" will show the new editor */}
      <Route path="/edit" element={<LayoutEditorPage />} />
    </Routes>
  );
}

export default App;
