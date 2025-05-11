import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set default timezone to Turkey
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
