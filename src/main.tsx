import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ネイティブアプリ（Capacitor）ではサービスワーカー不要
const isNative = typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' && !window.location.port);

if (!isNative && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
