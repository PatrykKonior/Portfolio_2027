import { createContext, useContext } from "react";
import en from "./en.js";
import pl from "./pl.js";

export const dictionaries = { en, pl };
export const LANGUAGES = ["en", "pl"];

export const LanguageContext = createContext({ lang: "en", t: en, switchLanguage: () => {} });

export const useLanguage = () => useContext(LanguageContext);

// ?lang= wins (shareable, and what the hreflang links point to), then the saved choice, then the browser.
export const initialLanguage = () => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (LANGUAGES.includes(fromUrl)) return fromUrl;
    try {
        const saved = localStorage.getItem("lang");
        if (LANGUAGES.includes(saved)) return saved;
    } catch {
        // Storage can be blocked; fall back to the browser language.
    }
    return navigator.language?.toLowerCase().startsWith("pl") ? "pl" : "en";
};

// Keeps the document in step with the language: <html lang>, the title and the meta description.
export const applyLanguage = (lang) => {
    const t = dictionaries[lang];
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.meta.description);
    try {
        localStorage.setItem("lang", lang);
    } catch {
        // Not critical: the language just won't be remembered.
    }
};

// Fills {company}, {nip} and {email} placeholders in dictionary strings.
export const fill = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
