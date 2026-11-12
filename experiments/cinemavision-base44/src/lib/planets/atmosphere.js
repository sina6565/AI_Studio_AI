import * as THREE from "three";

export function createAtmosphereMaterial({ color = 0x5fb7ff, intensity = 1, power = 3.2, sunDir = [-0.7, 0.36, 0.6] } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uSunDir: { value: new THREE.Vector3(...sunDir).normalize() },
    },
    vertexShader: `
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vViewDirW = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uPower;
      uniform vec3 uSunDir;
      varying vec3 vNormalW;
      varying vec3 vViewDirW;
      void main() {
        float rim = pow(1.0 - clamp(dot(vNormalW, vViewDirW), 0.0, 1.0), uPower);
        float sun = clamp(dot(vNormalW, uSunDir), 0.0, 1.0);
        float glow = rim * (0.12 + sun * 1.35);
        gl_FragColor = vec4(uColor * glow * uIntensity, glow * uIntensity * 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}