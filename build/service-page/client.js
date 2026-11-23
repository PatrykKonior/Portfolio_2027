// Runs on the prerendered service pages: the phone menu and the same cookie choice as the home
// page (shared through localStorage), loading Google Analytics only after consent.
(() => {
    const menu = document.getElementById("mobile-menu");
    const toggles = document.querySelectorAll("[data-menu-toggle]");
    const setMenu = (open) => {
        menu.classList.toggle("open", open);
        toggles.forEach((button) => button.setAttribute("aria-expanded", String(open)));
        document.documentElement.style.overflow = open ? "hidden" : "";
        if (open) menu.querySelector("a")?.focus();
    };
    toggles.forEach((button) => button.addEventListener("click", () => setMenu(!menu.classList.contains("open"))));
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => event.key === "Escape" && setMenu(false));

    const gaId = document.body.dataset.ga;
    if (!gaId) return;
    const KEY = "cookie-consent";
    const MAX_AGE = 182 * 24 * 60 * 60 * 1000;
    const read = () => {
        try {
            const choice = JSON.parse(localStorage.getItem(KEY));
            return choice && choice.version === 1 && Date.now() - choice.date < MAX_AGE ? choice : null;
        } catch {
            return null;
        }
    };
    function gtag() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
    }
    const loadAnalytics = () => {
        gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
        gtag("js", new Date());
        gtag("config", gaId);
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
        document.addEventListener("click", (event) => {
            const link = event.target.closest?.('a[href*="#contact"], a[href^="mailto:"]');
            if (link) gtag("event", link.href.startsWith("mailto:") ? "email_click" : "contact_cta_click", { link_location: "service_page" });
        }, { capture: true });
    };

    const banner = document.getElementById("consent");
    const choice = read();
    if (choice) {
        if (choice.analytics) loadAnalytics();
        return;
    }
    banner.hidden = false;
    banner.querySelectorAll("[data-consent]").forEach((button) => button.addEventListener("click", () => {
        const analytics = button.dataset.consent === "accept";
        try {
            localStorage.setItem(KEY, JSON.stringify({ version: 1, date: Date.now(), analytics }));
        } catch {
            // Storage blocked: the choice still applies for this visit.
        }
        banner.hidden = true;
        if (analytics) loadAnalytics();
    }));
})();
