import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import site from "../../site.config.js";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Cloudflare's test key that always passes, for localhost where the real key isn't allowed.
const TEST_SITE_KEY = "1x00000000000000000000AA";

let scriptPromise = null;
const loadScript = () => {
    scriptPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve(window.turnstile);
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return scriptPromise;
};

const siteKey = () => (["localhost", "127.0.0.1"].includes(window.location.hostname) ? TEST_SITE_KEY : site.turnstileSiteKey);

// Cloudflare Turnstile bot check. It runs in the background and only shows itself when a visitor
// needs an extra check. The script loads once the form is near the screen.
const Turnstile = forwardRef(({ lang, onToken }, ref) => {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetRef.current != null) window.turnstile?.reset(widgetRef.current);
            onTokenRef.current("");
        },
    }), []);

    useEffect(() => {
        const container = containerRef.current;
        let cancelled = false;

        const render = () => loadScript().then((turnstile) => {
            if (cancelled || widgetRef.current != null) return;
            widgetRef.current = turnstile.render(container, {
                sitekey: siteKey(),
                theme: "dark",
                language: lang,
                appearance: "interaction-only",
                callback: (token) => onTokenRef.current(token),
                "expired-callback": () => onTokenRef.current(""),
                "error-callback": () => onTokenRef.current(""),
            });
        }).catch(() => onTokenRef.current(""));

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            render();
        }, { rootMargin: "600px" });
        observer.observe(container);

        return () => {
            cancelled = true;
            observer.disconnect();
            if (widgetRef.current != null) window.turnstile?.remove(widgetRef.current);
            widgetRef.current = null;
        };
    }, [lang]);

    return <div ref={containerRef} className="turnstile" />;
});

Turnstile.displayName = "Turnstile";

export default Turnstile;
