// Mutable state shared between the DOM (GSAP, Lenis, pointer) and the WebGL scene.
// Written outside React on purpose: it changes every frame and must not trigger renders.
export const sceneState = {
    pointer: { x: 0, y: 0 },
    velocity: 0,
    intro: 0,
    // 0 → 1 while the blob swells to fill the screen during a language switch.
    takeover: 0,
    // Navbar logo hover: active 0 → 1 pulls the blob behind the logo; x/y/size in CSS pixels.
    logo: { active: 0, x: 0, y: 0, size: 0 },
    blob: { x: 0.45, y: 0, scale: 1, distort: 0.3, accent: 0 },
};
