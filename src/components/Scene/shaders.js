// Ashima Arts 3D simplex noise (MIT).
const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uDistort;
uniform float uFrequency;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;

${noise}

float displacement(vec3 direction) {
    float base = snoise(direction * uFrequency + vec3(uTime * 0.55));
    float detail = snoise(direction * uFrequency * 2.2 - vec3(uTime * 0.35)) * 0.18;
    return (base + detail) * uDistort;
}

vec3 orthogonal(vec3 v) {
    return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

void main() {
    float radius = length(position);
    vec3 direction = normalize(position);

    // Displace two neighbours as well so the normal follows the deformed surface.
    vec3 tangent = orthogonal(direction);
    vec3 bitangent = normalize(cross(direction, tangent));
    vec3 neighbourA = normalize(direction + tangent * 0.01);
    vec3 neighbourB = normalize(direction + bitangent * 0.01);

    float d = displacement(direction);
    vec3 displaced = direction * (radius + d);
    vec3 displacedA = neighbourA * (radius + displacement(neighbourA));
    vec3 displacedB = neighbourB * (radius + displacement(neighbourB));

    vDisplacement = d;
    vNormal = normalize(normalMatrix * cross(displacedA - displaced, displacedB - displaced));

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const blobFragment = /* glsl */ `
uniform float uTime;
uniform float uAccent;
uniform float uFlood;
uniform vec3 uAccentColor;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplacement;

vec3 palette(float t) {
    // Cosine palette tuned to violet / cyan / magenta iridescence.
    return vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(1.0, 0.9, 0.8) * t + vec3(0.78, 0.52, 0.28)));
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vViewPosition);

    float facing = max(dot(normal, viewDirection), 0.0);
    float fresnel = pow(1.0 - facing, 2.2);

    vec3 lightDirection = normalize(vec3(0.5, 0.9, 0.6));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 48.0);

    vec3 iridescent = palette(vDisplacement * 1.4 + fresnel * 0.7 + uTime * 0.04);
    vec3 core = vec3(0.025, 0.022, 0.04);

    vec3 color = mix(core, iridescent, clamp(fresnel * 1.1 + diffuse * 0.18, 0.0, 1.0));
    color = mix(color, uAccentColor, smoothstep(0.55, 1.0, fresnel) * uAccent * 0.85);
    // While the blob fills the screen, let the iridescence wash over the whole surface.
    color = mix(color, iridescent * (0.55 + 0.45 * diffuse), uFlood * 0.75);
    color += specular * 0.55;

    gl_FragColor = vec4(color, 1.0);
}
`;
