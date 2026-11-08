// Download button for the CV. On hover the accent floods out from the icon and the arrow
// keeps "downloading": it drops onto the tray line and comes back in from the top.
const CvButton = ({ href, label, className = "" }) => (
    <a href={href} download className={`cv-button ${className}`}>
        <span className="cv-fill" aria-hidden="true" />
        <span className="cv-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="cv-arrow"><path d="M12 4v12M6 10l6 6 6-6" /></svg>
            <span className="cv-tray" />
        </span>
        <span className="roll" data-text={label}>
            <span>{label}</span>
        </span>
        <span className="cv-tag mono" aria-hidden="true">PDF</span>
    </a>
);

export default CvButton;
