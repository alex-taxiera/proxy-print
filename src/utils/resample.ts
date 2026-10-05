export type ResampleKernel = "bicubic" | "lanczos";

type Kernel = {
  /** Support radius in source pixels; each sample reads 2 * radius taps. */
  radius: number;
  weight: (x: number) => number;
};

/** Keys cubic convolution kernel with a = -0.5 (Catmull-Rom). */
const cubic = (x: number) => {
  const a = -0.5;
  const t = Math.abs(x);
  if (t <= 1) {
    return (a + 2) * t * t * t - (a + 3) * t * t + 1;
  }
  if (t < 2) {
    return a * t * t * t - 5 * a * t * t + 8 * a * t - 4 * a;
  }
  return 0;
};

const sinc = (x: number) => {
  if (x === 0) {
    return 1;
  }
  const px = Math.PI * x;
  return Math.sin(px) / px;
};

/** Lanczos-3: a sinc windowed by a wider sinc, zero beyond 3 pixels. */
const lanczos3 = (x: number) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0);

const KERNELS: Record<ResampleKernel, Kernel> = {
  bicubic: { radius: 2, weight: cubic },
  lanczos: { radius: 3, weight: lanczos3 },
};

type Taps = {
  /** Number of taps per output sample. */
  count: number;
  /** Source index of each tap per output sample, edge-clamped. */
  index: Int32Array;
  weight: Float32Array;
};

const buildTaps = (srcSize: number, factor: number, kernel: Kernel): Taps => {
  const dstSize = srcSize * factor;
  const count = kernel.radius * 2;
  const index = new Int32Array(dstSize * count);
  const weight = new Float32Array(dstSize * count);

  for (let d = 0; d < dstSize; d++) {
    // Map output pixel centers onto source pixel centers.
    const center = (d + 0.5) / factor - 0.5;
    const first = Math.floor(center) - kernel.radius + 1;
    let sum = 0;
    for (let k = 0; k < count; k++) {
      const s = first + k;
      const w = kernel.weight(center - s);
      index[d * count + k] = Math.min(srcSize - 1, Math.max(0, s));
      weight[d * count + k] = w;
      sum += w;
    }
    for (let k = 0; k < count; k++) {
      weight[d * count + k] /= sum;
    }
  }

  return { count, index, weight };
};

/**
 * Upscale RGBA pixels by an integer factor using a separable resampling
 * kernel. Colors are filtered premultiplied by alpha so transparent pixels
 * (e.g. rounded card corners) don't bleed dark fringes into the edge.
 */
export const resampleUpscale = (
  src: Uint8ClampedArray,
  width: number,
  height: number,
  factor: number,
  kernelName: ResampleKernel,
): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } => {
  const kernel = KERNELS[kernelName];
  const dstWidth = width * factor;
  const dstHeight = height * factor;

  const premultiplied = new Float32Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const alpha = src[i * 4 + 3] / 255;
    premultiplied[i * 4] = src[i * 4] * alpha;
    premultiplied[i * 4 + 1] = src[i * 4 + 1] * alpha;
    premultiplied[i * 4 + 2] = src[i * 4 + 2] * alpha;
    premultiplied[i * 4 + 3] = src[i * 4 + 3];
  }

  // Horizontal pass: width -> dstWidth, height rows.
  const xTaps = buildTaps(width, factor, kernel);
  const horizontal = new Float32Array(dstWidth * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = y * width;
    const dstRow = y * dstWidth;
    for (let x = 0; x < dstWidth; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < xTaps.count; k++) {
        const w = xTaps.weight[x * xTaps.count + k];
        const s = (srcRow + xTaps.index[x * xTaps.count + k]) * 4;
        r += premultiplied[s] * w;
        g += premultiplied[s + 1] * w;
        b += premultiplied[s + 2] * w;
        a += premultiplied[s + 3] * w;
      }
      const d = (dstRow + x) * 4;
      horizontal[d] = r;
      horizontal[d + 1] = g;
      horizontal[d + 2] = b;
      horizontal[d + 3] = a;
    }
  }

  // Vertical pass: height -> dstHeight, then un-premultiply.
  const yTaps = buildTaps(height, factor, kernel);
  const out = new Uint8ClampedArray(dstWidth * dstHeight * 4);
  for (let y = 0; y < dstHeight; y++) {
    const dstRow = y * dstWidth;
    for (let x = 0; x < dstWidth; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < yTaps.count; k++) {
        const w = yTaps.weight[y * yTaps.count + k];
        const s = (yTaps.index[y * yTaps.count + k] * dstWidth + x) * 4;
        r += horizontal[s] * w;
        g += horizontal[s + 1] * w;
        b += horizontal[s + 2] * w;
        a += horizontal[s + 3] * w;
      }
      const d = (dstRow + x) * 4;
      const alpha = Math.min(255, Math.max(0, a));
      if (alpha > 0) {
        const scale = 255 / alpha;
        // Uint8ClampedArray rounds and clamps to 0-255 on assignment, which
        // also absorbs the overshoot from the kernels' negative lobes.
        out[d] = r * scale;
        out[d + 1] = g * scale;
        out[d + 2] = b * scale;
      }
      out[d + 3] = alpha;
    }
  }

  return { data: out, width: dstWidth, height: dstHeight };
};

/** Whether any pixel in RGBA data is not fully opaque. */
export const hasTransparency = (data: Uint8ClampedArray) => {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  return false;
};
