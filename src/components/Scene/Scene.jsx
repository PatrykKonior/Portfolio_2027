import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import { blobFragment, blobVertex } from "./shaders.js";
import { sceneState } from "../../lib/sceneState.js";
import { gsap, ScrollTrigger, useGSAP, motionOK } from "../../lib/motion.js";
import { useLanguage } from "../../i18n/index.js";
import StaticBlob from "./StaticBlob.jsx";

const { damp, lerp } = THREE.MathUtils;

// Mesh radius while the blob covers the screen: big enough to fill any aspect ratio, small
// enough (with the flattened surface) that the camera at z = 6 never ends up inside it.
const TAKEOVER_RADIUS = 4.8;

const Blob = ({ detail, still }) => {
    const mesh = useRef(null);
    const viewport = useThree((state) => state.viewport);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uDistort: { value: 0.3 },
        uFrequency: { value: 1.05 },
        uAccent: { value: 0 },
        uFlood: { value: 0 },
        uDim: { value: 1 },
        uAccentColor: { value: new THREE.Color("#4d7cff") },
    }), []);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.05);
        const { blob, pointer, velocity, intro, takeover } = sceneState;
        uniforms.uDim.value = lerp(blob.dim, 1, takeover);
        const speed = Math.min(Math.abs(velocity) * 0.02, 1.4) * (1 - takeover);
        // During a takeover the blob follows the tween tightly instead of easing behind it.
        const follow = takeover > 0.001 ? 14 : 1;

        // With reduced motion the blob keeps its shape and only follows the scroll.
        if (!still) uniforms.uTime.value += delta * (0.4 + speed + takeover * 1.2);
        uniforms.uDistort.value = damp(uniforms.uDistort.value, lerp(blob.distort + speed * 0.18, 0.08, takeover), 4 * follow, delta);
        uniforms.uAccent.value = damp(uniforms.uAccent.value, lerp(blob.accent, 1, takeover), 3, delta);
        uniforms.uFlood.value = takeover;

        const target = mesh.current;
        const x = blob.x * viewport.width * 0.5 + pointer.x * 0.25;
        const y = blob.y * viewport.height * 0.5 + pointer.y * 0.2;
        target.position.x = damp(target.position.x, lerp(x, 0, takeover), 2.5 * follow, delta);
        target.position.y = damp(target.position.y, lerp(y, 0, takeover), 2.5 * follow, delta);

        const fit = Math.min(viewport.width, viewport.height) * 0.26;
        const scale = lerp(blob.scale * fit * (0.2 + 0.8 * intro), TAKEOVER_RADIUS, takeover);
        target.scale.setScalar(damp(target.scale.x, scale, 3 * follow, delta));

        if (!still) target.rotation.y += delta * 0.12;
        target.rotation.x = damp(target.rotation.x, -pointer.y * 0.5, 2, delta);
        target.rotation.z = damp(target.rotation.z, pointer.x * 0.3, 2, delta);
    });

    return (
        <mesh ref={mesh} scale={0.01}>
            <icosahedronGeometry args={[1, detail]} />
            <shaderMaterial vertexShader={blobVertex} fragmentShader={blobFragment} uniforms={uniforms} />
        </mesh>
    );
};

const Dust = ({ count }) => {
    const points = useRef(null);

    const positions = useMemo(() => {
        const array = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const radius = 4 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            array[i * 3 + 2] = radius * Math.cos(phi) - 4;
        }
        return array;
    }, [count]);

    useFrame((_, delta) => {
        const drift = 0.015 + Math.min(Math.abs(sceneState.velocity) * 0.003, 0.25);
        points.current.rotation.y += delta * drift;
        points.current.rotation.x = damp(points.current.rotation.x, sceneState.pointer.y * 0.08, 2, delta);
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#ecebe6" size={0.018} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
        </points>
    );
};

