const fract = (value) => value - Math.floor(value);

function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 144665);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function wrap(index, period) {
  if (!period) return index;
  return ((index % period) + period) % period;
}

export function valueNoise(x, y, periodX = 0, periodY = 0, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const x0 = wrap(xi, periodX);
  const x1 = wrap(xi + 1, periodX);
  const y0 = wrap(yi, periodY);
  const y1 = wrap(yi + 1, periodY);

  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);

  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return top + (bottom - top) * v;
}

export function fbm(x, y, options = {}) {
  const {
    octaves = 4,
    lacunarity = 2,
    gain = 0.5,
    periodX = 0,
    periodY = 0,
    seed = 0,
  } = options;

  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i += 1) {
    sum +=
      valueNoise(
        x * frequency,
        y * frequency,
        periodX ? periodX * frequency : 0,
        periodY ? periodY * frequency : 0,
        seed + i * 17
      ) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return sum / norm;
}

export { fract };