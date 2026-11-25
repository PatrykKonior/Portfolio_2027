import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import Cursor from "./components/Cursor.jsx";
import NavBar from "./components/NavBar.jsx";
import PrivacyDialog from "./components/PrivacyDialog.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import ServicePage from "./pages/ServicePage.jsx";
import { useSmoothScroll } from "./lib/smoothScroll.js";
import { gsap, motionOK } from "./lib/motion.js";
import { sceneState } from "./lib/sceneState.js";
import { dictionaries, LanguageContext } from "./i18n/index.js";
import { serviceChrome, serviceTints } from "./content/servicePages.js";

const Scene = lazy(() => import("./components/Scene/Scene.jsx"));

// A service page: the same navbar, cursor, 3D scene, contact form, footer and cookie banner as
// the home page, around the service's own sections. `ssr` renders only what search engines
// need (no cursor, scene or dialogs); the browser then renders the full page.
const ServiceApp = ({ page, lang, ssr = false }) => {
    const [mounted, setMounted] = useState(false);
    const ui = serviceChrome[lang];
    useSmoothScroll(mounted);

    // Switching language opens the same page in the other language.
    const context = useMemo(() => ({
        lang,
        t: dictionaries[lang],
        switchLanguage: (next) => {
            if (next !== lang) window.location.href = page.path[next];
        },
    }), [lang, page]);

    useEffect(() => {
        setMounted(true);
        // No preloader here: the blob just grows in.
        if (motionOK()) gsap.to(sceneState, { intro: 1, duration: 2.4, ease: "expo.out", delay: 0.2 });
        else sceneState.intro = 1;
    }, []);

    return (
        <LanguageContext.Provider value={context}>
            {!ssr && <Cursor />}
            <div className="grain" aria-hidden="true" />
            <NavBar ready={mounted} linkBase={ui.homeHref} />
            <main>
                <ServicePage page={page} />
                <Contact initialMessage={ssr || page.contactPrefill === false ? "" : `${page[lang].menuTitle}: `} />
            </main>
            <Footer linkBase={ui.homeHref} />
            {!ssr && mounted && (
                <>
                    <Suspense fallback={null}>
                        <Scene path="service" tint={serviceTints[page.tint]} />
                    </Suspense>
                    <PrivacyDialog />
                    <CookieConsent ready={mounted} />
                </>
            )}
        </LanguageContext.Provider>
    );
};

export default ServiceApp;
