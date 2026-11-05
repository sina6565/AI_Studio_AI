import { fbm } from "@/lib/planets/noise";

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function clamp255(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

function drawCrater(ctx, cx, cy, radius, mode) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  if (mode === "bump") {
    gradient.addColorStop(0, "rgba(0,0,0,0.55)");
    gradient.addColorStop(0.7, "rgba(0,0,0,0.32)");
    gradient.addColorStop(0.86, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
  } else {
    gradient.addColorStop(0, "rgba(46,18,10,0.38)");
    gradient.addColorStop(0.72, "rgba(58,24,14,0.18)");
    gradient.addColorStop(0.88, "rgba(232,176,124,0.32)");
    gradient.addColorStop(1, "rgba(200,140,96,0)");
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

export function createMarsTextures(size = 1024) {
  const width = size;
  const height = Math.round(size / 2);
  const albedo = makeCanvas(width, height);
  const bump = makeCanvas(width, height);
  const albedoCtx = albedo.getContext("2d");
  const bumpCtx = bump.getContext("2d");
  const albedoData = albedoCtx.createImageData(width, height);
  const bumpData = bumpCtx.createImageData(width, height);

  const period = 6;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const lat = Math.abs(v * 2 - 1);

    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const terrain = fbm(u * period, v * period, { octaves: 5, periodX: period, seed: 5 });
      const dust = fbm(u * period * 2 + 4, v * period * 2 + 9, {
        octaves: 3,
        periodX: period * 2,
        seed: 19,
      });

      const height01 = terrain * 0.7 + dust * 0.3;
      const relief = Math.min(1, Math.max(0, (height01 - 0.32) * 1.9));
      const grain = (dust - 0.5) * 34;

      let r = 118 + relief * 96 + grain;
      let g = 56 + relief * 66 + grain * 0.8;
      let b = 34 + relief * 36 + grain * 0.6;

      const cap = Math.max(0, lat - 0.87) / 0.13;
      const capMix = Math.min(1, cap * 1.9) * (0.5 + dust * 0.5);
      r += (234 - r) * capMix;
      g += (240 - g) * capMix;
      b += (244 - b) * capMix;

      const index = (y * width + x) * 4;
      albedoData.data[index] = clamp255(r);
      albedoData.data[index + 1] = clamp255(g);
      albedoData.data[index + 2] = clamp255(b);
      albedoData.data[index + 3] = 255;

      const bumpValue = clamp255(height01 * 255);
      bumpData.data[index] = bumpValue;
      bumpData.data[index + 1] = bumpValue;
      bumpData.data[index + 2] = bumpValue;
      bumpData.data[index + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const craterCount = Math.round(size / 5);
  for (let i = 0; i < craterCount; i += 1) {
    const cx = Math.random() * width;
    const cy = height * 0.1 + Math.random() * height * 0.8;
    const radius = 3 + Math.pow(Math.random(), 2.8) * size * 0.05;
    drawCrater(albedoCtx, cx, cy, radius, "albedo");
    drawCrater(bumpCtx, cx, cy, radius, "bump");
  }

  return { albedo, bump };
}

export function createSaturnTexture(size = 1024) {
  const width = size;
  const height = Math.round(size / 2);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const data = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const warp = fbm(u * 3, v * 7, { octaves: 3, periodX: 3, seed: 5 }) - 0.5;
      const bands = 0.5 + 0.5 * Math.sin((v * 34 + warp * 3.2) * Math.PI);
      const fine = fbm(u * 4, v * 46, { octaves: 3, periodX: 4, seed: 9 });
      const t = bands * 0.55 + fine * 0.45;

      let r = 186 + t * 62;
      let g = 160 + t * 60;
      let b = 118 + t * 56;

      const belt = Math.pow(Math.abs(Math.sin(v * Math.PI * 6.1)), 3) * 0.4;
      r -= belt * 46;
      g -= belt * 48;
      b -= belt * 42;

      const pole = Math.max(0, Math.abs(v * 2 - 1) - 0.9) / 0.1;
      r -= pole * 26;
      g -= pole * 30;
      b -= pole * 24;

      const index = (y * width + x) * 4;
      data.data[index] = clamp255(r);
      data.data[index + 1] = clamp255(g);
      data.data[index + 2] = clamp255(b);
      data.data[index + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function createRingTexture(width = 1024) {
  const height = 8;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const data = ctx.createImageData(width, height);

  for (let x = 0; x < width; x += 1) {
    const t = x / (width - 1);
    const coarse = fbm(t * 24, 1.7, { octaves: 4, periodX: 24, seed: 3 });
    const fine = fbm(t * 110, 4.2, { octaves: 3, periodX: 110, seed: 7 });

    let alpha = 0.22 + coarse * 0.72 + fine * 0.22;

    const cassini = 1 - Math.exp(-Math.pow((t - 0.615) / 0.021, 2));
    const innerFade = Math.min(1, t / 0.075);
    const outerFade = Math.min(1, (1 - t) / 0.06);
    alpha *= cassini * Math.pow(innerFade, 0.65) * Math.pow(outerFade, 0.9);
    alpha *= 0.6 + 0.4 * Math.abs(Math.sin(t * 46 + coarse * 7));

    const warm = 0.72 + fine * 0.42;
    const r = clamp255(216 * warm);
    const g = clamp255(198 * warm);
    const b = clamp255(168 * warm);
    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);

    for (let y = 0; y < height; y += 1) {
      const index = (y * width + x) * 4;
      data.data[index] = r;
      data.data[index + 1] = g;
      data.data[index + 2] = b;
      data.data[index + 3] = a;
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function createEarthFallback(size = 1024) {
  const width = size;
  const height = Math.round(size / 2);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const data = ctx.createImageData(width, height);
  const period = 5;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const lat = Math.abs(v * 2 - 1);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const terrain = fbm(u * period, v * period, { octaves: 5, periodX: period, seed: 23 });
      const detail = fbm(u * period * 3, v * period * 3, { octaves: 3, periodX: period * 3, seed: 31 });
      const land = terrain + detail * 0.14 > 0.53;

      let r;
      let g;
      let b;
      if (land) {
        const h = Math.min(1, Math.max(0, (terrain - 0.53) * 4));
        r = 74 + h * 96;
        g = 96 + h * 58;
        b = 58 + h * 40;
      } else {
        const depth = Math.min(1, Math.max(0, (0.53 - terrain) * 3));
        r = 10 + depth * 8;
        g = 40 + depth * 40;
        b = 82 + depth * 62;
      }

      const ice = Math.max(0, lat - 0.9) / 0.1;
      r += (236 - r) * ice;
      g += (242 - g) * ice;
      b += (248 - b) * ice;

      const index = (y * width + x) * 4;
      data.data[index] = clamp255(r);
      data.data[index + 1] = clamp255(g);
      data.data[index + 2] = clamp255(b);
      data.data[index + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}