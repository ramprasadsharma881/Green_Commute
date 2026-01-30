import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize Firebase (imported automatically)
import './lib/firebase';

console.log('🚀 App starting with Firebase...');

createRoot(document.getElementById("root")!).render(<App />);
