import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { projects, contactInfo } from "../constants/index.js";
import { useLanguage } from "../i18n/index.js";
import ArchitectureDiagram from "../components/ArchitectureDiagram.jsx";
import SectionHeading from "../components/SectionHeading.jsx";

const ProjectCard = ({ project, text, cursor, index }) => (
    <article className="work-card">
        <div className="work-card-info">
            <div className="flex items-center justify-between">
                <span className="mono text-accent">/0{index + 1}</span>
                <span className="mono text-muted">{text.type}</span>
            </div>
            <h3 className="work-card-title">{text.title}</h3>
            <p className="text-muted">{text.desc}</p>
            <ul className="chips">
                {project.tags.map((tag) => <li key={tag} className="chip">{tag}</li>)}
            </ul>
            <div className="work-card-links">
                {project.links.map((link, linkIndex) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="pill" data-cursor={cursor}>
                        {text.links[linkIndex]} <span aria-hidden="true">↗</span>
                    </a>
                ))}
            </div>
        </div>
        <div className="work-card-visual">
            <span className="work-card-index" aria-hidden="true">0{index + 1}</span>
            <ArchitectureDiagram architecture={project.architecture} />
        </div>
    </article>
);

const Work = () => {
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const { t } = useLanguage();

    useGSAP(() => {
        if (!motionOK()) return;
        const mm = gsap.matchMedia();

        // Desktop: pin the section and scroll the cards sideways.
        mm.add("(min-width: 1024px)", () => {
            const track = trackRef.current;
            const distance = () => track.scrollWidth - window.innerWidth;

            const slide = gsap.to(track, {
                x: () => -distance(),
                ease: "none",
                scrollTrigger: {
                    trigger: ".work-pin",
                    start: "top top",
                    end: () => `+=${distance()}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    anticipatePin: 1,
                },
            });

            gsap.fromTo(".work-progress span", { scaleX: 0 }, {
                scaleX: 1,
                ease: "none",
                scrollTrigger: { trigger: ".work-pin", start: "top top", end: () => `+=${distance()}`, scrub: true },
            });

            // fromTo with explicit end values: the nodes' CSS hover transition would otherwise
            // make GSAP read a mid-transition transform as the end state.
            gsap.fromTo(".arch-node", { y: 30, scale: 0.85, opacity: 0 }, {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 0.9,
                stagger: 0.05,
                ease: "back.out(1.8)",
                scrollTrigger: { trigger: ".work-track", start: "top 75%" },
            });

            gsap.utils.toArray(".work-card").forEach((card) => {
                gsap.fromTo(card.querySelector(".work-card-index"), { xPercent: 40 }, {
                    xPercent: -40,
                    ease: "none",
                    scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "right left", scrub: true },
                });
            });
        });

        mm.add("(max-width: 1023px)", () => {
            gsap.utils.toArray(".work-card").forEach((card) => {
                gsap.from(card, { y: 80, opacity: 0, duration: 1.2, scrollTrigger: { trigger: card, start: "top 85%" } });
            });
        });
    }, { scope: sectionRef });

    return (
        <section id="work" ref={sectionRef} className="work">
            <div className="work-pin">
                <div className="container-x">
                    <SectionHeading
                        index="02"
                        label={t.work.label}
                        title={t.work.title}
                        aside={t.work.count(projects.length)}
                    />
                </div>

                <div ref={trackRef} className="work-track">
                    {projects.map((project, index) => (
                        <ProjectCard key={project.links[0].url} project={project} text={t.work.projects[index]} cursor={t.work.cursor} index={index} />
                    ))}
                    <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="work-more" data-cursor="GitHub">
                        <span className="mono text-muted">{t.work.more}</span>
                        <span className="work-more-title" dangerouslySetInnerHTML={{ __html: t.work.moreTitle }} />
                    </a>
                </div>

                <div className="work-progress container-x" aria-hidden="true"><span /></div>
            </div>
        </section>
    );
};

export default Work;
