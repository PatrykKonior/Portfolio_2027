import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/motion.js";
import { company, contactInfo } from "../constants";
import { useLanguage } from "../i18n/index.js";
import { openPrivacy } from "../lib/privacy.js";
import { consentEnabled, showCookieSettings } from "../lib/consent.js";
import useLocalTime from "../hooks/useLocalTime.js";

const socials = [
  { name: "LinkedIn", url: contactInfo.linkedin },
  { name: "GitHub", url: contactInfo.github },
  { name: "Email", url: `mailto:${contactInfo.email}` },
];

const Footer = () => {
  const footerRef = useRef(null);
  const time = useLocalTime();
  const { t } = useLanguage();
  const navLinks = t.nav.links;

  useGSAP(() => {
    if (!motionOK()) return;
    gsap.from(".footer-giant span", {
      yPercent: 100,
      duration: 1.4,
      stagger: 0.04,
      scrollTrigger: { trigger: ".footer-giant", start: "top 95%" },
    });
  }, { scope: footerRef });

  return (
    <footer ref={footerRef} className="footer container-x">
      <div className="footer-grid">
        <div>
          <p className="mono text-muted">{t.footer.navigation}</p>
          <ul>
            {[...navLinks, { name: t.nav.contact, link: "#contact" }].map(({ name, link }) => (
              <li key={link}><a href={link} className="footer-link">{name}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono text-muted">{t.footer.socials}</p>
          <ul>
            {socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.url}
                  target={social.url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  {social.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono text-muted">{t.footer.localTime}</p>
          <p className="footer-time">{time} <span className="text-muted">CET</span></p>
        </div>
        <div className="md:text-right">
          <a href="#top" className="pill">{t.footer.backToTop}</a>
        </div>
      </div>

      <div className="footer-giant" aria-hidden="true">
        {"KONIOR".split("").map((char, index) => <span key={index}>{char}</span>)}
      </div>

      <div className="footer-bottom mono text-muted">
        <span>© {new Date().getFullYear()} {company.name}</span>
        <span>{t.footer.nip} {company.nip}</span>
        <span className="footer-legal">
          <button type="button" className="footer-link-button" onClick={openPrivacy}>{t.footer.privacy}</button>
          {consentEnabled && (
            <button type="button" className="footer-link-button" onClick={showCookieSettings}>{t.footer.cookies}</button>
          )}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
