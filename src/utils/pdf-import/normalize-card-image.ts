// Pixel work for PDF card import: turn an image drawn on a PDF page into a
// card image with exactly the bleed the rest of the app expects.
//
// Padding follows FleemProxyCompanion's `_edge_kinds` / `_pad_smart` (MIT):
// each side that has to grow is either a solid border (continued with its
// median colour) or artwork (mirrored outward).
import { createFileHash } from "@/utils/create-file-hash";

import {
  computeCardCrop,
  type Box,
  type Sides,
  type Size,
} from "./card-geometry";

/** PDF matrix [a, b, c, d, e, f]. */
export type Matrix = [number, number, number, number, number, number];

/** pdf.js-style multiply: the result applies `m2` first, then `m1`. */
export const multiply = (m1: Matrix, m2: Matrix): Matrix => [
  m1[0] * m2[0] + m1[2] * m2[1],
  m1[1] * m2[0] + m1[3] * m2[1],
  m1[0] * m2[2] + m1[2] * m2[3],
  m1[1] * m2[2] + m1[3] * m2[3],
  m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
  m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
];

export const boundsOf = (
  m: Matrix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Box => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [x, y] of [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ]) {
    xs.push(m[0] * x + m[2] * y + m[4]);
    ys.push(m[1] * x + m[3] * y + m[5]);
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) - minX,
    h: Math.max(...ys) - minY,
  };
};

/** True when the matrix only scales, flips or turns by multiples of 90°. */
export const isAxisAligned = (m: Matrix): boolean => {
  const scale = Math.max(
    Math.abs(m[0]),
    Math.abs(m[1]),
    Math.abs(m[2]),
    Math.abs(m[3]),
  );
  const eps = scale * 1e-3;
  return (
    (Math.abs(m[1]) < eps && Math.abs(m[2]) < eps) ||
    (Math.abs(m[0]) < eps && Math.abs(m[3]) < eps)
  );
};

export type SourceImage = {
  drawable: CanvasImageSource;
  width: number;
  height: number;
};

/**
 * Geometry of one image paint: `toPage` maps the image's unit square to page
 * points (top-left origin), as pdf.js draws it.
 */
export type ImageDraw = {
  toPage: Matrix;
  box: Box;
};

/**
 * Where an image lands when turned upright on the page: its pixel size in that
 * orientation and the transform from source pixels to upright pixels.
 */
const uprightTransform = (
  draw: ImageDraw,
  source: SourceImage,
): { size: Size; matrix: Matrix } => {
  // Source pixel (x, y) → unit square (x/W, 1 - y/H) → page.
  const pixelToPage = multiply(draw.toPage, [
    1 / source.width,
    0,
    0,
    -1 / source.height,
    0,
    1,
  ]);
  const swapped = Math.abs(pixelToPage[0]) < Math.abs(pixelToPage[1]);
  const size = swapped
    ? { w: source.height, h: source.width }
    : { w: source.width, h: source.height };
  const sx = size.w / draw.box.w;
  const sy = size.h / draw.box.h;
  const pageToUpright: Matrix = [
    sx,
    0,
    0,
    sy,
    -draw.box.x * sx,
    -draw.box.y * sy,
  ];
  return { size, matrix: multiply(pageToUpright, pixelToPage) };
};

const MAX_DPI = 1200;
const JPEG_QUALITY = 0.95;

type Rgb = [number, number, number];

const medianOf = (values: number[]) => {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
};

/**
 * Median colour of a strip and whether it's a solid border: at least 88% of
 * its pixels within RGB distance 45 of the median.
 */
const stripKind = (
  data: Uint8ClampedArray,
): { color: Rgb; solid: boolean } | null => {
  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    r.push(data[i]);
    g.push(data[i + 1]);
    b.push(data[i + 2]);
  }
  if (r.length === 0) return null;
  const color: Rgb = [medianOf([...r]), medianOf([...g]), medianOf([...b])];
  let close = 0;
  for (let i = 0; i < r.length; i++) {
    const dr = r[i] - color[0];
    const dg = g[i] - color[1];
    const db = b[i] - color[2];
    if (dr * dr + dg * dg + db * db <= 45 * 45) close++;
  }
  return { color, solid: close / r.length >= 0.88 };
};

type Side = keyof Sides;

/** Read the outer strip of `inner` on one side, skipping the corner eighths. */
const readStrip = (
  ctx: OffscreenCanvasRenderingContext2D,
  inner: Box,
  side: Side,
): Uint8ClampedArray | null => {
  const k = Math.max(2, Math.round(0.004 * inner.w));
  const skipX = Math.floor(inner.w / 8);
  const skipY = Math.floor(inner.h / 8);
  const rect =
    side === "l"
      ? { x: inner.x, y: inner.y + skipY, w: k, h: inner.h - 2 * skipY }
      : side === "r"
        ? {
            x: inner.x + inner.w - k,
            y: inner.y + skipY,
            w: k,
            h: inner.h - 2 * skipY,
          }
        : side === "t"
          ? { x: inner.x + skipX, y: inner.y, w: inner.w - 2 * skipX, h: k }
          : {
              x: inner.x + skipX,
              y: inner.y + inner.h - k,
              w: inner.w - 2 * skipX,
              h: k,
            };
  if (rect.w <= 0 || rect.h <= 0) return null;
  return ctx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
};

