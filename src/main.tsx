import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <head>
      <link rel="icon" href="src/public/favicon.svg" />
    </head>
    <App />
  </StrictMode>,
);
