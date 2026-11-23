import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, motionOK } from "../lib/motion.js";
import { typesetCopy, useLanguage } from "../i18n/index.js";
import { projects } from "../constants/index.js";
import { readyServicePages, serviceChrome } from "../content/servicePages.js";
import { ProjectCard } from "../sections/Work.jsx";
import Magnetic from "../components/Magnetic.jsx";

const Arrow = ({ d = "M5 12h14M13 6l6 6-6 6", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={d} /></svg>
);

const Label = ({ index, children }) => <p className="sp-label mono">({index})&nbsp; {children}</p>;

// The body of a service page (everything between the navbar and the contact form). Rendered on
// the server at build time for search engines, then again in the browser with the animations.
const ServicePage = ({ page }) => {
    const ref = useRef(null);
    const { lang, t } = useLanguage();
    const c = useMemo(() => typesetCopy(page[lang], lang), [page, lang]);
    const ui = serviceChrome[lang];
    const caseProject = projects[0];
    const others = readyServicePages.filter((other) => other.id !== page.id);

    useGSAP(() => {
        if (!motionOK()) return;

        // Headline and section titles rise word by word, like on the home page.
        SplitText.create(".sp-hero h1", {
            type: "lines,words",
            mask: "lines",
            reduceWhiteSpace: false,
            autoSplit: true,
            onSplit: (split) => gsap.from(split.words, { yPercent: 115, rotate: 4, duration: 1.5, stagger: 0.06, delay: 0.2 }),
        });
        gsap.from(".sp-hero-reveal", { y: 40, opacity: 0, duration: 1.3, stagger: 0.1, delay: 0.6 });

        gsap.utils.toArray(".sp-title").forEach((title) => {
            SplitText.create(title, {
                type: "lines,words",
                mask: "lines",
                reduceWhiteSpace: false,
                autoSplit: true,
                onSplit: (split) => gsap.from(split.words, {
                    yPercent: 110,
                    duration: 1.2,
                    stagger: 0.05,
                    scrollTrigger: { trigger: title, start: "top 85%" },
                }),
            });
        });

        gsap.from(".sp-facts > div", { y: 40, opacity: 0, duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: ".sp-facts", start: "top 90%" } });
        gsap.from(".sp-benefit", { y: 70, opacity: 0, duration: 1.2, stagger: 0.09, scrollTrigger: { trigger: ".sp-benefits", start: "top 80%" } });

        // The process line draws as you scroll; each step lights up as the line reaches it.
        const steps = gsap.utils.toArray(".sp-step");
        gsap.fromTo(".sp-progress-fill", { scaleX: 0, scaleY: 0 }, {
            scaleX: 1,
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
                trigger: ".sp-steps",
                start: "top 75%",
                end: "bottom 45%",
                scrub: 0.6,
                onUpdate: (self) => {
                    const active = Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999));
                    steps.forEach((step, index) => {
                        step.classList.toggle("done", index < active || self.progress > 0.995);
                        step.classList.toggle("active", index === active && self.progress < 0.995 && self.progress > 0);
                    });
                },
            },
        });

        gsap.from(".sp-case .work-card", { y: 80, opacity: 0, duration: 1.3, scrollTrigger: { trigger: ".sp-case", start: "top 80%" } });
        gsap.fromTo(".sp-case .arch-node", { y: 30, scale: 0.85, opacity: 0 }, {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.9,
            stagger: 0.06,
            ease: "back.out(1.8)",
            scrollTrigger: { trigger: ".sp-case", start: "top 70%" },
        });
        gsap.from(".sp-faq details", { y: 30, opacity: 0, duration: 0.9, stagger: 0.07, scrollTrigger: { trigger: ".sp-faq-list", start: "top 85%" } });

        ScrollTrigger.refresh();
    }, { scope: ref });

    return (
        <div ref={ref} className="sp">
            <nav className="sp-crumbs mono container-x" aria-label={lang === "pl" ? "Ścieżka" : "Breadcrumb"}>
                <a href={ui.homeHref}>{ui.home}</a><span aria-hidden="true">/</span>
                <a href={`${ui.homeHref}#specializations`}>{ui.services}</a><span aria-hidden="true">/</span>
                <span aria-current="page">{c.breadcrumb}</span>
            </nav>

            <section className="sp-hero container-x">
                <p className="mono sp-hero-reveal"><span className="text-accent">(0{page.homeCard + 1})</span>&nbsp; {c.eyebrow}</p>
                <h1 dangerouslySetInnerHTML={{ __html: c.title }} />
                <p className="sp-lead sp-hero-reveal">{c.lead}</p>
                <div className="sp-hero-actions sp-hero-reveal">
                    <Magnetic strength={0.45}>
                        <a href="#contact" className="round-button round-button-accent" data-cursor-contrast>
                            <span>{c.ctaPrimary}</span>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                        </a>
                    </Magnetic>
                    <a href="#case" className="pill">{c.ctaSecondary}</a>
                </div>
            </section>

            <dl className="sp-facts container-x">
                {c.facts.map((fact) => (
                    <div key={fact.label}><dt className="mono">{fact.label}</dt><dd>{fact.value}</dd></div>
                ))}
            </dl>

            <section id="sp-benefits" className="sp-section container-x" aria-labelledby="sp-benefits-title">
                <Label index="A">{c.benefitsLabel}</Label>
                <h2 id="sp-benefits-title" className="sp-title" dangerouslySetInnerHTML={{ __html: c.benefitsTitle }} />
                <div className="sp-benefits">
                    {c.benefits.map((benefit, index) => (
                        <article key={benefit.title} className="sp-benefit">
                            <span className="sp-num" aria-hidden="true">0{index + 1}</span>
                            <div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.text}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section id="sp-process" className="sp-section container-x" aria-labelledby="sp-process-title">
                <Label index="B">{c.processLabel}</Label>
                <h2 id="sp-process-title" className="sp-title" dangerouslySetInnerHTML={{ __html: c.processTitle }} />
                <div className="sp-steps">
                    <span className="sp-progress" aria-hidden="true"><span className="sp-progress-fill" /></span>
                    <ol>
                        {c.process.map((step, index) => (
                            <li key={step.title} className="sp-step">
                                <span className="sp-dot" aria-hidden="true" />
                                <span className="mono sp-step-label">{c.stepLabel} {index + 1}</span>
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="case" className="sp-section sp-case container-x" aria-labelledby="sp-case-title">
                <Label index="C">{c.caseLabel}</Label>
                <h2 id="sp-case-title" className="visually-hidden">{c.caseStudy.title}</h2>
                <ProjectCard project={caseProject} text={t.work.projects[0]} cursor={t.work.cursor} index={0} />
            </section>

            <section id="sp-faq" className="sp-section sp-faq container-x" aria-labelledby="sp-faq-title">
                <div className="sp-faq-head">
                    <Label index="D">{c.faqLabel}</Label>
                    <h2 id="sp-faq-title" className="sp-title" dangerouslySetInnerHTML={{ __html: c.faqTitle }} />
                </div>
                <div className="sp-faq-list">
                    {c.faq.map((item, index) => (
                        <details
                            key={item.q}
                            name="sp-faq"
                            open={index === 0}
                            // One answer open at a time (also for browsers without exclusive <details name>).
                            onToggle={(event) => {
                                if (!event.currentTarget.open) return;
                                event.currentTarget.parentElement.querySelectorAll("details[open]").forEach((other) => {
                                    if (other !== event.currentTarget) other.open = false;
                                });
                            }}
                        >
                            <summary>
                                <span className="mono sp-faq-index">0{index + 1}</span>
                                <span className="sp-faq-q">{item.q}</span>
                                <span className="sp-faq-icon" aria-hidden="true" />
                            </summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {others.length > 0 && (
                <section className="sp-related container-x" aria-label={c.relatedLabel}>
                    <p className="mono text-muted">{c.relatedLabel}</p>
                    <div>
                        {others.map((other) => (
                            <a key={other.id} href={other.path[lang]}>{other[lang].menuTitle} <Arrow d="M7 17L17 7M8 7h9v9" size={18} /></a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ServicePage;
