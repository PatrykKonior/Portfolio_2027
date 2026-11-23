import { servicePages, serviceChrome } from "../content/servicePages.js";

// Same icons as on the service pages (build/servicePages.js).
const ICONS = {
    browser: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 8h18M8 21h8" /></>,
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    bag: <><path d="M5 7h14l-1.5 10h-11z" /><path d="M9 7a3 3 0 016 0" /></>,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
};

export const ServiceIcon = ({ name }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[name] ?? ICONS.browser}
    </svg>
);

// The dropdown under "Services" in the navbar (desktop): every service page plus a featured case study.
const ServicesMenu = ({ lang }) => {
    const ui = serviceChrome[lang];
    const feature = servicePages[0][lang].caseStudy;
    return (
        <div className="mega">
            <div className="mega-list">
                <p className="mono text-muted">{ui.services}</p>
                {servicePages.map((page) => (
                    <a key={page.id} className="mega-item" href={page.path[lang]}>
                        <span className="mega-icon"><ServiceIcon name={page.icon} /></span>
                        <span>
                            <strong>{page[lang].menuTitle}</strong>
                            <small>{page[lang].menuDesc}</small>
                        </span>
                    </a>
                ))}
                <a className="mega-more" href="#contact">{ui.moreServices} <span>{ui.contact} →</span></a>
            </div>
            <a className="mega-feature" href="#work">
                <img src="/images/blob-pearl.webp" alt="" width="272" height="254" loading="lazy" />
                <span className="mono text-accent">{feature.tag}</span>
                <strong>{feature.title}</strong>
                <small>{feature.type} →</small>
            </a>
        </div>
    );
};

export default ServicesMenu;