// The blob's radius at scale 1, as a fraction of the shorter viewport side (see Blob's `fit`).
const UNIT_RADIUS = 0.26;
const toBlobX = (px) => (px / window.innerWidth) * 2 - 1;
const toBlobY = (px) => 1 - (px / window.innerHeight) * 2;
const scaleForRadius = (px) => px / (UNIT_RADIUS * Math.min(window.innerWidth, window.innerHeight));
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Both layouts end with the blob centred on the giant name in the footer, wherever that lands.
const onFooterName = (sizeFactor) => () => {
    const name = document.querySelector(".footer-giant");
    if (!name) return { x: 0, y: -0.5, scale: 0.6, distort: 0.28, accent: 0.5, dim: 0.9 };
    const rect = name.getBoundingClientRect();
    // Where the name sits once the page is scrolled all the way down.
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const centerY = rect.top + window.scrollY - maxScroll + rect.height / 2;
    return {
        x: toBlobX(rect.left + rect.width / 2),
        y: toBlobY(centerY),
        scale: clamp(scaleForRadius(rect.height * sizeFactor), 0.3, 0.9),
        distort: 0.28,
        accent: 0.5,
        dim: 0.9,
    };
};

// Where the blob sits for each section, in fractions of the half-viewport. `dim` fades it where it
// would sit behind text. A stage can be a function, re-measured whenever the layout refreshes.
const stages = {
    desktop: [
        [null, { x: 0.5, y: 0.08, scale: 1, distort: 0.22, accent: 0, dim: 1 }],
        ["#about", { x: 0.62, y: -0.4, scale: 0.7, distort: 0.38, accent: 0.35, dim: 1 }],
        ["#work", { x: 0.72, y: 0.58, scale: 0.32, distort: 0.18, accent: 1, dim: 1 }],
        ["#services", { x: -0.66, y: -0.1, scale: 0.8, distort: 0.45, accent: 0.2, dim: 1 }],
        ["#experience", { x: 0.74, y: -0.45, scale: 0.45, distort: 0.3, accent: 0.6, dim: 1 }],
        ["#contact", { x: 0.55, y: 0.05, scale: 1, distort: 0.32, accent: 1, dim: 1 }],
        [".footer", onFooterName(0.62)],
    ],
    // On phones text runs the full width, so the blob still travels between sections but dims
    // whenever it sits behind text.
    mobile: [
        [null, { x: 0.42, y: 0.12, scale: 0.95, distort: 0.22, accent: 0, dim: 0.55 }],
        ["#about", { x: -0.55, y: -0.3, scale: 0.65, distort: 0.35, accent: 0.35, dim: 0.4 }],
        ["#work", { x: 0.6, y: 0.55, scale: 0.4, distort: 0.18, accent: 1, dim: 0.7 }],
        ["#services", { x: -0.5, y: -0.45, scale: 0.65, distort: 0.4, accent: 0.2, dim: 0.45 }],
        ["#experience", { x: 0.55, y: 0.45, scale: 0.5, distort: 0.3, accent: 0.6, dim: 0.4 }],
        ["#contact", { x: 0.4, y: -0.45, scale: 0.75, distort: 0.32, accent: 1, dim: 0.45 }],
        [".footer", onFooterName(0.72)],
    ],
};
// Portrait tablets: the phone path, except that "About" is already on screen at load (the hero is
// shorter than the screen), so its stage starts close by and the blob rests in the free space
// between the badge and the round button.
stages.tablet = [
    [null, { x: 0.3, y: 0.12, scale: 0.5, distort: 0.22, accent: 0, dim: 0.85 }],
    ["#about", { x: 0.3, y: -0.08, scale: 0.55, distort: 0.35, accent: 0.35, dim: 0.4 }],
    ...stages.mobile.slice(2),
];

// Turns a stage into tween values; function stages become function-based values, which GSAP
// re-reads on every ScrollTrigger refresh (invalidateOnRefresh).
const stageValues = (stage) => {
    if (typeof stage !== "function") return stage;
    return Object.fromEntries(Object.keys(stage()).map((key) => [key, () => stage()[key]]));
};

const hasWebGL = () => {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
        return false;
    }
};

// Measures the frame rate for three seconds (after the intro and a one-second warm-up) and
// reports it once. Remounted per quality level, so each level gets its own measurement.
const FrameRateProbe = ({ onMeasured }) => {
    const sample = useRef({ warm: 0, frames: 0, time: 0, done: false });

    useFrame((_, delta) => {
        const probe = sample.current;
        if (probe.done || sceneState.intro < 0.95 || document.hidden) return;
        if (probe.warm < 1) {
            probe.warm += delta;
            return;
        }
        probe.frames += 1;
        probe.time += delta;
        if (probe.time >= 3) {
            probe.done = true;
            onMeasured(probe.frames / probe.time);
        }
    });

    return null;
};

