import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { services } from "../constants/index.js";
import { useLanguage } from "../i18n/index.js";
import SectionHeading from "../components/SectionHeading.jsx";
import { servicePages } from "../content/servicePages.js";

const Services = () => {
    const ref = useRef(null);
    const { lang, t } = useLanguage();
    // Cards with their own service page get a "Learn more" link.
    const pageFor = (index) => servicePages.find((page) => page.homeCard === index);

    useGSAP(() => {
        if (!motionOK()) return;
        const cards = gsap.utils.toArray(".service-card");

        // Each sticky card recedes as the next one slides over it: it shrinks a little and an
        // overlay darkens it, both following the scroll from the moment the next card starts to
        // cover it until that card settles on top.
        cards.slice(0, -1).forEach((card, index) => {
            const next = cards[index + 1];
            const scrollTrigger = {
                trigger: next,
                start: "top bottom",
                // Ends where the next card sticks (its CSS `top`).
                end: () => `top ${parseFloat(getComputedStyle(next).top)}px`,
                scrub: true,
                invalidateOnRefresh: true,
            };
            gsap.timeline({ scrollTrigger })
                .to(card.querySelector(".service-card-inner"), { scale: 0.94, ease: "none" }, 0)
                .to(card.querySelector(".service-card-shade"), { opacity: 0.55, ease: "none" }, 0);
        });

        cards.forEach((card) => {
            gsap.from(card.querySelectorAll(".service-icon"), {
                scale: 0,
                rotate: -30,
                duration: 0.9,
                stagger: 0.07,
                ease: "back.out(2)",
                scrollTrigger: { trigger: card, start: "top 70%" },
            });
        });
    }, { scope: ref });

    return (
        <section id="services" ref={ref} className="services container-x section-space">
            <SectionHeading index="03" label={t.services.label} title={t.services.title} />

            <div className="service-stack">
                {services.map((service, index) => (
                    <div key={index} className="service-card" style={{ "--i": index }}>
                        <article className={`service-card-inner tone-${index % 4}`}>
                            <span className="service-card-shade" aria-hidden="true" />
                            <div className="service-card-top">
                                <span className="service-number">0{index + 1}</span>
                                <div className="flex gap-2">
                                    {service.icons.map((icon) => (
                                        <span key={icon} className="service-icon"><img src={icon} alt="" /></span>
                                    ))}
                                </div>
                            </div>
                            <div className="service-card-body">
                                <h3>{t.services.items[index].title}</h3>
                                <p>{t.services.items[index].desc}</p>
                                <ul className="service-points">
                                    {t.services.items[index].points.map((point) => <li key={point}>{point}</li>)}
                                </ul>
                                {pageFor(index) && (
                                    <a className="service-more" href={pageFor(index).path[lang]}>
                                        {t.services.more}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                                    </a>
                                )}
                            </div>
                        </article>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;
