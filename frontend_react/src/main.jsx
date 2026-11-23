import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// Inicializa y monta la aplicación principal de React en el nodo raíz del DOM.
function mountApplication() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

mountApplication();

