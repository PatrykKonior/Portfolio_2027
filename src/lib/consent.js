import site from "../../site.config.js";

// Consent is only needed once Google Analytics is configured: without it the site sets no
// tracking cookies. site.config.js can preview the banner (and in development, ?cookies does);
// without an ID nothing is ever loaded.
const preview = site.preview?.cookieBanner || (import.meta.env.DEV && new URLSearchParams(window.location.search).has("cookies"));
export const consentEnabled = Boolean(site.gaMeasurementId) || Boolean(preview);

const STORAGE_KEY = "cookie-consent";
const VERSION = 1;
const MAX_AGE = 182 * 24 * 60 * 60 * 1000;

let gaLoaded = false;

const gtag = (...args) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
};

// Google Consent Mode v2: everything starts denied and GA is only fetched once analytics is accepted.
const loadAnalytics = () => {
    if (gaLoaded) {
        gtag("consent", "update", { analytics_storage: "granted" });
        return;
    }
    gaLoaded = true;
    gtag("consent", "default", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "granted",
    });
    gtag("js", new Date());
    gtag("config", site.gaMeasurementId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${site.gaMeasurementId}`;
    document.head.appendChild(script);
};

// Removes Google Analytics cookies (_ga, _ga_<id>, _gid) on this host and its parent domain.
const clearAnalyticsCookies = () => {
    const names = document.cookie.split(";").map((cookie) => cookie.split("=")[0].trim()).filter((name) => /^_ga|^_gid$/.test(name));
    const host = window.location.hostname;
    const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`];
    names.forEach((name) => domains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }));
};

const applyConsent = (choice) => {
    if (!site.gaMeasurementId) return;
    if (choice?.analytics) {
        loadAnalytics();
    } else {
        if (gaLoaded) gtag("consent", "update", { analytics_storage: "denied" });
        clearAnalyticsCookies();
    }
};

// The saved choice, or null when there is none yet or it is older than six months.
export const readConsent = () => {
    try {
        const choice = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!choice || choice.version !== VERSION || Date.now() - choice.date > MAX_AGE) return null;
        return choice;
    } catch {
        return null;
    }
};

export const saveConsent = (analytics) => {
    const choice = { version: VERSION, date: Date.now(), analytics };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
        // Storage blocked: the choice still applies for this visit.
    }
    applyConsent(choice);
    return choice;
};

// On load, honour a choice made on an earlier visit.
export const restoreConsent = () => {
    const choice = readConsent();
    if (choice) applyConsent(choice);
    return choice;
};

// Opens the banner with the settings expanded (footer link).
export const showCookieSettings = () => window.dispatchEvent(new Event("consent:open"));
