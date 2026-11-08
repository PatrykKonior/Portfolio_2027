import { useEffect, useRef } from "react";
import { gsap } from "../lib/motion.js";

// Pulls its child towards the pointer while hovered, then springs back.
const Magnetic = ({ children, strength = 0.35, className = "" }) => {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        const xTo = gsap.quickTo(element, "x", { duration: 0.6, ease: "power3" });
        const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "power3" });

        const handleMove = (event) => {
            const rect = element.getBoundingClientRect();
            xTo((event.clientX - rect.left - rect.width / 2) * strength);
            yTo((event.clientY - rect.top - rect.height / 2) * strength);
        };
        const handleLeave = () => {
            gsap.to(element, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.35)", overwrite: true });
        };

        element.addEventListener("pointermove", handleMove);
        element.addEventListener("pointerleave", handleLeave);
        return () => {
            element.removeEventListener("pointermove", handleMove);
            element.removeEventListener("pointerleave", handleLeave);
        };
    }, [strength]);

    return <span ref={ref} className={`magnetic ${className}`}>{children}</span>;
};

export default Magnetic;
