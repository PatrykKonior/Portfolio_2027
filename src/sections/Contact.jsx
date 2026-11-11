import { useRef, useState } from "react";

import { gsap, SplitText, useGSAP, motionOK } from "../lib/motion.js";
import { contactInfo } from "../constants";
import { useLanguage } from "../i18n/index.js";
import useCvUrl from "../hooks/useCvUrl.js";
import CvButton from "../components/CvButton.jsx";
import { openPrivacy } from "../lib/privacy.js";
import Magnetic from "../components/Magnetic.jsx";
import Turnstile from "../components/Turnstile.jsx";
import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "../components/Icons";

const Contact = () => {
  const sectionRef = useRef(null);
  const formRef = useRef(null);
  const turnstileRef = useRef(null);
  const [token, setToken] = useState("");
  const { lang, t } = useLanguage();
  const copy = t.contact;
  const cvUrl = useCvUrl(lang);
  const [status, setStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });

  useGSAP(() => {
    if (!motionOK()) return;

    SplitText.create(".contact-title", {
      type: "lines,chars",
      mask: "lines",
      linesClass: "sline",
      autoSplit: true,
      onSplit: (split) => gsap.from(split.chars, {
        yPercent: 120,
        duration: 1.3,
        stagger: 0.02,
        scrollTrigger: { trigger: ".contact-title", start: "top 80%" },
      }),
    });

    gsap.from(".contact-reveal", {
      y: 50,
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
      scrollTrigger: { trigger: ".contact-grid", start: "top 80%" },
    });
  }, { scope: sectionRef });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(contactInfo.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    // If the background check hasn't finished yet, give it a few seconds instead of failing.
    const verified = token || (await turnstileRef.current?.getToken()) || "";
    if (!verified) {
      setStatus("captcha");
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, token: verified, lang }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error ?? response.status);

      setForm({ name: "", email: "", message: "", website: "" });
      setStatus("sent");
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus(String(error.message) === "captcha" ? "captcha" : "error");
    } finally {
      // Turnstile tokens are single-use.
      turnstileRef.current?.reset();
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="contact container-x section-space">
      <div className="section-meta">
        <span className="mono">(06)</span>
        <span className="mono">{copy.label}</span>
        <span className="mono ms-auto availability-inline"><span className="pulse-dot pulse-dot-available" /> {copy.status}</span>
      </div>

      <h2 className="contact-title" dangerouslySetInnerHTML={{ __html: copy.title }} />

      <div className="contact-grid">
        <div className="contact-info">
          <div className="contact-reveal">
            <p className="mono text-muted mb-3">{copy.writeToMe}</p>
            <div className="contact-email-row">
              <a href={`mailto:${contactInfo.email}`} className="contact-email" data-cursor={copy.emailCursor}>
                {contactInfo.email}
              </a>
              <button type="button" onClick={handleCopyEmail} className="pill" aria-label={copy.copyAria}>
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? copy.copied : copy.copy}
              </button>
            </div>
          </div>

          <ul className="contact-socials contact-reveal">
            {[
              { label: "LinkedIn", value: "in/patrykkonior", href: contactInfo.linkedin },
              { label: "GitHub", value: "PatrykKonior", href: contactInfo.github },
            ].map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="contact-social">
                  <span className="mono text-muted">{link.label}</span>
                  <span>{link.value}</span>
                  <ArrowUpRightIcon className="size-5 contact-social-arrow" />
                </a>
              </li>
            ))}
          </ul>

          <dl className="contact-facts contact-reveal">
            {copy.facts.map((fact) => (
              <div key={fact.label}><dt className="mono text-muted">{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl>

          {cvUrl && (
            <div className="contact-reveal">
              <CvButton href={cvUrl} label={copy.cv} className="cv-button-accent" />
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
          <div className="field contact-reveal">
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} placeholder=" " required />
            <label htmlFor="name">{copy.name}</label>
          </div>
          <div className="field contact-reveal">
            <input type="email" id="email" name="email" value={form.email} onChange={handleChange} placeholder=" " required />
            <label htmlFor="email">{copy.email}</label>
          </div>
          <div className="field contact-reveal">
            <textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder=" " rows="4" required />
            <label htmlFor="message">{copy.message}</label>
          </div>

          {/* Honeypot for bots: hidden from people and screen readers. */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
          </div>

          <Turnstile ref={turnstileRef} lang={lang} onToken={setToken} />

          <p className="consent-note contact-reveal">
            {copy.consent}{" "}
            <button type="button" className="text-link" onClick={openPrivacy}>{copy.privacyLink}</button>
          </p>

          <div className="contact-submit contact-reveal">
            <p role="status" aria-live="polite" className="text-sm">
              {status === "sent" && <span className="text-accent">{copy.sent}</span>}
              {status === "captcha" && <span className="text-rose-400">{copy.captcha}</span>}
              {status === "error" && (
                <span className="text-rose-400">{copy.error(contactInfo.email)}</span>
              )}
            </p>
            <Magnetic strength={0.4}>
              <button type="submit" className="round-button round-button-accent" disabled={status === "sending"}>
                <span>{status === "sending" ? copy.sending : copy.send}</span>
                <ArrowUpRightIcon className="size-6" />
              </button>
            </Magnetic>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Contact;
