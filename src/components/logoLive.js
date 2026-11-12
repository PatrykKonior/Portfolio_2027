import * as THREE from "three";
import { blobFragment, blobVertex } from "./Scene/shaders.js";

// The navbar logo's blob, alive: the site's blob shader drawn into a tiny canvas inside the icon.
// Loaded on the first hover so three.js stays out of the main bundle. It only renders while
// the pointer is on the logo, plus the short fade back to the still image.
export const createLogoLive = (canvas) => {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // One unit = the icon's width, centred on it.
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 20);
    camera.position.z = 6;
    const scene = new THREE.Scene();

    const uniforms = {
        uTime: { value: Math.random() * 10 },
        uDistort: { value: 0 },
        uFrequency: { value: 1.4 },
        uAccent: { value: 0.35 },
        uFlood: { value: 0 },
        uAccentColor: { value: new THREE.Color("#4d7cff") },
    };
    const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 40),
        new THREE.ShaderMaterial({ vertexShader: blobVertex, fragmentShader: blobFragment, uniforms }),
    );
    // Where the blob sits in the favicon artwork.
    const home = { x: 0.1, y: 0.04 };
    mesh.position.set(home.x, home.y, 0);
    mesh.scale.setScalar(0.46);
    scene.add(mesh);

    const pointer = { x: 0, y: 0 };
    let active = false;
    let life = 0;
    let frame = 0;
    let last = 0;

    const tick = (now) => {
        const delta = Math.min((now - (last || now)) / 1000, 0.05);
        last = now;
        // Eases in over ~1 s and out over ~0.6 s, so the shape settles back before it hides.
        life += ((active ? 1 : 0) - life) * Math.min(delta * (active ? 2.2 : 3.5), 1);

        uniforms.uTime.value += delta * 0.35;
        uniforms.uDistort.value = 0.26 * life;
        mesh.rotation.y += delta * 0.15;
        // A light drift toward the pointer.
        mesh.position.x += (home.x + pointer.x * 0.06 * life - mesh.position.x) * Math.min(delta * 4, 1);
        mesh.position.y += (home.y - pointer.y * 0.06 * life - mesh.position.y) * Math.min(delta * 4, 1);
        renderer.render(scene, camera);

        if (active || life > 0.01) frame = requestAnimationFrame(tick);
        else frame = 0;
    };

    return {
        setActive(next) {
            active = next;
            if (!frame) {
                last = 0;
                frame = requestAnimationFrame(tick);
            }
        },
        setPointer(x, y) {
            pointer.x = x;
            pointer.y = y;
        },
        dispose() {
            cancelAnimationFrame(frame);
            mesh.geometry.dispose();
            mesh.material.dispose();
            renderer.dispose();
        },
    };
};
