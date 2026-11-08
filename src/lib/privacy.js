// Opens the privacy policy dialog mounted in App, from anywhere.
export const openPrivacy = () => window.dispatchEvent(new Event("privacy:open"));
