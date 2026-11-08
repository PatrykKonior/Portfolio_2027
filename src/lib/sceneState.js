// Mutable state shared between the DOM (GSAP, Lenis, pointer) and the WebGL scene.
// Written outside React on purpose: it changes every frame and must not trigger renders.
export const sceneState = {
    pointer: { x: 0, y: 0 },
    velocity: 0,
    intro: 0,
    // 0 → 1 while the blob swells to fill the screen during a language switch.
    takeover: 0,
    blob: { x: 0.45, y: 0, scale: 1, distort: 0.3, accent: 0 },
};
