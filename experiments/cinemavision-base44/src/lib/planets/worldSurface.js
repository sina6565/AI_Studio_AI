import * as THREE from "three";

// One shared daylight direction so every planet in the universe is lit from the same star.
export const SUN_DIR = new THREE.Vector3(0.62, 0.34, 0.71).normalize();

const NOISE = `
float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}

float fbm(vec3 p) {
  float total = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    total += amp * vnoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return total;
}
`;

const SURFACE_VERT = `
varying vec3 vN;
varying vec3 vP;
varying vec3 vV;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vP = worldPosition.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const SURFACE_FRAG = `
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uRim;
uniform float uSeed;
uniform float uScale;
uniform int uStyle;
varying vec3 vN;
varying vec3 vP;
varying vec3 vV;
${NOISE}

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 dir = normalize(vP);
  vec3 q = dir * uScale + uSeed;
  float f = fbm(q);

  vec3 col = uA;
  float emis = 0.0;
  float gloss = 0.35;

  if (uStyle == 0) {
    float plate = fbm(q * 1.7);
    float seam = smoothstep(0.05, 0.0, abs(plate - 0.52));
    col = mix(uA, uB * 0.6, smoothstep(0.40, 0.62, plate));
    col = mix(col, uC, smoothstep(0.64, 0.80, plate) * 0.4);
    emis += seam * 1.5;
    gloss = 0.95;
  } else if (uStyle == 1) {
    float web = fbm(q * 3.4);
    float filament = smoothstep(0.56, 0.64, web) - smoothstep(0.70, 0.79, web);
    float lat = smoothstep(0.965, 1.0, abs(sin(dir.y * 32.0)));
    col = mix(uA, uB * 0.45, f);
    col = mix(col, uB, filament * 0.85 + lat * 0.55);
    emis = filament * 1.7 + lat * 0.8;
    gloss = 0.5;
  } else if (uStyle == 2) {
    float ang = atan(dir.z, dir.x);
    float bands = sin(dir.y * 12.0 + ang * 1.8 + f * 3.2);
    col = mix(uA, uB, 0.5 + 0.5 * bands);
    col = mix(col, uC, smoothstep(0.55, 0.95, f) * 0.6);
    float storm = smoothstep(0.62, 0.99, 1.0 - length(vec2(ang * 0.20, (dir.y - 0.1) * 2.6)));
    col = mix(col, uC, storm * 0.8);
    emis = storm * 0.45;
    gloss = 0.25;
  } else if (uStyle == 3) {
    float wave = sin(dir.y * 21.0 + f * 6.5 - uTime * 1.15);
    float rings = 0.5 + 0.5 * wave;
    col = mix(uA, uB, rings);
    emis = smoothstep(0.70, 1.0, rings) * 1.4;
    gloss = 0.2;
  } else if (uStyle == 4) {
    float marble = fbm(q * 1.25);
    col = mix(uA, uB, smoothstep(0.32, 0.78, marble));
    col = mix(col, uC, smoothstep(0.72, 0.92, f) * 0.5);
    float glint = smoothstep(0.88, 0.99, fbm(q * 8.0));
    emis = glint * 1.6;
    gloss = 0.55;
  } else if (uStyle == 5) {
    vec3 cell = fract(dir * 6.0);
    vec3 edgeDistance = min(cell, 1.0 - cell);
    float edge = smoothstep(0.055, 0.0, min(min(edgeDistance.x, edgeDistance.y), edgeDistance.z));
    col = mix(uA, uB, hash13(floor(dir * 6.0)));
    col = mix(col, uC, edge * 0.35);
    emis = edge * 1.6;
    gloss = 0.8;
  } else {
    float band = sin(dir.y * 16.0 + f * 2.8);
    col = mix(uA, uB, 0.5 + 0.5 * band);
    col = mix(col, uC, smoothstep(0.58, 0.95, f) * 0.65);
    gloss = 0.3;
  }

  float ndl = dot(N, normalize(uSun));
  float lit = smoothstep(-0.28, 0.55, ndl);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.8);
  float spec = pow(max(ndl, 0.0), 26.0) * gloss;

  vec3 outColor = col * (0.045 + lit * 1.28);
  outColor += uB * spec * 0.85;
  outColor += uC * emis * (0.22 + 0.78 * (1.0 - lit));
  outColor += uRim * rim * (0.22 + 0.95 * lit);
  gl_FragColor = vec4(outColor, 1.0);
}
`;

const RIM_VERT = `
varying vec3 vN;
varying vec3 vV;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - worldPosition.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const RIM_FRAG = `
uniform vec3 uSun;
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vV;

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  float lit = smoothstep(-0.45, 0.85, dot(N, normalize(uSun)));
  gl_FragColor = vec4(uColor * fresnel * (0.12 + 1.5 * lit), fresnel * 0.9);
}
`;

export function createSurfaceMaterial(def, { doubleSide = false, scale = 2.6 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSun: { value: SUN_DIR },
      uA: { value: new THREE.Color(def.a) },
      uB: { value: new THREE.Color(def.b) },
      uC: { value: new THREE.Color(def.c) },
      uRim: { value: new THREE.Color(def.rim) },
      uSeed: { value: def.seed ?? 0 },
      uScale: { value: scale },
      uStyle: { value: def.style ?? 0 },
    },
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
}

export function createRimMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: SUN_DIR },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: RIM_VERT,
    fragmentShader: RIM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}