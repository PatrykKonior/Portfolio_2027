import { LANGUAGES, useLanguage } from "../i18n/index.js";

// EN / PL pill; the thumb slides under the active language.
const LanguageSwitch = ({ className = "" }) => {
    const { lang, t, switchLanguage } = useLanguage();

    return (
        <div
            className={`lang-switch ${className}`}
            role="radiogroup"
            aria-label={t.language.label}
            style={{ "--active": LANGUAGES.indexOf(lang) }}
        >
            <span className="lang-thumb" aria-hidden="true" />
            {LANGUAGES.map((code) => (
                <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={lang === code}
                    className={lang === code ? "active" : ""}
                    onClick={() => switchLanguage(code)}
                    lang={code}
                >
                    {code.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitch;