const rgb = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

/** Fill the area around `inner` (the image's own pixels) out to the canvas. */
const padOutward = (
  canvas: OffscreenCanvas,
  ctx: OffscreenCanvasRenderingContext2D,
  inner: Box,
) => {
  const pad = {
    l: inner.x,
    t: inner.y,
    r: canvas.width - (inner.x + inner.w),
    b: canvas.height - (inner.y + inner.h),
  };
  if (Math.max(pad.l, pad.t, pad.r, pad.b) <= 0) return;

  const kinds = Object.fromEntries(
    (["l", "r", "t", "b"] as const).map((side) => {
      const strip = pad[side] > 0 ? readStrip(ctx, inner, side) : null;
      return [side, strip ? stripKind(strip) : null];
    }),
  ) as Record<Side, ReturnType<typeof stripKind>>;

  // Mirror left/right across the image's rows, then top/bottom across the
  // full (already widened) width so corners are mirrored twice.
  if (pad.l > 0) {
    const w = Math.min(pad.l, inner.w);
    ctx.save();
    ctx.translate(inner.x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      canvas,
      inner.x,
      inner.y,
      w,
      inner.h,
      0,
      inner.y,
      pad.l,
      inner.h,
    );
    ctx.restore();
  }
  if (pad.r > 0) {
    const right = inner.x + inner.w;
    const w = Math.min(pad.r, inner.w);
    ctx.save();
    ctx.translate(right, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      canvas,
      right - w,
      inner.y,
      w,
      inner.h,
      -pad.r,
      inner.y,
      pad.r,
      inner.h,
    );
    ctx.restore();
  }
  if (pad.t > 0) {
    const h = Math.min(pad.t, inner.h);
    ctx.save();
    ctx.translate(0, inner.y);
    ctx.scale(1, -1);
    ctx.drawImage(
      canvas,
      0,
      inner.y,
      canvas.width,
      h,
      0,
      0,
      canvas.width,
      pad.t,
    );
    ctx.restore();
  }
  if (pad.b > 0) {
    const bottom = inner.y + inner.h;
    const h = Math.min(pad.b, inner.h);
    ctx.save();
    ctx.translate(0, bottom);
    ctx.scale(1, -1);
    ctx.drawImage(
      canvas,
      0,
      bottom - h,
      canvas.width,
      h,
      0,
      -pad.b,
      canvas.width,
      pad.b,
    );
    ctx.restore();
  }

  // Solid borders continue as flat colour.
  const fills: Record<Side, [number, number, number, number]> = {
    l: [0, 0, pad.l, canvas.height],
    r: [inner.x + inner.w, 0, pad.r, canvas.height],
    t: [0, 0, canvas.width, pad.t],
    b: [0, inner.y + inner.h, canvas.width, pad.b],
  };
  for (const side of ["l", "r", "t", "b"] as const) {
    const kind = kinds[side];
    if (pad[side] > 0 && kind?.solid) {
      ctx.fillStyle = rgb(kind.color);
      ctx.fillRect(...fills[side]);
    }
  }
};

/** Back any transparency with the image's border colour (not white). */
const flattenAlpha = (ctx: OffscreenCanvasRenderingContext2D, inner: Box) => {
  const strips = (["l", "r", "t", "b"] as const)
    .map((side) => readStrip(ctx, inner, side))
    .filter((s): s is Uint8ClampedArray => s !== null);
  const merged = new Uint8ClampedArray(
    strips.reduce((sum, s) => sum + s.length, 0),
  );
  let offset = 0;
  for (const strip of strips) {
    merged.set(strip, offset);
    offset += strip.length;
  }
  const kind = stripKind(merged);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = kind ? rgb(kind.color) : "#fff";
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  ctx.restore();
};

/**
 * The canvas is laid out as the image appears on the page. When the PDF draws
 * the image turned (a card placed sideways, a /Rotate page, a back flipped
 * 180° for short-edge duplex), turn it back so the image's own top is up.
 */
