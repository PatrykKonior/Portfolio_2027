import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { useLanguage } from "../i18n/index.js";
import { servicePages, serviceTints } from "../content/servicePages.js";
import SectionHeading from "../components/SectionHeading.jsx";

// Cards for every service page, each in its service's blob colour. A card whose page isn't
// published yet links to the contact form instead.
const Specializations = () => {
    const ref = useRef(null);
    const { lang, t } = useLanguage();
    const copy = t.specializations;

    useGSAP(() => {
        if (!motionOK()) return;
        gsap.from(".spec-card", {
            y: 70,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            scrollTrigger: { trigger: ".spec-grid", start: "top 80%" },
        });
    }, { scope: ref });

    return (
        <section id="specializations" ref={ref} className="specializations container-x section-space">
            <SectionHeading index="03.1" label={copy.label} title={copy.title} aside={copy.count} />
            <p className="spec-intro">{copy.intro}</p>
            <div className="spec-grid">
                {servicePages.map((page, index) => {
                    const tint = serviceTints[page.tint];
                    return (
                        <a
                            key={page.id}
                            href={page.ready ? page.path[lang] : "#contact"}
                            className={`spec-card ${page.accent ? "spec-card-accent" : ""}`}
                            style={{ "--tint": tint.stars }}
                            data-cursor={page.ready ? copy.cta : copy.ask}
                            data-cursor-contrast={page.accent ? "" : undefined}
                        >
                            {!page.accent && <img src={tint.image} alt="" className="spec-blob" loading="lazy" width="640" height="584" />}
                            <span className="mono spec-index">0{index + 1}</span>
                            <span className="spec-body">
                                <span className="spec-title">{page[lang].menuTitle}</span>
                                <span className="spec-desc">{page[lang].menuDesc}</span>
                                <span className="spec-cta">
                                    {page.ready ? copy.cta : copy.ask}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                                </span>
                            </span>
                        </a>
                    );
                })}
            </div>
        </section>
    );
};

export default Specializations;
