import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.jsx";

// ✅ Ejecuta esto ANTES de render
(function () {
  const key = "app_reload_once";
  console.log(key)
  function shouldReloadOnce() {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  }

  function bustAndReload() {
    const url = new URL(window.location.href);
    url.searchParams.set("r", Date.now().toString());
    window.location.replace(url.toString());
  }

  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "");
    if (/Loading chunk|ChunkLoadError|dynamically imported module/i.test(msg)) {
      if (shouldReloadOnce()) bustAndReload();
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = String(e?.reason?.message || e?.reason || "");
    if (/Loading chunk|ChunkLoadError|dynamically imported module/i.test(msg)) {
      if (shouldReloadOnce()) bustAndReload();
    }
  });
})();

createRoot(document.getElementById("root")).render(
  <App />
);
