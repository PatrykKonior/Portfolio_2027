import { createContext, useContext } from "react";
import enCopy from "./en.js";
import plCopy from "./pl.js";

// One-letter words that shouldn't be left hanging at the end of a line ("i", "w", "z" in Polish,
// "a" and "I" in English). Gluing them to the next word with a non-breaking space moves them to
// the next line together.
const SHORT_WORDS = { pl: "aAiIoOuUwWzZ", en: "aAI" };

const typeset = (copy, letters) => {
    const pattern = new RegExp(`(^|[\\s(„"])([${letters}]) +`, "g");
    // Twice, so runs like "i w React" are glued all the way through.
    const glue = (text) => text.replace(pattern, "$1$2\u00A0").replace(pattern, "$1$2\u00A0");
    const walk = (value) => {
        if (typeof value === "string") return glue(value);
        if (typeof value === "function") return (...args) => walk(value(...args));
        if (Array.isArray(value)) return value.map(walk);
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
        return value;
    };
    return walk(copy);
};

const en = typeset(enCopy, SHORT_WORDS.en);
const pl = typeset(plCopy, SHORT_WORDS.pl);

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
