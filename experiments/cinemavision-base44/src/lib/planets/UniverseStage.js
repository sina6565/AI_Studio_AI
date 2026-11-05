import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createStars } from "@/lib/planets/stars";
import { createGoldenCore } from "@/lib/planets/goldenCore";
import { createWorldPlanet } from "@/lib/planets/worldPlanet";
import { createDust } from "@/lib/planets/dust";
import { WORLD_KEYS, worldAnchor, PLANET_RADIUS } from "@/lib/planets/worldRegistry";
import { SUN_DIR } from "@/lib/planets/worldSurface";
import { settingsFor, detectQuality } from "@/lib/planets/quality";
import { buildOrbitStops, sampleOrbit } from "@/lib/planets/orbitPath";

export { detectQuality };

const FOV = 42;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export default class UniverseStage {
  constructor(canvas, { quality = "high", reduced = false } = {}) {
    this.settings = settingsFor(quality);
    this.reduced = reduced;
    this.progress = 0;
    this.target = 0;
    this.initialised = false;
    this.pointer = { x: 0, y: 0 };
    this.sections = [];
    this.camPos = new THREE.Vector3();
    this.camTarget = new THREE.Vector3();

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
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.0032);

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 900);

    this.scene.add(new THREE.AmbientLight(0x2b3a52, 0.95));
    const sun = new THREE.DirectionalLight(0xfff0d6, 2.7);
    sun.position.copy(SUN_DIR).multiplyScalar(150);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x7f9ad0, 0.5);
    fill.position.set(-90, -50, -110);
    this.scene.add(fill);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envMap;

    this.stars = createStars(this.settings.starTier);
    this.scene.add(this.stars);

    this.core = createGoldenCore({
      quality: this.settings.detail,
      env: this.envMap,
      bodyRadius: 9.5,
      ringInner: 11,
      ringOuter: 17,
    });
    this.core.setSplit(0);
    this.scene.add(this.core.group);

    this.dust = createDust({ quality: this.settings.detail, radius: 40 });
    this.scene.add(this.dust.points);

    this.planets = WORLD_KEYS.map((key, index) => {
      const planet = createWorldPlanet(key, { radius: PLANET_RADIUS, quality: this.settings.detail });
      const anchor = worldAnchor(index);
      planet.group.position.set(anchor.x, anchor.y, anchor.z);
      this.scene.add(planet.group);
      return planet;
    });

    this.buildPath();
    this.resize();
  }

  buildPath() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    this.portrait = aspect < 0.95;
    const path = buildOrbitStops(aspect);
    this.stops = path.stops;
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.settings.dpr);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();

    this.buildPath();
  }

  setSections(sections) {
    this.sections = sections.filter((section) => Number.isFinite(section.y));
    this.updateScroll();
    if (!this.initialised) {
      this.progress = this.target;
      this.initialised = true;
    }
  }

  updateScroll() {
    if (!this.sections.length) return;
    const y = window.scrollY;
    const list = this.sections;

    if (y <= list[0].y) {
      this.target = list[0].stop;
      return;
    }

    for (let i = 0; i < list.length - 1; i += 1) {
      const from = list[i];
      const to = list[i + 1];
      if (to.y > from.y && y >= from.y && y <= to.y) {
        const k = (y - from.y) / (to.y - from.y);
        this.target = from.stop + (to.stop - from.stop) * k;
        return;
      }
    }

    this.target = list[list.length - 1].stop;
  }

  setPointer(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  update(dt) {
    if (document.hidden) return;
    const motion = this.reduced ? 0.35 : 1;

    this.progress += (this.target - this.progress) * Math.min(1, dt * 3.2);

    sampleOrbit(this.stops, this.progress, this.camPos, this.camTarget);

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);

    const distance = this.camera.position.distanceTo(this.camTarget);
    const halfWidth = TAN * distance * this.camera.aspect;
    const halfHeight = TAN * distance;

    if (this.portrait) {
      this.camera.translateY(-halfHeight * 0.2);
    } else {
      this.camera.translateX(halfWidth * 0.3);
    }

    if (!this.reduced) {
      this.camera.rotateY(-this.pointer.x * 0.03);
      this.camera.rotateX(-this.pointer.y * 0.022);
    }

    this.core.update(dt * motion);
    this.dust.update(dt * motion);
    this.planets.forEach((planet) => planet.update(dt * motion));
    this.stars.rotation.y += dt * 0.0035 * motion;

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