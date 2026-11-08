import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "../lib/motion.js";
import { sceneState } from "../lib/sceneState.js";

const names = { en: "English", pl: "Polski" };

// The blob swells from wherever it is on the page until its iridescent surface floods the whole
// screen, the language is swapped underneath, and it shrinks back to its place. The new
// language's name rises out of the liquid while the screen is covered.
const LanguageTakeover = forwardRef((_, ref) => {
    const rootRef = useRef(null);
    const [target, setTarget] = useState("pl");
    const busy = useRef(false);

    useImperativeHandle(ref, () => ({
        play(next, swap) {
            if (busy.current) return;
            busy.current = true;
            flushSync(() => setTarget(next));

            const root = rootRef.current;
            const scene = document.querySelector(".scene");
            const timeline = gsap.timeline({
                onComplete: () => {
                    busy.current = false;
                },
            });

            timeline.set(root, { display: "flex" });
            if (scene) {
                // Lift the scene above the page so the blob swallows it.
                timeline
                    .set(scene, { zIndex: 96 })
                    .to(sceneState, { takeover: 1, duration: 1.25, ease: "expo.inOut" }, 0);
            } else {
                // The 3D chunk hasn't loaded yet: fade a plain backdrop instead.
                timeline.fromTo(root, { backgroundColor: "rgba(10, 10, 11, 0)" }, { backgroundColor: "rgba(10, 10, 11, 1)", duration: 0.6 }, 0);
            }

            timeline
                .fromTo(".takeover-char",
                    { yPercent: 110, rotate: 6, filter: "blur(8px)" },
                    { yPercent: 0, rotate: 0, filter: "blur(0px)", duration: 1, stagger: 0.045, ease: "expo.out" }, 0.7)
                .fromTo(".takeover-meta", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.85)
                .add(swap, 1.3)
                .to(".takeover-char", { yPercent: -110, filter: "blur(8px)", duration: 0.55, stagger: 0.03, ease: "expo.in" }, 1.85)
                .to(".takeover-meta", { opacity: 0, duration: 0.3 }, 1.85);

            if (scene) {
                timeline
                    .to(sceneState, { takeover: 0, duration: 1.35, ease: "expo.inOut" }, 2.15)
                    // Drop back behind the page while the blob is still moving fast, so the hand-off isn't seen.
                    .set(scene, { clearProps: "zIndex" }, 2.95);
            } else {
                timeline.to(root, { backgroundColor: "rgba(10, 10, 11, 0)", duration: 0.6 }, 2.15);
            }

            timeline
                .add(scrambleVisibleLabels, 2.7)
                .set(root, { display: "none", clearProps: "backgroundColor" });
        },
    }), []);

    return (
        <div ref={rootRef} className="takeover" aria-hidden="true">
            <div className="takeover-word">
                {names[target].split("").map((char, index) => (
                    <span key={`${target}-${index}`} className="takeover-char">{char}</span>
                ))}
            </div>
            <p className="takeover-meta mono">
                <span>{target === "pl" ? "EN → PL" : "PL → EN"}</span>
            </p>
        </div>
    );
});

LanguageTakeover.displayName = "LanguageTakeover";

// Mono labels in view (plain text only, so no markup is lost) decode from random glyphs.
const scrambleVisibleLabels = () => {
    const viewport = window.innerHeight;
    document.querySelectorAll("main .mono, .navbar .mono, .nav-link .roll > span").forEach((element) => {
        if (element.children.length) return;
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport || !element.textContent.trim()) return;
        gsap.to(element, {
            duration: 0.9,
            scrambleText: { text: element.textContent, chars: "ABCDEFGHIJKLMNOPRSTUWXYZ0123456789/", speed: 0.6 },
        });
    });
};

export default LanguageTakeover;
