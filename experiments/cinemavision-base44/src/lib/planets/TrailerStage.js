import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createStars } from "@/lib/planets/stars";
import { createGoldenCore } from "@/lib/planets/goldenCore";
import { createWorldPlanet } from "@/lib/planets/worldPlanet";
import { createDust } from "@/lib/planets/dust";
import { WORLD_KEYS } from "@/lib/planets/worldRegistry";
import { SUN_DIR } from "@/lib/planets/worldSurface";
import { settingsFor } from "@/lib/planets/quality";
import { sampleTrailer } from "@/lib/planets/trailer";

const HEIGHTS = [3.2, -2.4, 2.6, -3.0, 2.8, -2.0];

export default class TrailerStage {
  constructor(canvas, { quality = "high" } = {}) {
    this.settings = settingsFor(quality);
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.settings.antialias,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x04060c, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.0035);

    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 900);

    this.scene.add(new THREE.AmbientLight(0x2b3a52, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
    sun.position.copy(SUN_DIR).multiplyScalar(120);
    this.scene.add(sun);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envMap;

    this.stars = createStars(this.settings.starTier);
    this.scene.add(this.stars);

    this.dust = createDust({ quality: this.settings.detail, radius: 24, count: 820 });
    this.scene.add(this.dust.points);

    this.core = createGoldenCore({
      quality: this.settings.detail,
      env: this.envMap,
      bodyRadius: 5.2,
      ringInner: 6.4,
      ringOuter: 10.4,
    });
    this.core.setSplit(0, 0);
    this.scene.add(this.core.group);

    this.planets = WORLD_KEYS.map((key, index) => {
      const planet = createWorldPlanet(key, { radius: 4.2, quality: this.settings.detail });
      planet.group.visible = false;
      this.scene.add(planet.group);
      return planet;
    });

    this.birthTargets = WORLD_KEYS.map(
      (key, index) =>
        new THREE.Vector3((index - 2.5) * 7, HEIGHTS[index], -6 - (index % 3) * 2.6)
    );

    this.zoom = 1;
    this.resize();
  }

  resize() {
    const width = this.canvas.clientWidth || 640;
    const height = this.canvas.clientHeight || 360;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.dpr);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    const aspect = width / Math.max(1, height);
    this.zoom = aspect < 1 ? 1.5 : aspect < 1.3 ? 1.22 : 1;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setTime(time) {
    const frame = sampleTrailer(time);

    this.camera.position.set(frame.pos[0], frame.pos[1], frame.pos[2]);
    this.camera.lookAt(frame.target[0], frame.target[1], frame.target[2]);

    const fov = frame.fov * this.zoom;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.toneMappingExposure = frame.exposure;
    this.core.setSplit(frame.split, frame.coreGlow);
    this.core.update(Math.min(0.05, 0.016));
    this.dust.material.opacity = 0.25 + 0.6 * frame.dust;
    this.dust.points.rotation.y = time * 0.03;
    this.stars.rotation.y = time * 0.006;

    this.planets.forEach((planet, index) => {
      const local = THREE.MathUtils.clamp(frame.birth * 6.6 - index * 0.92, 0, 1);
      const eased = 1 - Math.pow(1 - local, 3);
      const target = this.birthTargets[index];

      planet.group.visible = local > 0.001;
      planet.group.scale.setScalar(0.05 + eased * 0.95);
      planet.group.position.set(target.x * eased, target.y * eased, target.z * eased);
      planet.setTime(time + index);
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.core.dispose();
    this.dust.dispose();
    this.planets.forEach((planet) => planet.dispose());
    this.scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((item) => item?.dispose?.());
      else object.material?.dispose?.();
    });
    this.envMap?.dispose?.();
    this.renderer.dispose();
  }
}