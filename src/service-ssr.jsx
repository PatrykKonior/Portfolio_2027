import { renderToString } from "react-dom/server";
import ServiceApp from "./ServiceApp.jsx";
import { readyServicePages } from "./content/servicePages.js";

// Built with `vite build --ssr` and used by build/prerender.mjs to write each service page's HTML.
export const pages = readyServicePages;
export const render = (page, lang) => renderToString(<ServiceApp page={page} lang={lang} ssr />);