const turnToNativeUp = (
  canvas: OffscreenCanvas,
  source: SourceImage,
  draw: ImageDraw,
): OffscreenCanvas => {
  const pixelToPage = multiply(draw.toPage, [
    1 / source.width,
    0,
    0,
    -1 / source.height,
    0,
    1,
  ]);
  // Where the source's "up" (pixel -y) points on the page (y grows down).
  const upX = -pixelToPage[2];
  const upY = -pixelToPage[3];
  const quarterTurns =
    Math.abs(upY) >= Math.abs(upX)
      ? upY < 0
        ? 0
        : 2
      : upX > 0
        ? 3 // up points right: turn a quarter counter-clockwise
        : 1; // up points left: turn a quarter clockwise
  if (quarterTurns === 0) return canvas;

  const swap = quarterTurns % 2 === 1;
  const turned = new OffscreenCanvas(
    swap ? canvas.height : canvas.width,
    swap ? canvas.width : canvas.height,
  );
  const ctx = turned.getContext("2d");
  if (!ctx) throw new Error("Couldn't create a 2D canvas");
  ctx.translate(turned.width / 2, turned.height / 2);
  ctx.rotate((quarterTurns * Math.PI) / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return turned;
};

const encode = async (canvas: OffscreenCanvas, name: string) => {
  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const file = new File([blob], name, { type: "image/jpeg" });
  const hash = await createFileHash(file);
  return { file, hash };
};

export type NormalizeTarget =
  | {
      kind: "crop";
      center: { x: number; y: number };
      cardPt: Size;
      bleedPt: number;
    }
  | { kind: "asIs" };

/**
 * Produce the card image for one image paint. With a crop target the result
 * is exactly card + `bleedPt` (bleedPt 0 yields the bare card), and anything
 * outside the image's own pixels is generated. `asIs` just turns the image
 * upright. Output is capped at 1200 dpi.
 */
export const normalizeCardImage = async (
  source: SourceImage,
  draw: ImageDraw,
  target: NormalizeTarget,
  name: string,
): Promise<{ file: File; hash: string }> => {
  const upright = uprightTransform(draw, source);

  // Pixels per point in the upright image, for the DPI cap.
  const pxPerPt = upright.size.w / draw.box.w;
  const scale = Math.min(1, MAX_DPI / 72 / pxPerPt);

  const crop: Box =
    target.kind === "crop"
      ? computeCardCrop({
          imageBox: draw.box,
          imagePx: upright.size,
          center: target.center,
          cardPt: target.cardPt,
          bleedPt: target.bleedPt,
        }).crop
      : { x: 0, y: 0, w: upright.size.w, h: upright.size.h };

  const width = Math.max(1, Math.round(crop.w * scale));
  const height = Math.max(1, Math.round(crop.h * scale));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Couldn't create a 2D canvas");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const toOutput = multiply(
    [scale, 0, 0, scale, -crop.x * scale, -crop.y * scale],
    upright.matrix,
  );
  ctx.setTransform(...toOutput);
  ctx.drawImage(source.drawable, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // The part of the output covered by the image's own pixels.
  const x0 = Math.max(0, Math.round(-crop.x * scale));
  const y0 = Math.max(0, Math.round(-crop.y * scale));
  const x1 = Math.min(width, Math.round((upright.size.w - crop.x) * scale));
  const y1 = Math.min(height, Math.round((upright.size.h - crop.y) * scale));
  const inner = {
    x: x0,
    y: y0,
    w: Math.max(1, x1 - x0),
    h: Math.max(1, y1 - y0),
  };

  flattenAlpha(ctx, inner);
  padOutward(canvas, ctx, inner);

  return encode(turnToNativeUp(canvas, source, draw), name);
};

/**
 * Decode a pdf.js image object into something drawable. pdf.js hands back
 * either an ImageBitmap or raw pixels with a `kind`.
 */
export const toSourceImage = (imgData: {
  width: number;
  height: number;
  bitmap?: ImageBitmap;
  data?: Uint8Array | Uint8ClampedArray;
  kind?: number;
}): SourceImage => {
  const { width, height } = imgData;
  if (imgData.bitmap) {
    return { drawable: imgData.bitmap, width, height };
  }
  if (!imgData.data) throw new Error("Image has no pixel data");

  const rgba = new Uint8ClampedArray(width * height * 4);
  const src = imgData.data;
  if (imgData.kind === 3) {
    rgba.set(src.subarray(0, rgba.length));
  } else if (imgData.kind === 2) {
    for (let i = 0, j = 0; j < rgba.length; i += 3, j += 4) {
      rgba[j] = src[i];
      rgba[j + 1] = src[i + 1];
      rgba[j + 2] = src[i + 2];
      rgba[j + 3] = 255;
    }
  } else {
    // 1 bit per pixel, rows padded to whole bytes; set bits are white.
    const rowBytes = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (src[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0;
        const j = (y * width + x) * 4;
        rgba[j] = rgba[j + 1] = rgba[j + 2] = v;
        rgba[j + 3] = 255;
      }
    }
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't create a 2D canvas");
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  return { drawable: canvas, width, height };
};
