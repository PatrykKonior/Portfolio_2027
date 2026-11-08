import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap, ScrollTrigger, motionOK } from "./motion.js";
import { sceneState } from "./sceneState.js";

let lenis = null;

export const scrollToTarget = (target, { offset = 0, duration = 1.6 } = {}) => {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;
    if (lenis) lenis.scrollTo(element, { duration, offset });
    else element.scrollIntoView({ behavior: motionOK() ? "smooth" : "auto" });
};

// Jumps straight to a scroll position, e.g. to keep the reader's place after a language switch.
export const jumpTo = (y) => {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
};

// Freezes the page behind an open dialog.
export const lockScroll = (locked) => {
    document.documentElement.classList.toggle("scroll-locked", locked);
    if (locked) lenis?.stop();
    else lenis?.start();
};

// Lenis drives the page scroll and feeds GSAP's ticker so ScrollTrigger stays in sync.
// Scrolling is locked until `enabled` flips (the preloader is done).
export const useSmoothScroll = (enabled) => {
    useEffect(() => {
        const handleAnchor = (event) => {
            const anchor = event.target.closest('a[href^="#"]');
            if (!anchor) return;
            const hash = anchor.getAttribute("href");
            const target = hash === "#" || hash === "#top" ? document.body : document.querySelector(hash);
            if (!target) return;
            event.preventDefault();
            scrollToTarget(target);
        };
        document.addEventListener("click", handleAnchor);

        if (!motionOK()) return () => document.removeEventListener("click", handleAnchor);

        lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
        lenis.stop();
        lenis.on("scroll", (instance) => {
            sceneState.velocity = instance.velocity;
            ScrollTrigger.update();
        });

        const tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        return () => {
            document.removeEventListener("click", handleAnchor);
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenis = null;
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;
        lenis?.start();
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }, [enabled]);
};
