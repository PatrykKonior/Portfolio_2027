import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/motion.js";

// A dot that tracks the pointer exactly and a ring that trails it.
// Elements with data-cursor="Label" grow the ring and show the label inside.
const Cursor = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const [label, setLabel] = useState("");
    const [enabled] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);

    useEffect(() => {
        if (!enabled) return;
        document.documentElement.classList.add("has-cursor");

        const dotX = gsap.quickTo(dotRef.current, "x", { duration: 0.1, ease: "power3" });
        const dotY = gsap.quickTo(dotRef.current, "y", { duration: 0.1, ease: "power3" });
        const ringX = gsap.quickTo(ringRef.current, "x", { duration: 0.55, ease: "power3" });
        const ringY = gsap.quickTo(ringRef.current, "y", { duration: 0.55, ease: "power3" });

        let shown = false;
        const handleMove = (event) => {
            if (!shown) {
                shown = true;
                gsap.set([dotRef.current, ringRef.current], { x: event.clientX, y: event.clientY });
                gsap.to([dotRef.current, ringRef.current], { opacity: 1, duration: 0.3 });
            }
            dotX(event.clientX);
            dotY(event.clientY);
            ringX(event.clientX);
            ringY(event.clientY);
        };

        const handleOver = (event) => {
            const labelled = event.target.closest("[data-cursor]");
            const interactive = event.target.closest("a, button, input, textarea, label, [role='button']");
            setLabel(labelled?.dataset.cursor ?? "");
            ringRef.current.dataset.state = labelled ? "label" : interactive ? "hover" : "";
        };

        const handleLeave = () => gsap.to([dotRef.current, ringRef.current], { opacity: 0, duration: 0.3 });
        const handleEnter = () => gsap.to([dotRef.current, ringRef.current], { opacity: 1, duration: 0.3 });

        window.addEventListener("pointermove", handleMove, { passive: true });
        document.addEventListener("pointerover", handleOver);
        document.documentElement.addEventListener("pointerleave", handleLeave);
        document.documentElement.addEventListener("pointerenter", handleEnter);

        return () => {
            document.documentElement.classList.remove("has-cursor");
            window.removeEventListener("pointermove", handleMove);
            document.removeEventListener("pointerover", handleOver);
            document.documentElement.removeEventListener("pointerleave", handleLeave);
            document.documentElement.removeEventListener("pointerenter", handleEnter);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <>
            <div ref={ringRef} className="cursor-ring" aria-hidden="true">
                <span>{label}</span>
            </div>
            <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
        </>
    );
};

export default Cursor;
