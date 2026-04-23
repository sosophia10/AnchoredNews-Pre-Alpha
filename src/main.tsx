/**
 * Global News Dashboard
 * Author: Sophia Herman
 * Purpose: Bootstraps the React application into the root DOM node and loads
 * the shared stylesheet entrypoint for the rebuilt dashboard.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
