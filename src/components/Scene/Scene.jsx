import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import { blobFragment, blobVertex } from "./shaders.js";
import { sceneState } from "../../lib/sceneState.js";
import { gsap, useGSAP, motionOK } from "../../lib/motion.js";
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
        uAccentColor: { value: new THREE.Color("#4d7cff") },
    }), []);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.05);
        const { blob, pointer, velocity, intro, takeover } = sceneState;
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

// A small blob that grows out of the navbar logo on hover: it swells from a point at the icon's
// centre, ripples hard and settles into a breathing halo, then gets drawn back in on leave.
const LogoBlob = ({ detail }) => {
    const mesh = useRef(null);
    const viewport = useThree((state) => state.viewport);
    const size = useThree((state) => state.size);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uDistort: { value: 0.2 },
        uFrequency: { value: 1.6 },
        uAccent: { value: 0.75 },
        uFlood: { value: 0 },
        uAccentColor: { value: new THREE.Color("#4d7cff") },
    }), []);

    useFrame((_, rawDelta) => {
        const delta = Math.min(rawDelta, 0.05);
        const { logo } = sceneState;
        const target = mesh.current;
        target.visible = logo.grow > 0.002;
        if (!target.visible) return;

        uniforms.uTime.value += delta * (0.7 + logo.wobble * 2.5);
        uniforms.uDistort.value = 0.16 + logo.wobble * 0.38;

        // CSS pixels to world units at the blob's depth.
        const unit = viewport.width / size.width;
        target.position.set((logo.x - size.width / 2) * unit, (size.height / 2 - logo.y) * unit, 0);
        target.scale.setScalar(Math.max(logo.size * 0.95 * unit * logo.grow, 0.0001));
        target.rotation.y += delta * 0.25;
    });

    return (
        <mesh ref={mesh} visible={false}>
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

// Where the blob sits for each section, in fractions of the half-viewport.
const stages = {
    desktop: [
        [null, { x: 0.5, y: -0.02, scale: 1, distort: 0.22, accent: 0 }],
        ["#about", { x: 0.62, y: -0.4, scale: 0.7, distort: 0.38, accent: 0.35 }],
        ["#work", { x: 0.72, y: 0.58, scale: 0.32, distort: 0.18, accent: 1 }],
        ["#services", { x: -0.66, y: -0.1, scale: 0.8, distort: 0.45, accent: 0.2 }],
        ["#experience", { x: 0.74, y: -0.45, scale: 0.45, distort: 0.3, accent: 0.6 }],
        ["#contact", { x: 0.55, y: 0.05, scale: 1, distort: 0.32, accent: 1 }],
        [".footer", { x: 0, y: -0.45, scale: 0.75, distort: 0.28, accent: 0.5 }],
    ],
    mobile: [
        [null, { x: 0.25, y: 0.35, scale: 0.85, distort: 0.22, accent: 0 }],
        ["#about", { x: 0.45, y: -0.5, scale: 0.6, distort: 0.35, accent: 0.35 }],
        ["#work", { x: 0.55, y: 0.6, scale: 0.35, distort: 0.18, accent: 1 }],
        ["#services", { x: -0.5, y: -0.45, scale: 0.6, distort: 0.4, accent: 0.2 }],
        ["#experience", { x: 0.5, y: 0.55, scale: 0.45, distort: 0.3, accent: 0.6 }],
        ["#contact", { x: 0.35, y: -0.45, scale: 0.75, distort: 0.32, accent: 1 }],
        [".footer", { x: 0, y: -0.5, scale: 0.6, distort: 0.28, accent: 0.5 }],
    ],
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
        mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, ({ conditions }) => {
            const list = conditions.desktop ? stages.desktop : stages.mobile;
            gsap.set(sceneState.blob, list[0][1]);
            list.slice(1).forEach(([selector, to], index) => {
                gsap.fromTo(sceneState.blob, { ...list[index][1] }, {
                    ...to,
                    ease: "none",
                    immediateRender: false,
                    scrollTrigger: { trigger: selector, start: "top bottom", end: "top 20%", scrub: true },
                });
            });
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
                {!still && <LogoBlob detail={lite ? 24 : 48} />}
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
