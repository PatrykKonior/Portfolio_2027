import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP, motionOK } from "../lib/motion.js";
import { contactInfo } from "../constants/index.js";
import { useLanguage } from "../i18n/index.js";
import useLocalTime from "../hooks/useLocalTime.js";
import Magnetic from "./Magnetic.jsx";
import LanguageSwitch from "./LanguageSwitch.jsx";

const RollText = ({ children }) => (
    <span className="roll" data-text={children}>
        <span>{children}</span>
    </span>
);

const NavBar = ({ ready }) => {
    const headerRef = useRef(null);
    const menuRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const time = useLocalTime();
    const { t } = useLanguage();
    const navLinks = t.nav.links;

    // Hide while scrolling down, reveal on the way up.
    useGSAP(() => {
        if (!ready) return;
        if (motionOK()) {
            gsap.from(".nav-item", { yPercent: -120, opacity: 0, duration: 1.2, stagger: 0.06, delay: 0.5 });
        }

        ScrollTrigger.create({
            start: 120,
            end: "max",
            onUpdate: (self) => {
                headerRef.current.classList.toggle("nav-hidden", self.direction === 1 && !menuRef.current.classList.contains("open"));
            },
            onLeaveBack: () => headerRef.current.classList.remove("nav-hidden"),
        });
    }, { scope: headerRef, dependencies: [ready] });

    useEffect(() => {
        const menu = menuRef.current;
        if (!menuOpen) return;

        if (motionOK()) {
            gsap.fromTo(menu.querySelectorAll(".menu-link-inner"),
                { yPercent: 110 },
                { yPercent: 0, duration: 1, stagger: 0.07, delay: 0.25 });
        }

        const handleKey = (event) => event.key === "Escape" && setMenuOpen(false);
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);

    // Hovering the logo brings its blob to life inside the icon (see logoLive.js),
    // and the glass tile tilts gently toward the pointer.
    const logoRef = useRef(null);
    const liveCanvasRef = useRef(null);
    const live = useRef(null);
    const hovering = useRef(false);
    const wakeLogo = (active) => {
        hovering.current = active;
        if (!motionOK()) return;
        logoRef.current.classList.toggle("alive", active);
        if (live.current) return live.current.setActive(active);
        if (!active || live.current === false) return;
        live.current = false;
        import("./logoLive.js")
            .then(({ createLogoLive }) => {
                live.current = createLogoLive(liveCanvasRef.current);
                live.current.setActive(hovering.current);
            })
            .catch(() => { live.current = null; });
    };
    useEffect(() => () => live.current?.dispose?.(), []);
    const tiltLogo = (event) => {
        const icon = logoRef.current;
        const rect = icon.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        icon.style.setProperty("--rx", `${-y * 14}deg`);
        icon.style.setProperty("--ry", `${x * 14}deg`);
        live.current?.setPointer?.(x, y);
        icon.style.setProperty("--shine", `${(x + 0.5) * 100}%`);
    };
    const resetLogo = () => {
        const icon = logoRef.current;
        icon.style.setProperty("--rx", "0deg");
        icon.style.setProperty("--ry", "0deg");
    };

    return (
        <header ref={headerRef} className="navbar">
            <div className="nav-inner">
                <a
                    href="#top"
                    className="nav-item nav-logo"
                    onClick={closeMenu}
                    onPointerEnter={() => wakeLogo(true)}
                    onPointerLeave={() => { wakeLogo(false); resetLogo(); }}
                    onPointerMove={tiltLogo}
                    onFocus={() => wakeLogo(true)}
                    onBlur={() => wakeLogo(false)}
                >
                    <span ref={logoRef} className="nav-logo-mark" aria-hidden="true">
                        <img src="/images/blob.webp" alt="" className="logo-blob-still" />
                        <canvas ref={liveCanvasRef} className="logo-blob-live" />
                        <span className="logo-glass" />
                        <span className="logo-letters">PK</span>
                    </span>
                    <span className="nav-logo-text">
                        Patryk Konior<span className="text-muted"> — {t.nav.role}</span>
                    </span>
                </a>

                <nav className="nav-links" aria-label="Main">
                    {navLinks.map(({ name, link }, index) => (
                        <a key={link} href={link} className="nav-item nav-link">
                            <span className="mono text-muted">0{index + 1}</span>
                            <RollText>{name}</RollText>
                        </a>
                    ))}
                </nav>

                <div className="nav-actions">
                    <span className="nav-item nav-time mono">
                        <span className="pulse-dot" /> Chorzów {time}
                    </span>
                    <LanguageSwitch className="nav-item" />
                    <Magnetic className="nav-item">
                        <a href="#contact" className="pill pill-accent nav-cta" onClick={closeMenu}>
                            <RollText>{t.nav.cta}</RollText>
                        </a>
                    </Magnetic>
                    <button
                        type="button"
                        className={`nav-item menu-toggle ${menuOpen ? "open" : ""}`}
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        <span />
                        <span />
                    </button>
                </div>
            </div>

            <nav
                id="mobile-menu"
                ref={menuRef}
                className={`mobile-menu ${menuOpen ? "open" : ""}`}
                aria-label="Mobile"
                aria-hidden={!menuOpen}
            >
                <ul>
                    {[...navLinks, { name: t.nav.contact, link: "#contact" }].map(({ name, link }, index) => (
                        <li key={link} className="menu-link">
                            <a href={link} onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
                                <span className="menu-link-inner">
                                    <span className="mono text-muted">0{index + 1}</span>
                                    {name}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="mobile-menu-footer mono">
                    <a href={`mailto:${contactInfo.email}`} tabIndex={menuOpen ? 0 : -1}>{contactInfo.email}</a>
                    <span>Chorzów {time}</span>
                </div>
            </nav>
        </header>
    );
};

export default NavBar;