// Quality steps down only when the device clearly struggles: first a lighter scene, and only if
// that is still choppy, a pre-rendered image of the blob. ?lite forces the image, ?full skips the checks.
const initialQuality = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("lite") || !hasWebGL()) return "static";
    return "high";
};

const Scene = () => {
    const isDesktop = useMemo(() => window.matchMedia("(min-width: 1024px)").matches, []);
    const still = useMemo(() => !motionOK(), []);
    const probing = useMemo(() => !new URLSearchParams(window.location.search).has("full"), []);
    const [quality, setQuality] = useState(initialQuality);
    const { lang } = useLanguage();

    const handleFrameRate = useCallback((fps) => {
        if (quality === "high" && fps < 25) setQuality("low");
        else if (quality === "low" && fps < 20) setQuality("static");
    }, [quality]);

    const lite = quality === "low";

    useEffect(() => {
        const handlePointer = (event) => {
            sceneState.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            sceneState.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener("pointermove", handlePointer, { passive: true });
        return () => window.removeEventListener("pointermove", handlePointer);
    }, []);

    // Created after the sections mount, so the pinned Work section is already measured.
    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add({
            desktop: "(min-width: 1024px) and (min-aspect-ratio: 1/1)",
            mobile: "(max-width: 1023px), (max-aspect-ratio: 999/1000)",
            tablet: "(min-width: 768px)",
        }, ({ conditions }) => {
            const list = conditions.desktop ? stages.desktop : conditions.tablet ? stages.tablet : stages.mobile;
            const first = list[0][1];
            gsap.set(sceneState.blob, typeof first === "function" ? first() : first);
            list.slice(1).forEach(([selector, to], index) => {
                const last = index === list.length - 2;
                gsap.fromTo(sceneState.blob, stageValues(list[index][1]), {
                    ...stageValues(to),
                    ease: "none",
                    immediateRender: false,
                    // The footer never reaches the top of the screen, so its stage ends at the bottom of the page.
                    scrollTrigger: { trigger: selector, start: "top bottom", end: last ? "max" : "top 20%", scrub: true, invalidateOnRefresh: true },
                });
            });
            // Keep the hero position in step with the layout when nothing has been scrolled yet.
            const refit = () => window.scrollY < 5 && typeof first === "function" && gsap.set(sceneState.blob, first());
            ScrollTrigger.addEventListener("refresh", refit);

            // Content that loads later (fonts, the form's bot check) changes the page height without
            // a resize; re-measure then, so the stages (the footer one above all) stay on target.
            let timer = 0;
            let lastHeight = document.documentElement.scrollHeight;
            const observer = new ResizeObserver(() => {
                const height = document.documentElement.scrollHeight;
                if (Math.abs(height - lastHeight) < 2) return;
                lastHeight = height;
                clearTimeout(timer);
                timer = setTimeout(() => ScrollTrigger.refresh(), 200);
            });
            observer.observe(document.body);

            return () => {
                ScrollTrigger.removeEventListener("refresh", refit);
                observer.disconnect();
                clearTimeout(timer);
            };
        });
    }, { dependencies: [lang] });

    if (quality === "static") return <StaticBlob />;

    return (
        <div className="scene" aria-hidden="true">
            <Canvas
                dpr={lite ? 1 : [1, isDesktop ? 1.75 : 1.25]}
                camera={{ position: [0, 0, 6], fov: 35 }}
                gl={{ antialias: true, powerPreference: "high-performance" }}
            >
                <Blob detail={lite ? 32 : isDesktop ? 96 : 40} still={still} />
                <Dust count={lite ? 400 : isDesktop ? 1400 : 500} />
                {probing && quality !== "static" && <FrameRateProbe key={quality} onMeasured={handleFrameRate} />}
                {isDesktop && !lite && (
                    <EffectComposer multisampling={0}>
                        <Bloom intensity={0.55} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
                    </EffectComposer>
                )}
            </Canvas>
        </div>
    );
};

export default Scene;
