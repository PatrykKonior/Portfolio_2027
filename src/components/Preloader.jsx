import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { sceneState } from "../lib/sceneState.js";
import { useLanguage } from "../i18n/index.js";

const Preloader = ({ onComplete }) => {
    const rootRef = useRef(null);
    const countRef = useRef(null);
    const { t } = useLanguage();

    useGSAP(() => {
        if (!motionOK()) {
            gsap.set(rootRef.current, { display: "none" });
            sceneState.intro = 1;
            onComplete();
            return;
        }

        const counter = { value: 0 };
        gsap.timeline()
            .from(".preloader-word > span", { yPercent: 140, duration: 1, stagger: 0.035 })
            .to(counter, {
                value: 100,
                duration: 2,
                ease: "power3.inOut",
                onUpdate: () => {
                    countRef.current.textContent = String(Math.round(counter.value)).padStart(3, "0");
                },
            }, 0)
            .to(".preloader-bar", { scaleX: 1, duration: 2, ease: "power3.inOut" }, 0)
            .to(".preloader-word > span", { yPercent: -140, duration: 0.6, ease: "expo.in", stagger: 0.02 })
            .to(".preloader-meta", { opacity: 0, duration: 0.3 }, "<")
            .add(onComplete)
            .to(rootRef.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, ease: "expo.inOut" })
            .to(sceneState, { intro: 1, duration: 2.4, ease: "expo.out" }, "<0.2")
            .set(rootRef.current, { display: "none" });
    }, { scope: rootRef });

    return (
        <div ref={rootRef} className="preloader" aria-hidden="true">
            <div className="preloader-word">
                {"Patryk Konior".split("").map((char, index) => (
                    <span key={index}>{char === " " ? " " : char}</span>
                ))}
            </div>
            <div className="preloader-meta">
                <span>{t.preloader}</span>
                <span ref={countRef} className="preloader-count">000</span>
            </div>
            <div className="preloader-bar" />
        </div>
    );
};

export default Preloader;
