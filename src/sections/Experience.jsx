import { useRef, useState } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { expCards } from "../constants/index.js";
import { useLanguage } from "../i18n/index.js";
import { scrollToTarget } from "../lib/smoothScroll.js";
import SectionHeading from "../components/SectionHeading.jsx";

// Room left above a row when the page scrolls to it, so the navbar doesn't cover the title.
const SCROLL_MARGIN = 110;

// Once a row has opened, scroll just enough to show all of it: down if its details run past
// the bottom of the screen, up if its title is hidden under the navbar.
const revealRow = (row) => {
    const rect = row.getBoundingClientRect();
    const overflowsBottom = rect.bottom > window.innerHeight - 24;
    const hiddenTop = rect.top < SCROLL_MARGIN;
    if (!overflowsBottom && !hiddenTop) return;
    const fitsOnScreen = rect.height <= window.innerHeight - SCROLL_MARGIN - 24;
    const offset = hiddenTop || !fitsOnScreen ? -SCROLL_MARGIN : rect.height - window.innerHeight + 24;
    scrollToTarget(row, { offset, duration: 1.1 });
};

const ExperienceRow = ({ job, open, onToggle, id }) => {
    const panelRef = useRef(null);
    const rowRef = useRef(null);
    const mounted = useRef(false);

    useGSAP(() => {
        const panel = panelRef.current;
        // The first row starts open on load; only rows opened by a click bring themselves into view.
        const reveal = open && mounted.current ? () => revealRow(rowRef.current) : undefined;
        mounted.current = true;
        if (!motionOK()) {
            gsap.set(panel, { height: open ? "auto" : 0 });
            reveal?.();
            return;
        }
        gsap.to(panel, { height: open ? "auto" : 0, duration: 0.9, ease: "expo.inOut", onComplete: reveal });
        if (open) {
            gsap.fromTo(panel.querySelectorAll("li"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.025, delay: 0.25 });
        }
    }, { dependencies: [open] });

    return (
        <li ref={rowRef} className={`exp-row ${open ? "open" : ""}`}>
            <button
                type="button"
                className="exp-row-head"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={id}
            >
                <span className="exp-fill" aria-hidden="true" />
                <span className="mono exp-date">{job.period}</span>
                <span className="exp-role">{job.title}</span>
                <span className="exp-company">{job.company}</span>
                <span className="exp-toggle" aria-hidden="true" />
            </button>

            <div id={id} ref={panelRef} className="exp-panel" style={{ height: 0 }}>
                <div className="exp-panel-inner">
                    <div>
                        <p className="exp-summary">{job.summary}</p>
                        <p className="mono text-muted mt-6">{job.date}</p>
                    </div>
                    <ul className="exp-list">
                        {job.responsibilities.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <ul className="chips exp-stack">
                        {job.stack.map((tech) => <li key={tech} className="chip">{tech}</li>)}
                    </ul>
                </div>
            </div>
        </li>
    );
};

const Experience = () => {
    const ref = useRef(null);
    const [openIndex, setOpenIndex] = useState(0);
    const { t } = useLanguage();

    useGSAP(() => {
        if (!motionOK()) return;
        gsap.from(".exp-row", {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.12,
            scrollTrigger: { trigger: ".exp-list-wrap", start: "top 80%" },
        });
    }, { scope: ref });

    return (
        <section id="experience" ref={ref} className="experience container-x section-space">
            <SectionHeading index="04" label={t.experience.label} title={t.experience.title} aside={t.experience.aside} />

            <ul className="exp-list-wrap">
                {expCards.map((job, index) => (
                    <ExperienceRow
                        key={index}
                        id={`exp-panel-${index}`}
                        job={{ ...job, ...t.experience.jobs[index] }}
                        open={openIndex === index}
                        onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                    />
                ))}
            </ul>
        </section>
    );
};

export default Experience;
