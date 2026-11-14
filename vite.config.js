import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

import site from './site.config.js'

// Structured data about me and my business, so search engines can show a proper profile.
const structuredData = () => ({
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Person',
            '@id': `${site.url}/#person`,
            name: 'Patryk Konior',
            jobTitle: 'Full-stack Developer',
            ...(site.url && { url: site.url }),
            email: 'mailto:patrykkonior4@gmail.com',
            address: { '@type': 'PostalAddress', addressLocality: 'Chorzów', addressCountry: 'PL' },
            knowsLanguage: ['pl', 'en', 'de'],
            knowsAbout: ['Elixir', 'Phoenix LiveView', 'Node.js', '.NET', 'React', 'Svelte', 'TypeScript', 'PostgreSQL', 'Docker'],
            sameAs: ['https://www.linkedin.com/in/patrykkonior/', 'https://github.com/PatrykKonior'],
            worksFor: { '@id': `${site.url}/#business` },
        },
        {
            '@type': 'ProfessionalService',
            '@id': `${site.url}/#business`,
            name: 'Patryk Konior Programming Services',
            taxID: '6272804661',
            founder: { '@id': `${site.url}/#person` },
            ...(site.url && { url: site.url, image: `${site.url}/og-image-en.jpg` }),
            areaServed: ['PL', 'EU'],
            address: { '@type': 'PostalAddress', addressLocality: 'Chorzów', addressCountry: 'PL' },
        },
    ],
})

// Fills in everything that needs the site's address, and emits robots.txt and sitemap.xml.
// With no address in site.config.js, the address-dependent tags and the sitemap are skipped.
const seo = () => ({
    name: 'seo',
    transformIndexHtml(html) {
        const tags = [
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(structuredData()), injectTo: 'head' },
        ]
        if (site.url) {
            const link = (attrs) => ({ tag: 'link', attrs, injectTo: 'head' })
            tags.push(
                link({ rel: 'canonical', href: `${site.url}/` }),
                link({ rel: 'alternate', hreflang: 'en', href: `${site.url}/` }),
                link({ rel: 'alternate', hreflang: 'pl', href: `${site.url}/?lang=pl` }),
                link({ rel: 'alternate', hreflang: 'x-default', href: `${site.url}/` }),
                { tag: 'meta', attrs: { property: 'og:url', content: `${site.url}/` }, injectTo: 'head' },
            )
            html = html.replaceAll('content="/og-image-', `content="${site.url}/og-image-`)
        }
        return { html, tags }
    },
    generateBundle() {
        const robots = ['User-agent: *', 'Allow: /', ...(site.url ? ['', `Sitemap: ${site.url}/sitemap.xml`] : [])].join('\n')
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n` })
        if (!site.url) return
        const today = new Date().toISOString().slice(0, 10)
        // English lives at /, Polish at /?lang=pl (the Worker serves it with Polish meta tags).
        const pages = [`${site.url}/`, `${site.url}/?lang=pl`]
        const alternates = [['en', pages[0]], ['pl', pages[1]], ['x-default', pages[0]]]
            .map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`)
            .join('\n')
        const urls = pages
            .map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`)
            .join('\n')
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
})

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        seo(),
    ],
})
