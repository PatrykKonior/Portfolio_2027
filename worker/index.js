/* global HTMLRewriter */
// Static files are served by Workers Assets. Only the home page and /api/* run here:
// - www and the main workers.dev address redirect to the domain,
// - /?lang=pl gets Polish link-preview tags (social sites don't run JavaScript),
// - /api/contact is the contact form backend.

const LIMITS = { name: 120, email: 254, message: 5000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });

const escapeHtml = (text) =>
    text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

// Rejects requests whose Origin isn't this site, so the endpoint can't be used from elsewhere.
const sameOrigin = (request) => {
    const origin = request.headers.get("origin");
    return !origin || origin === new URL(request.url).origin;
};

// Any failure to reach Cloudflare counts as "not verified", never as a server error.
const verifyTurnstile = async (token, ip, secret) => {
    try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ secret, response: token, remoteip: ip }),
        });
        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error("Turnstile verification failed", error?.message);
        return false;
    }
};

const readForm = (body) => {
    const field = (key) => (typeof body?.[key] === "string" ? body[key].trim() : "");
    // Single-line fields end up in the subject and the From line, so line breaks are dropped.
    const line = (key) => field(key).replace(/[\r\n]+/g, " ");
    const form = {
        name: line("name"),
        email: line("email"),
        message: field("message"),
        token: field("token"),
        lang: field("lang") === "pl" ? "pl" : "en",
        // Honeypot: hidden from people, filled in by naive bots.
        website: field("website"),
    };
    const valid =
        form.name && form.name.length <= LIMITS.name &&
        EMAIL_PATTERN.test(form.email) && form.email.length <= LIMITS.email &&
        form.message && form.message.length <= LIMITS.message;
    return valid ? form : null;
};

const handleContact = async (request, env) => {
    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
    if (!sameOrigin(request)) return json({ ok: false, error: "origin" }, 403);

    let body;
    try {
        body = await request.json();
    } catch {
        return json({ ok: false, error: "invalid" }, 400);
    }

    const form = readForm(body);
    if (!form) return json({ ok: false, error: "invalid" }, 400);
    // Pretend success to bots that filled the honeypot.
    if (form.website) return json({ ok: true });

    const ip = request.headers.get("cf-connecting-ip") ?? undefined;
    if (!env.TURNSTILE_SECRET_KEY || !form.token || !(await verifyTurnstile(form.token, ip, env.TURNSTILE_SECRET_KEY))) {
        return json({ ok: false, error: "captcha" }, 403);
    }

    const sent = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const text = `${form.message}\n\n---\nFrom: ${form.name} <${form.email}>\nSite language: ${form.lang}\nSent: ${sent}`;
    const html = `<p style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:15px">${escapeHtml(form.message)}</p>
<hr style="border:none;border-top:1px solid #ddd">
<p style="font-family:system-ui,sans-serif;font-size:13px;color:#666">
From: <strong>${escapeHtml(form.name)}</strong> &lt;${escapeHtml(form.email)}&gt;<br>
Site language: ${form.lang} · Sent: ${sent}
</p>`;

    try {
        await env.EMAIL.send({
            to: env.MAIL_TO,
            from: { email: env.MAIL_FROM, name: "patrykkonior.com" },
            replyTo: { email: form.email, name: form.name },
            subject: `New message from ${form.name} (patrykkonior.com)`,
            text,
            html,
        });
    } catch (error) {
        console.error("Contact email failed", error?.code, error?.message);
        return json({ ok: false, error: "send" }, 502);
    }

    return json({ ok: true });
};

const SITE = "https://patrykkonior.com";

// Hosts that only mirror the site: www, and the Worker's own workers.dev address. Preview URLs
// (<alias>-portfolio.….workers.dev) don't start with "portfolio." and are left alone.
const isMirror = (hostname) =>
    hostname === "www.patrykkonior.com" || (hostname.startsWith("portfolio.") && hostname.endsWith(".workers.dev"));

const PL = {
    description: "Patryk Konior, full-stack developer z Polski (B2B). Aplikacje webowe, mobilne i desktopowe, API czasu rzeczywistego i wdrożenia w Elixir & Phoenix, Node.js, .NET, React i Svelte.",
    ogDescription: "Aplikacje webowe, mobilne i desktopowe, API czasu rzeczywistego i wdrożenia w Elixir & Phoenix, Node.js, .NET, React i Svelte. Dostępny do projektów B2B.",
    image: `${SITE}/og-image-pl.jpg`,
    url: `${SITE}/?lang=pl`,
};

const setAttribute = (name, value) => ({ element: (element) => element.setAttribute(name, value) });

// Rewrites the English meta tags of index.html into Polish ones.
const polishHome = (response) =>
    new HTMLRewriter()
        .on("html", setAttribute("lang", "pl"))
        .on('meta[name="description"]', setAttribute("content", PL.description))
        .on('meta[property="og:description"], meta[name="twitter:description"]', setAttribute("content", PL.ogDescription))
        .on('meta[property="og:image"], meta[name="twitter:image"]', setAttribute("content", PL.image))
        .on('meta[property="og:url"]', setAttribute("content", PL.url))
        .on('meta[property="og:locale"]', setAttribute("content", "pl_PL"))
        .on('meta[property="og:locale:alternate"]', setAttribute("content", "en_US"))
        .on('link[rel="canonical"]', setAttribute("href", PL.url))
        .transform(response);

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (isMirror(url.hostname) && (request.method === "GET" || request.method === "HEAD")) {
            return Response.redirect(`${SITE}${url.pathname}${url.search}`, 301);
        }

        if (url.pathname === "/api/contact") return handleContact(request, env);
        if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);

        const response = await env.ASSETS.fetch(request);
        const isHtml = response.headers.get("content-type")?.includes("text/html");
        return isHtml && url.searchParams.get("lang") === "pl" ? polishHome(response) : response;
    },
};
