import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter-tight";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./index.css";
import ServiceApp from "./ServiceApp.jsx";
import { servicePages } from "./content/servicePages.js";

// Entry for the service pages. The page's HTML was prerendered at build time (build/prerender.mjs);
// here the full app (animations, 3D, form) takes over the same markup.
const { id, lang } = window.__SERVICE_PAGE__;
const page = servicePages.find((item) => item.id === id);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ServiceApp page={page} lang={lang} />
    </StrictMode>,
);
