// Contact form backend. Static files are served by Workers Assets; only /api/* runs here.

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

export default {
    async fetch(request, env) {
        const { pathname } = new URL(request.url);
        if (pathname === "/api/contact") return handleContact(request, env);
        return json({ ok: false, error: "not_found" }, 404);
    },
};
