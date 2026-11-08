import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { consentEnabled, readConsent, restoreConsent, saveConsent } from "../lib/consent.js";
import { openPrivacy } from "../lib/privacy.js";
import { useLanguage } from "../i18n/index.js";
import Magnetic from "./Magnetic.jsx";

const Toggle = ({ checked, disabled, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`consent-switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
    >
        <span className="consent-switch-knob" />
    </button>
);

// A glass card with a spinning mini-blob. "Customize" unfolds the categories inside the same
// card; after a choice it folds away. The footer link brings it back with the settings open.
const Card = ({ expandedAtStart, onDone }) => {
    const ref = useRef(null);
    const prefsRef = useRef(null);
    const { t } = useLanguage();
    const c = t.cookies;
    const [expanded, setExpanded] = useState(expandedAtStart);
    const [analytics, setAnalytics] = useState(() => readConsent()?.analytics ?? false);
    const closing = useRef(false);

    useGSAP(() => {
        if (!motionOK()) return;
        gsap.timeline()
            .fromTo(ref.current,
                { clipPath: "inset(100% 0% 0% 0% round 1.75rem)", y: 40, filter: "blur(14px)" },
                { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", y: 0, filter: "blur(0px)", duration: 1.1, ease: "expo.out", clearProps: "filter" })
            .from(".consent-orb", { scale: 0, rotate: -120, duration: 1.2, ease: "back.out(1.6)" }, 0.15)
            .from(".consent-reveal", { y: 18, opacity: 0, duration: 0.8, stagger: 0.06, ease: "expo.out" }, 0.25);
    }, { scope: ref });

    // Unfold / fold the categories.
    useEffect(() => {
        const prefs = prefsRef.current;
        if (!motionOK()) {
            gsap.set(prefs, { height: expanded ? "auto" : 0 });
            return;
        }
        gsap.to(prefs, { height: expanded ? "auto" : 0, duration: 0.8, ease: "expo.inOut" });
        if (expanded) {
            gsap.fromTo(prefs.querySelectorAll(".consent-row"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, delay: 0.2 });
        }
    }, [expanded]);

    const finish = useCallback((choice) => {
        if (closing.current) return;
        closing.current = true;
        saveConsent(choice);
        if (!motionOK()) {
            onDone();
            return;
        }
        gsap.timeline({ onComplete: onDone })
            .to(".consent-orb", { scale: 0, rotate: 140, duration: 0.6, ease: "expo.in" }, 0)
            .to(ref.current, {
                clipPath: "inset(0% 0% 100% 0% round 1.75rem)",
                y: -20,
                filter: "blur(10px)",
                duration: 0.8,
                ease: "expo.inOut",
            }, 0.1);
    }, [onDone]);

    return (
        <div ref={ref} className="consent" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-text">
            <div className="consent-head">
                <div className="consent-orb" aria-hidden="true">
                    <img src="/images/blob.webp" alt="" />
                </div>
                <div>
                    <p className="mono consent-label consent-reveal"><span className="pulse-dot" /> {c.label}</p>
                    <h2 id="consent-title" className="consent-title consent-reveal" dangerouslySetInnerHTML={{ __html: c.title }} />
                </div>
            </div>

            <p id="consent-text" className="consent-text consent-reveal">
                {c.description}{" "}
                <button type="button" className="text-link" onClick={openPrivacy}>{c.privacy}</button>
            </p>

            <div ref={prefsRef} className="consent-prefs" style={{ height: expandedAtStart ? "auto" : 0 }}>
                <div className="consent-row">
                    <div>
                        <p className="consent-row-title">{c.necessaryTitle} <span className="mono consent-chip">{c.alwaysOn}</span></p>
                        <p className="consent-row-desc">{c.necessaryDesc}</p>
                    </div>
                    <Toggle checked disabled onChange={() => {}} label={c.necessaryTitle} />
                </div>
                <div className="consent-row">
                    <div>
                        <p className="consent-row-title">{c.analyticsTitle}</p>
                        <p className="consent-row-desc">{c.analyticsDesc}</p>
                    </div>
                    <Toggle checked={analytics} onChange={setAnalytics} label={c.analyticsTitle} />
                </div>
            </div>

            <div className="consent-actions consent-reveal">
                {expanded ? (
                    <>
                        <Magnetic strength={0.2}>
                            <button type="button" className="consent-btn consent-btn-primary" onClick={() => finish(analytics)}>{c.save}</button>
                        </Magnetic>
                        <Magnetic strength={0.2}>
                            <button type="button" className="consent-btn" onClick={() => finish(true)}>{c.acceptAll}</button>
                        </Magnetic>
                    </>
                ) : (
                    <>
                        <Magnetic strength={0.2}>
                            <button type="button" className="consent-btn consent-btn-primary" onClick={() => finish(true)}>{c.acceptAll}</button>
                        </Magnetic>
                        <Magnetic strength={0.2}>
                            <button type="button" className="consent-btn" onClick={() => finish(false)}>{c.rejectAll}</button>
                        </Magnetic>
                    </>
                )}
                <button
                    type="button"
                    className="consent-more mono"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((open) => !open)}
                >
                    {expanded ? c.less : c.manage}
                    <span className={`consent-more-icon ${expanded ? "open" : ""}`} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

// Shown once the intro is done, unless a choice was made in the last six months.
const CookieConsent = ({ ready }) => {
    const [state, setState] = useState(null);

    useEffect(() => {
        if (!consentEnabled || !ready) return;
        if (restoreConsent()) return;
        const id = setTimeout(() => setState({ expanded: false, key: Date.now() }), 1200);
        return () => clearTimeout(id);
    }, [ready]);

    useEffect(() => {
        const open = () => setState({ expanded: true, key: Date.now() });
        window.addEventListener("consent:open", open);
        return () => window.removeEventListener("consent:open", open);
    }, []);

    const close = useCallback(() => setState(null), []);

    if (!consentEnabled || !state) return null;
    return createPortal(<Card key={state.key} expandedAtStart={state.expanded} onDone={close} />, document.body);
};

export default CookieConsent;
