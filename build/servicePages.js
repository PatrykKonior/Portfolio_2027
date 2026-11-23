// Vite plugin: prerenders the service pages from src/content/servicePages.js into plain static HTML
// (one file per page and language), with their own stylesheet, fonts and a tiny script. No React
// and no 3D here, so the pages are fast and fully readable by search engines and link previews.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { servicePages, serviceChrome } from "../src/content/servicePages.js";
import { contactInfo, company } from "../src/constants/index.js";

const require = createRequire(import.meta.url);
const here = (file) => fileURLToPath(new URL(file, import.meta.url));
const fontFile = (pkg, file) => readFileSync(require.resolve(`${pkg}/files/${file}`));

const FONTS = {
    INTER_LATIN: ["@fontsource-variable/inter-tight", "inter-tight-latin-wght-normal.woff2"],
    INTER_LATIN_EXT: ["@fontsource-variable/inter-tight", "inter-tight-latin-ext-wght-normal.woff2"],
    SERIF_ITALIC_LATIN: ["@fontsource/instrument-serif", "instrument-serif-latin-400-italic.woff2"],
    SERIF_ITALIC_LATIN_EXT: ["@fontsource/instrument-serif", "instrument-serif-latin-ext-400-italic.woff2"],
    MONO_LATIN: ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-400-normal.woff2"],
    MONO_LATIN_EXT: ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-ext-400-normal.woff2"],
};

