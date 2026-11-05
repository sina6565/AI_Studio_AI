import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createStars } from "@/lib/planets/stars";
import { createEarth } from "@/lib/planets/earth";
import { createMars } from "@/lib/planets/mars";
import { createSaturn } from "@/lib/planets/saturn";
import { sampleCameraPath } from "@/lib/planets/cameraPath";

const SETTINGS = {
  high: { dpr: 2, antialias: true, starTier: "high", composer: true, shadow: 1024 },
  mid: { dpr: 1.75, antialias: false, starTier: "mid", composer: false, shadow: 512 },
  low: { dpr: 1.4, antialias: false, starTier: "low", composer: false, shadow: 512 },
};

export function detectQuality() {
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;

  if (width < 768) return cores >= 6 && dpr <= 2.5 ? "mid" : "low";
  if (width < 1180) return cores >= 6 ? "high" : "mid";
  return cores >= 8 ? "high" : "mid";
}

export default class PlanetStage {
  constructor(canvas, { quality = "high", reduced = false } = {}) {
    this.canvas = canvas;
    this.quality = SETTINGS[quality] ? quality : "high";
    this.settings = SETTINGS[this.quality];
    this.reduced = reduced;
    this.progress = 0;
    this.target = 0;
    this.focus = 4;
    this.pointer = { x: 0, y: 0 };
    this.frameScale = 1;
    this.sample = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 };
    this.direction = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.settings.antialias,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x04060c, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.021);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.08, 420);
    this.camera.position.set(0.35, 0.25, 3.6);

    this.scene.add(new THREE.AmbientLight(0x2b3c58, 0.75));

    const sun = new THREE.DirectionalLight(0xfff2e0, 3.2);
    sun.position.set(-9, 5, 8);
    sun.target.position.set(1.4, 1.25, -18.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.settings.shadow, this.settings.shadow);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);
    this.scene.add(sun.target);

    const fill = new THREE.DirectionalLight(0x6f9bd8, 0.5);
    fill.position.set(7, -4, -9);
    this.scene.add(fill);

    this.stars = createStars(this.settings.starTier);
    this.scene.add(this.stars);

    this.earth = createEarth({ quality: this.quality });
    this.earth.group.position.set(-3.0, 0.35, 0);
    this.scene.add(this.earth.group);

    this.mars = createMars({ quality: this.quality });
    this.mars.group.position.set(3.4, -2.0, -6.5);
    this.scene.add(this.mars.group);

    this.saturn = createSaturn({ quality: this.quality });
    this.saturn.group.position.set(1.4, 1.25, -18.5);
    this.scene.add(this.saturn.group);

    if (this.settings.composer) {
      try {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bokeh = new BokehPass(this.scene, this.camera, {
          focus: 4,
          aperture: 0.00016,
          maxblur: 0.006,
        });
        this.composer.addPass(this.bokeh);
        this.composer.addPass(new OutputPass());
      } catch (error) {
        console.warn("Depth of field pass unavailable", error);
        this.composer = null;
      }
    }

    this.resize();
    this.setScroll();
    this.progress = this.target;
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.dpr);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const aspect = width / height;
    this.frameScale = aspect >= 1.5 ? 1 : aspect >= 1 ? 1.12 : 1.34;

    if (this.composer) {
      this.composer.setPixelRatio?.(pixelRatio);
      this.composer.setSize(width, height);
    }
  }

  setScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  setPointer(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  update(dt) {
    if (document.hidden) return;
    const motion = this.reduced ? 0.4 : 1;

    this.progress += (this.target - this.progress) * Math.min(1, dt * 2.6);
    const frame = sampleCameraPath(this.progress, this.sample);

    const direction = this.direction;
    direction.subVectors(frame.position, frame.target);
    const distance = direction.length() * this.frameScale;

    this.camera.position.copy(frame.position);
    if (this.frameScale !== 1) {
      direction.normalize();
      this.camera.position.copy(frame.target).addScaledVector(direction, distance);
    }

    if (!this.reduced) {
      this.camera.position.x += this.pointer.x * 0.16;
      this.camera.position.y -= this.pointer.y * 0.1;
    }

    this.camera.lookAt(frame.target);

    if (Math.abs(this.camera.fov - frame.fov) > 0.01) {
      this.camera.fov = frame.fov;
      this.camera.updateProjectionMatrix();
    }

    this.earth.update(dt * motion);
    this.mars.update(dt * motion);
    this.saturn.update(dt * motion);
    this.stars.rotation.y += dt * 0.005 * motion;

    if (this.composer) {
      const focusDistance = this.camera.position.distanceTo(frame.target);
      this.focus += (focusDistance - this.focus) * Math.min(1, dt * 3);
      if (this.bokeh?.uniforms?.focus) this.bokeh.uniforms.focus.value = this.focus;
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    const disposeMaterial = (material) => {
      if (!material) return;
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) value.dispose();
      });
      material.dispose?.();
    };

    this.earth.dispose();
    this.scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
      else disposeMaterial(object.material);
    });

    this.composer?.dispose?.();
    this.renderer.dispose();
  }
}