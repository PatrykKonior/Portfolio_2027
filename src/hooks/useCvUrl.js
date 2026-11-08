import { useEffect, useState } from "react";
import { cvFiles } from "../constants/index.js";
import site from "../../site.config.js";

const checked = {};

// Returns the CV path for the language once the PDF really exists, otherwise null.
// Hosts that fall back to index.html answer 200 for missing files, so the type is checked too.
// site.config.js `preview.cvButtons` shows the buttons before the files are there.
const useCvUrl = (lang) => {
    const url = cvFiles[lang];
    const [available, setAvailable] = useState(checked[url] ?? false);

    useEffect(() => {
        if (site.preview?.cvButtons) return;
        if (url in checked) {
            setAvailable(checked[url]);
            return;
        }
        let cancelled = false;
        fetch(url, { method: "HEAD" })
            .then((response) => response.ok && (response.headers.get("content-type") ?? "").includes("pdf"))
            .catch(() => false)
            .then((exists) => {
                checked[url] = exists;
                if (!cancelled) setAvailable(exists);
            });
        return () => {
            cancelled = true;
        };
    }, [url]);

    return available || site.preview?.cvButtons ? url : null;
};

export default useCvUrl;