const ICONS = {
    browser: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M8 21h8"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bag: '<path d="M5 7h14l-1.5 10h-11z"/><path d="M9 7a3 3 0 016 0"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};
const icon = (name, size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.browser}</svg>`;
const arrow = (d = "M7 17L17 7M8 7h9v9", size = 16) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${d}"/></svg>`;
const chevron = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Copy may contain <em>…</em> on purpose; this keeps it and strips it for plain-text places.
const plain = (html) => html.replace(/<[^>]+>/g, "");
// One-letter Polish words stay with the next word (same rule as the home page).
const glue = (text, lang) => lang === "pl" ? text.replace(/(^|[\s(„>])([aiouwzAIOUWZ]) +/g, "$1$2\u00A0").replace(/(^|[\s(„>])([aiouwzAIOUWZ]) +/g, "$1$2\u00A0") : text;

const pageHtml = ({ page, lang, site, assets, gaId }) => {
    const c = page[lang];
    const ui = serviceChrome[lang];
    const other = lang === "pl" ? "en" : "pl";
    const url = `${site.url}${page.path[lang]}`;
    const t = (text) => glue(text, lang);
    const ogImage = `${site.url}/og-image-${lang}.jpg?v=6`;

    const others = servicePages.filter((p) => p.id !== page.id);
    const menuItems = servicePages.map((p) => `
            <a class="mega-item" href="${p.path[lang]}"${p.id === page.id ? ' aria-current="page"' : ""}>
              <span class="mega-icon">${icon(p.icon)}</span>
              <span><strong>${escapeHtml(p[lang].menuTitle)}</strong><small>${escapeHtml(p[lang].menuDesc)}</small></span>
            </a>`).join("");

    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: ui.home, item: `${site.url}${ui.homeHref}` },
                    { "@type": "ListItem", position: 2, name: plain(c.breadcrumb), item: url },
                ],
            },
            {
                "@type": "Service",
                name: plain(c.metaTitle.split(" | ")[0]),
                description: c.metaDescription,
                url,
                serviceType: plain(c.menuTitle),
                areaServed: ["PL", "EU"],
                provider: { "@id": `${site.url}/#business` },
            },
            {
                "@type": "FAQPage",
                mainEntity: c.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            },
        ],
    };

    return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(c.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(c.metaDescription)}" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="${lang}" href="${url}" />
  <link rel="alternate" hreflang="${other}" href="${site.url}${page.path[other]}" />
  <link rel="alternate" hreflang="x-default" href="${site.url}${page.path.en}" />
  <meta name="theme-color" content="#0a0a0b" />
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" type="image/png" href="/favicon-96.png" sizes="96x96" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Patryk Konior" />
  <meta property="og:title" content="${escapeHtml(c.metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(c.metaDescription)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="${lang === "pl" ? "pl_PL" : "en_US"}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(c.metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(c.metaDescription)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="preload" href="/${assets.INTER_LATIN}" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/${assets.css}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body${gaId ? ` data-ga="${gaId}"` : ""}>
<a class="skip" href="#main">${lang === "pl" ? "Przejdź do treści" : "Skip to content"}</a>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="${ui.homeHref}"><img src="/favicon-96.png" alt="" width="40" height="40" /><span class="brand-text">Patryk Konior <span class="muted">— ${ui.role}</span></span></a>
    <nav class="nav" aria-label="${lang === "pl" ? "Główna" : "Main"}">
      ${ui.nav.slice(0, 2).map(([name, href], i) => `<a href="${href}"><span class="mono">0${i + 1}</span> ${name}</a>`).join("\n      ")}
      <div class="nav-services">
        <button type="button" aria-haspopup="true"><span class="mono accent">03</span> ${ui.services} ${chevron}</button>
        <div class="mega">
          <div class="mega-list">
            <p class="mono">${ui.services}</p>${menuItems}
            <a class="mega-more" href="${ui.contactHref}">${escapeHtml(ui.moreServices)} <span>${ui.contact} →</span></a>
          </div>
          <a class="mega-feature" href="${ui.caseHref}">
            <img src="/images/blob-pearl.webp" alt="" width="272" height="254" loading="lazy" />
            <span class="mono accent">${escapeHtml(c.caseStudy.tag)}</span>
            <strong>${escapeHtml(c.caseStudy.title)}</strong>
            <small>${escapeHtml(c.caseStudy.type)} →</small>
          </a>
        </div>
      </div>
    </nav>
    <div class="actions">
      <div class="lang" aria-label="${lang === "pl" ? "Język" : "Language"}">
        <a href="${page.path.en}" hreflang="en" lang="en"${lang === "en" ? ' aria-current="true"' : ""}>EN</a>
        <a href="${page.path.pl}" hreflang="pl" lang="pl"${lang === "pl" ? ' aria-current="true"' : ""}>PL</a>
      </div>
      <a class="pill-accent" href="${ui.contactHref}">${ui.cta}</a>
      <button type="button" class="menu-toggle" data-menu-toggle aria-controls="mobile-menu" aria-expanded="false" aria-label="${ui.menu}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 9h16M4 15h16"/></svg>
      </button>
    </div>
  </div>
</header>

<nav id="mobile-menu" class="mobile-menu" aria-label="${ui.menu}">
  <button type="button" class="menu-toggle close" data-menu-toggle aria-label="${ui.close}">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
  <ul>
    ${ui.nav.slice(0, 2).map(([name, href], i) => `<li><a href="${href}"><span class="mono muted">0${i + 1}</span>${name}</a></li>`).join("\n    ")}
    <li><a href="${ui.nav[2][1]}"><span class="mono muted">03</span>${ui.services}</a></li>
    ${servicePages.map((p) => `<li class="sub"><a href="${p.path[lang]}"${p.id === page.id ? ' aria-current="page"' : ""}>${escapeHtml(p[lang].menuTitle)}</a></li>`).join("\n    ")}
    <li><a href="${ui.contactHref}"><span class="mono muted">04</span>${ui.contact}</a></li>
  </ul>
</nav>

<main id="main" class="container">
  <nav class="crumbs mono" aria-label="${lang === "pl" ? "Ścieżka" : "Breadcrumb"}">
    <a href="${ui.homeHref}">${ui.home}</a><span aria-hidden="true">/</span>
    <a href="${ui.nav[2][1]}">${ui.services}</a><span aria-hidden="true">/</span>
    <span aria-current="page">${escapeHtml(c.breadcrumb)}</span>
  </nav>

  <section class="hero">
    <div class="hero-text">
      <p class="mono"><span class="accent">(0${page.homeCard + 1})</span>&nbsp; ${escapeHtml(c.eyebrow)}</p>
      <h1>${t(c.title)}</h1>
      <p class="lead">${t(escapeHtml(c.lead))}</p>
      <div class="buttons">
        <a class="btn btn-accent" href="${ui.contactHref}">${escapeHtml(c.ctaPrimary)} ${arrow()}</a>
        <a class="btn" href="#case">${escapeHtml(c.ctaSecondary)}</a>
      </div>
    </div>
    <div class="hero-art"><img src="/images/blob-pearl.webp" alt="" width="640" height="584" fetchpriority="high" /></div>
  </section>

  <dl class="facts">
    ${c.facts.map((f) => `<div><dt class="mono">${escapeHtml(f.label)}</dt><dd>${t(escapeHtml(f.value))}</dd></div>`).join("\n    ")}
  </dl>

  <section class="section" aria-labelledby="benefits-title">
    <p class="section-label mono">(A)&nbsp; ${escapeHtml(c.benefitsLabel)}</p>
    <h2 id="benefits-title">${t(c.benefitsTitle)}</h2>
    <div class="benefits">
      ${c.benefits.map((b, i) => `<article class="benefit"><span class="num" aria-hidden="true">0${i + 1}</span><div><h3>${t(escapeHtml(b.title))}</h3><p>${t(escapeHtml(b.text))}</p></div></article>`).join("\n      ")}
    </div>
  </section>

  <section class="section" aria-labelledby="process-title">
    <p class="section-label mono">(B)&nbsp; ${escapeHtml(c.processLabel)}</p>
    <h2 id="process-title">${t(c.processTitle)}</h2>
    <ol class="steps">
      ${c.process.map((s, i) => `<li><span class="mono accent">${escapeHtml(c.stepLabel)} ${i + 1}</span><h3>${t(escapeHtml(s.title))}</h3><p>${t(escapeHtml(s.text))}</p></li>`).join("\n      ")}
    </ol>
  </section>

  <section class="section" id="case" aria-labelledby="case-title">
    <p class="section-label mono">(C)&nbsp; ${escapeHtml(c.caseLabel)}</p>
    <a class="case" href="${ui.caseHref}">
      <div class="case-text">
        <div class="case-meta mono"><span class="accent">${escapeHtml(c.caseStudy.tag)}</span><span class="muted">${escapeHtml(c.caseStudy.type)}</span></div>
        <h3 id="case-title">${t(escapeHtml(c.caseStudy.title))}</h3>
        <p>${t(escapeHtml(c.caseStudy.text))}</p>
        <ul class="chips">${c.caseStudy.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
        <span class="case-link">${escapeHtml(c.caseStudy.link)} ${arrow("M5 12h14M13 6l6 6-6 6")}</span>
      </div>
      <div class="case-art" aria-hidden="true">
        <div class="node-row">${c.caseStudy.diagram.apps.map((app) => `<span class="node"><span class="mono">${escapeHtml(c.caseStudy.diagram.client)}</span>${escapeHtml(app)}</span>`).join("")}</div>
        <span class="wire"></span>
        <span class="node"><span class="mono">${escapeHtml(c.caseStudy.diagram.server)}</span>${escapeHtml(c.caseStudy.diagram.api)}</span>
        <span class="wire"></span>
        <span class="node"><span class="mono">${escapeHtml(c.caseStudy.diagram.data)}</span>${escapeHtml(c.caseStudy.diagram.db)}</span>
      </div>
    </a>
  </section>

  <section class="section" aria-labelledby="faq-title">
    <div class="faq-wrap">
      <div>
        <p class="section-label mono">(D)&nbsp; ${escapeHtml(c.faqLabel)}</p>
        <h2 id="faq-title">${t(c.faqTitle)}</h2>
      </div>
      <div class="faq">
        ${c.faq.map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${t(escapeHtml(f.q))}</summary><p>${t(escapeHtml(f.a))}</p></details>`).join("\n        ")}
      </div>
    </div>
  </section>

  <section class="cta" aria-labelledby="cta-title">
    <img src="/images/blob-pearl.webp" alt="" width="640" height="584" loading="lazy" />
    <div>
      <p class="mono muted">${escapeHtml(c.ctaEyebrow)}</p>
      <h2 id="cta-title">${t(c.ctaTitle)}</h2>
    </div>
    <div><a class="btn btn-accent" href="${ui.contactHref}">${escapeHtml(c.ctaButton)} ${arrow()}</a></div>
  </section>

  ${others.length ? `<section class="related" aria-label="${escapeHtml(c.relatedLabel)}">
    <p class="mono muted">${escapeHtml(c.relatedLabel)}</p>
    <div class="related-list">${others.map((p) => `<a href="${p.path[lang]}">${escapeHtml(p[lang].menuTitle)} ${arrow("M7 17L17 7M8 7h9v9", 18)}</a>`).join("")}</div>
  </section>` : ""}
</main>

<footer class="footer container">
  <div class="footer-grid">
    <div><p class="mono">${ui.footerServices}</p>${servicePages.map((p) => `<a href="${p.path[lang]}">${escapeHtml(p[lang].menuTitle)}</a>`).join("")}</div>
    <div><p class="mono">${ui.footerSite}</p>${ui.site.map(([name, href]) => `<a href="${href}">${name}</a>`).join("")}</div>
    <div><p class="mono">${ui.footerSocial}</p><a href="${contactInfo.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="${contactInfo.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="mailto:${contactInfo.email}">Email ↗</a></div>
  </div>
  <div class="footer-giant" aria-hidden="true">${"KONIOR".split("").map((ch) => `<span>${ch}</span>`).join("")}</div>
  <div class="footer-bottom mono">
    <span>© ${new Date().getFullYear()} ${company.name}</span>
    <span>NIP ${company.nip}</span>
    <a href="${ui.homeHref.includes("?") ? `${ui.homeHref}#privacy` : "/#privacy"}">${ui.privacy}</a>
  </div>
</footer>

${gaId ? `<aside id="consent" class="consent" aria-labelledby="consent-title" hidden>
  <p class="mono muted">Cookies</p>
  <h2 id="consent-title">${lang === "pl" ? "Krótko o <em>ciasteczkach</em>" : "A quick word on <em>cookies</em>"}</h2>
  <p>${lang === "pl" ? t("Ciasteczek analitycznych używam tylko za Twoją zgodą, żeby wiedzieć, skąd trafiają tu odwiedzający i jak korzystają ze strony. Żadnych reklam, nic nie sprzedaję.") : "I use analytics cookies only if you agree, to see how visitors find and use this site. Nothing for ads, nothing sold."}</p>
  <div class="buttons"><button type="button" data-consent="accept">${lang === "pl" ? "Akceptuję" : "Accept"}</button><button type="button" data-consent="reject">${lang === "pl" ? "Odrzucam" : "Reject"}</button></div>
</aside>` : ""}
<script src="/${assets.js}" defer></script>
</body>
</html>
`;
};

export const servicePagePaths = () => servicePages.flatMap((page) => [page.path.pl, page.path.en]);

export default function servicePagesPlugin(site) {
    return {
        name: "service-pages",
        apply: "build",
        generateBundle() {
            const assets = {};
            let css = readFileSync(here("./service-page/service.css"), "utf8");
            for (const [key, [pkg, file]] of Object.entries(FONTS)) {
                const ref = this.emitFile({ type: "asset", name: file, source: fontFile(pkg, file) });
                assets[key] = this.getFileName(ref);
                css = css.replaceAll(`__FONT_${key}__`, `/${assets[key]}`);
            }
            assets.css = this.getFileName(this.emitFile({ type: "asset", name: "service.css", source: css }));
            assets.js = this.getFileName(this.emitFile({ type: "asset", name: "service.js", source: readFileSync(here("./service-page/client.js"), "utf8") }));

            for (const page of servicePages) {
                for (const lang of ["pl", "en"]) {
                    this.emitFile({
                        type: "asset",
                        fileName: `${page.path[lang].replace(/^\//, "")}index.html`,
                        source: pageHtml({ page, lang, site, assets, gaId: site.gaMeasurementId }),
                    });
                }
            }
        },
    };
}
