// The two settings to fill in when the site goes live. Used by the build (SEO tags, sitemap)
// and by the app (analytics).
export default {
    // Full address without a trailing slash, e.g. "https://patrykkonior.dev".
    // While empty, canonical/hreflang tags and the sitemap are left out.
    url: "",

    // Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX". While empty, no analytics
    // and no cookie banner (the site sets no tracking cookies, so none is needed).
    gaMeasurementId: "",

    // Shows the cookie banner and the Download CV buttons before there is a GA ID or a CV file,
    // to review the full page. Set both to false before going live.
    preview: {
        cookieBanner: false,
        cvButtons: false,
    },
};
