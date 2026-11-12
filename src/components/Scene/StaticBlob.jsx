import { useEffect, useRef } from "react";
import { sceneState } from "../../lib/sceneState.js";

// Pre-rendered stand-in for the WebGL blob on devices without WebGL or too slow for it.
// It follows the same scroll stages and pointer as the real one, just as a flat image.
const StaticBlob = () => {
    const ref = useRef(null);
    const logoRef = useRef(null);

    useEffect(() => {
        const image = ref.current;
        const current = { x: 0, y: 0, size: 0 };
        let frame = 0;

        const render = () => {
            const { blob, pointer, intro, takeover, logo } = sceneState;
            const small = logoRef.current;
            small.style.width = `${logo.size * 2.75 * logo.grow}px`;
            small.style.opacity = logo.grow > 0.002 ? "1" : "0";
            small.style.transform = `translate(-50%, -50%) translate(${logo.x - window.innerWidth / 2}px, ${logo.y - window.innerHeight / 2}px) rotate(${logo.wobble * 18}deg)`;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const mix = (from, to) => from + (to - from) * takeover;
            const target = {
                x: mix(blob.x * width * 0.5 + pointer.x * 30, 0),
                y: mix(-blob.y * height * 0.5 - pointer.y * 24, 0),
                // Matches the WebGL blob's on-screen size, plus room for its glow; during a
                // language switch it swells past the screen edges like the real one.
                size: mix(blob.scale * Math.min(width, height) * 0.26 * 2 * 1.45 * (0.2 + 0.8 * intro), Math.max(width, height) * 2.8),
            };
            const follow = takeover > 0.001 ? 0.35 : 0.08;
            current.x += (target.x - current.x) * follow;
            current.y += (target.y - current.y) * follow;
            current.size += (target.size - current.size) * follow;
            image.style.width = `${current.size}px`;
            image.style.transform = `translate(-50%, -50%) translate(${current.x}px, ${current.y}px)`;
            frame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="scene scene-static" aria-hidden="true">
            <img ref={ref} src="/images/blob.webp" alt="" className="static-blob" />
            <img ref={logoRef} src="/images/blob.webp" alt="" className="static-blob static-logo-blob" />
        </div>
    );
};

export default StaticBlob;
