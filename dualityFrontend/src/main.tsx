import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("%c DUALITY PLATFORM: FRONTEND BUILD SUCCESSFUL ", "background: #222; color: #bada55; padding: 5px; font-weight: bold;");
console.log("[System] Build: v2.6.0-distributed-sync (2026-04-17)");

  createRoot(document.getElementById("root")!).render(<App />);
  