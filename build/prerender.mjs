// Runs after `vite build` and `vite build --ssr src/service-ssr.jsx`: writes one HTML file per
// service page and language, with its own meta tags and structured data, and the page already
// rendered inside #root, so search engines and link previews see the full content.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import site from "../site.config.js";
import { serviceChrome } from "../src/content/servicePages.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { pages, render } = await import(pathToFileURL(join(root, "dist-ssr", "service-ssr.js")).href);
const template = readFileSync(join(dist, "service.html"), "utf8");

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const plain = (html) => html.replace(/<[^>]+>/g, "");

const head = (page, lang) => {
    const c = page[lang];
    const ui = serviceChrome[lang];
    const other = lang === "pl" ? "en" : "pl";
    const url = `${site.url}${page.path[lang]}`;
    const image = `${site.url}/og-image-${lang}.jpg?v=7`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: ui.home, item: `${site.url}${ui.homeHref}` },
                    { "@type": "ListItem", position: 2, name: c.breadcrumb, item: url },
                ],
            },
            {
                "@type": "Service",
                name: c.metaTitle.split(" | ")[0],
                description: c.metaDescription,
                url,
                serviceType: c.menuTitle,
                areaServed: ["PL", "EU"],
                provider: { "@type": "ProfessionalService", "@id": `${site.url}/#business`, name: "Patryk Konior Programming Services", url: site.url },
            },
            {
                "@type": "FAQPage",
                mainEntity: c.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            },
        ],
    };
    return [
        `<title>${escapeHtml(c.metaTitle)}</title>`,
        `<meta name="description" content="${escapeHtml(c.metaDescription)}" />`,
        `<link rel="canonical" href="${url}" />`,
        `<link rel="alternate" hreflang="${lang}" href="${url}" />`,
        `<link rel="alternate" hreflang="${other}" href="${site.url}${page.path[other]}" />`,
        `<link rel="alternate" hreflang="x-default" href="${site.url}${page.path.en}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="Patryk Konior" />`,
        `<meta property="og:title" content="${escapeHtml(c.metaTitle)}" />`,
        `<meta property="og:description" content="${escapeHtml(c.metaDescription)}" />`,
        `<meta property="og:url" content="${url}" />`,
        `<meta property="og:image" content="${image}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:locale" content="${lang === "pl" ? "pl_PL" : "en_US"}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeHtml(c.metaTitle)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(c.metaDescription)}" />`,
        `<meta name="twitter:image" content="${image}" />`,
        `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
        `<script>window.__SERVICE_PAGE__=${JSON.stringify({ id: page.id, lang })}</script>`,
    ].join("\n    ");
};

for (const page of pages) {
    for (const lang of ["pl", "en"]) {
        const html = template
            .replace('<html lang="en">', `<html lang="${lang}">`)
            .replace("<!--service-head-->", head(page, lang))
            .replace("<!--service-app-->", render(page, lang));
        const file = join(dist, page.path[lang], "index.html");
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, html);
        console.log(`prerendered ${page.path[lang]} (${plain(page[lang].menuTitle)})`);
    }
}

rmSync(join(dist, "service.html"));
rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
