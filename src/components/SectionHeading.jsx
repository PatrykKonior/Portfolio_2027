import { useRef } from "react";
import { gsap, SplitText, useGSAP, motionOK } from "../lib/motion.js";

// "(02) Selected work" label plus a large title; `title` may contain <em> for the serif accent.
const SectionHeading = ({ index, label, title, aside }) => {
    const ref = useRef(null);

    useGSAP(() => {
        if (!motionOK()) return;

        SplitText.create(".section-title", {
            type: "lines,words",
            mask: "lines",
            linesClass: "sline",
            autoSplit: true,
            onSplit: (split) => gsap.from(split.words, {
                yPercent: 110,
                duration: 1.2,
                stagger: 0.06,
                scrollTrigger: { trigger: ref.current, start: "top 80%" },
            }),
        });

        gsap.from(".section-rule", {
            scaleX: 0,
            duration: 1.4,
            ease: "expo.inOut",
            scrollTrigger: { trigger: ref.current, start: "top 85%" },
        });
    }, { scope: ref });

    return (
        <header ref={ref} className="section-heading">
            <div className="section-meta">
                <span className="mono">({index})</span>
                <span className="mono">{label}</span>
                {aside && <span className="mono ms-auto">{aside}</span>}
            </div>
            <div className="section-rule" />
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: title }} />
        </header>
    );
};

export default SectionHeading;
