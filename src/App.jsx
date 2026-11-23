import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import Preloader from "./components/Preloader.jsx";
import Cursor from "./components/Cursor.jsx";
import NavBar from "./components/NavBar.jsx";
import LanguageTakeover from "./components/LanguageTakeover.jsx";
import PrivacyDialog from "./components/PrivacyDialog.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Work from "./sections/Work.jsx";
import Services from "./sections/Services.jsx";
import Specializations from "./sections/Specializations.jsx";
import Experience from "./sections/Experience.jsx";
import Stack from "./sections/Stack.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import { jumpTo, scrollToTarget, useSmoothScroll } from "./lib/smoothScroll.js";
import { motionOK, ScrollTrigger } from "./lib/motion.js";
import { applyLanguage, dictionaries, initialLanguage, LanguageContext } from "./i18n/index.js";

// three.js and post-processing ship in their own chunk so the page paints first.
const Scene = lazy(() => import("./components/Scene/Scene.jsx"));

const App = () => {
    const [ready, setReady] = useState(false);
    const [lang, setLang] = useState(initialLanguage);
    const takeoverRef = useRef(null);
    // Arriving at a section link (e.g. /#contact from a service page): skip the intro and go
    // straight there once the page is laid out.
    const [arrivalHash] = useState(() => (window.location.hash.length > 1 ? window.location.hash : ""));
    useSmoothScroll(ready);

    useEffect(() => {
        if (!ready || !arrivalHash) return;
        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
            scrollToTarget(arrivalHash, { duration: 1.2 });
        }, 300);
        return () => clearTimeout(timer);
    }, [ready, arrivalHash]);

    useEffect(() => {
        applyLanguage(lang);
    }, [lang]);

    // Swaps the language while the blob covers the screen: the sections remount in the new
    // language (so every SplitText and ScrollTrigger is rebuilt), then the reader is put back
    // where they were.
    const switchLanguage = useCallback((next) => {
        if (next === lang) return;
        const swap = () => {
            const y = window.scrollY;
            flushSync(() => setLang(next));
            ScrollTrigger.refresh();
            jumpTo(y);
            ScrollTrigger.update();
        };
        if (motionOK() && takeoverRef.current) takeoverRef.current.play(next, swap);
        else swap();
    }, [lang]);

    const context = useMemo(() => ({ lang, t: dictionaries[lang], switchLanguage }), [lang, switchLanguage]);

    return (
        <LanguageContext.Provider value={context}>
            <Preloader onComplete={() => setReady(true)} skip={Boolean(arrivalHash)} />
            <Cursor />
            <div className="grain" aria-hidden="true" />
            <NavBar ready={ready} />
            {/* Keyed by language so every section and its scroll triggers are rebuilt on a switch. */}
            <main key={lang}>
                <Hero ready={ready} />
                <About />
                <Work />
                <Services />
                <Specializations />
                <Experience />
                <Stack />
                <Contact />
            </main>
            <Footer />
            {/* Rendered last so its scroll choreography is set up after the sections' pins. */}
            <Suspense fallback={null}>
                <Scene />
            </Suspense>
            <LanguageTakeover ref={takeoverRef} />
            <PrivacyDialog />
            <CookieConsent ready={ready} />
        </LanguageContext.Provider>
    );
};

export default App;
