import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, motionOK } from "../lib/motion.js";
import { logoIconsList } from "../constants/index.js";
import { useLanguage } from "../i18n/index.js";

const Row = ({ items, className }) => (
    <div className={`marquee-row ${className}`}>
        {[0, 1].map((copy) => (
            <div key={copy} className="marquee-group" aria-hidden={copy === 1}>
                {items.map((item) => (
                    <span key={item.name} className="marquee-item">
                        <img src={item.imgPath} alt="" />
                        {item.name}
                        <span className="marquee-star" aria-hidden="true">✳</span>
                    </span>
                ))}
            </div>
        ))}
    </div>
);

// Two marquees running in opposite directions; scroll speed speeds them up and flips them.
const Stack = () => {
    const ref = useRef(null);
    const { t } = useLanguage();
    const half = Math.ceil(logoIconsList.length / 2);

    useGSAP(() => {
        if (!motionOK()) return;

        const loops = gsap.utils.toArray(".marquee-row").map((row, index) =>
            gsap.fromTo(row.querySelectorAll(".marquee-group"),
                { xPercent: index % 2 ? -100 : 0 },
                { xPercent: index % 2 ? 0 : -100, duration: 32, ease: "none", repeat: -1 })
        );

        let direction = 1;
        let boost = 0;
        let speed = 1;
        ScrollTrigger.create({
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
                direction = self.direction;
                boost = Math.min(Math.abs(self.getVelocity()) / 300, 5);
            },
        });

        const tick = () => {
            speed += (direction * (1 + boost) - speed) * 0.08;
            boost *= 0.93;
            loops.forEach((loop) => loop.timeScale(speed));
        };
        gsap.ticker.add(tick);

        gsap.to(".marquee", {
            skewY: -3,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        });

        return () => gsap.ticker.remove(tick);
    }, { scope: ref });

    return (
        <section ref={ref} className="stack section-space" aria-label={t.stack.aria}>
            <div className="container-x section-meta">
                <span className="mono">(05)</span>
                <span className="mono">{t.stack.label}</span>
                <span className="mono ms-auto text-muted">{t.stack.count}</span>
            </div>
            <div className="marquee">
                <Row items={logoIconsList.slice(0, half)} className="" />
                <Row items={logoIconsList.slice(half)} className="marquee-outline" />
            </div>
        </section>
    );
};

export default Stack;
