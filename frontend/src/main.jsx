// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./css/main.css";   // ✅ nạp Tailwind ở đây

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
