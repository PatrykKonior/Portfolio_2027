import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { lockScroll } from "../lib/smoothScroll.js";
import { fill, useLanguage } from "../i18n/index.js";
import { company, contactInfo } from "../constants/index.js";
import { CloseIcon } from "./Icons.jsx";
import { consentEnabled } from "../lib/consent.js";

// With analytics on, the last section (cookies) describes Google Analytics instead.
const sections = (t) => {
    const list = t.privacy.sections;
    return consentEnabled ? [...list.slice(0, -1), t.privacy.analyticsCookies] : list;
};

const Panel = ({ onClose }) => {
    const ref = useRef(null);
    const { t } = useLanguage();
    const values = { company: company.name, nip: company.nip, email: contactInfo.email };

    useEffect(() => {
        lockScroll(true);
        const handleKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", handleKey);
        ref.current.querySelector(".privacy-close").focus();
        return () => {
            lockScroll(false);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    useGSAP(() => {
        if (!motionOK()) return;
        gsap.timeline()
            .from(".privacy-backdrop", { opacity: 0, duration: 0.5, ease: "power2.out" })
            .from(".privacy-panel", { yPercent: 8, opacity: 0, scale: 0.97, duration: 0.8 }, 0)
            .from(".privacy-reveal", { y: 24, opacity: 0, duration: 0.7, stagger: 0.04 }, 0.15);
    }, { scope: ref });

    return (
        <div ref={ref} className="privacy" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
            <div className="privacy-backdrop" onClick={onClose} />
            <div className="privacy-panel" data-lenis-prevent>
                <div className="privacy-top privacy-reveal">
                    <span className="mono text-muted">{t.privacy.updated}</span>
                    <button type="button" className="privacy-close" onClick={onClose} aria-label={t.privacy.close}>
                        <CloseIcon />
                    </button>
                </div>
                <h2 id="privacy-title" className="privacy-title privacy-reveal">{t.privacy.title}</h2>
                {sections(t).map((section, index) => (
                    <section key={section.heading} className="privacy-section privacy-reveal">
                        <span className="mono text-accent">0{index + 1}</span>
                        <div>
                            <h3>{section.heading}</h3>
                            <p>{fill(section.body, values)}</p>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

// Mounted once in App; anything can open it with openPrivacy().
const PrivacyDialog = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const show = () => setOpen(true);
        window.addEventListener("privacy:open", show);
        return () => window.removeEventListener("privacy:open", show);
    }, []);

    if (!open) return null;
    return createPortal(<Panel onClose={() => setOpen(false)} />, document.body);
};

export default PrivacyDialog;
