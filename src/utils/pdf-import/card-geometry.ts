// Pure geometry for locating a card inside an image drawn on a PDF page and
// working out the crop that yields exactly "card + target bleed".
//
// All page-space values are PDF points (1/72 in) with a top-left origin.
// Image-space values are pixels of the image after it has been turned upright
// to match the page (see `normalize-card-image.ts`), so they map linearly onto
// `imageBox`.
//
// The thresholds come from FleemProxyCompanion's `read_foreign` (MIT), which
// solved the same problem with pypdf.

export const PT_PER_MM = 72 / 25.4;

/** A visible card may be this much smaller than the configured card size. */
export const CARD_TOLERANCE_PT = 1.6;
/** Largest visible bleed (per side) still treated as a card. */
export const MAX_VISIBLE_BLEED_PT = 4.5 * PT_PER_MM;
/** Below this much available bleed the image is treated as a bare card. */
export const BARE_CARD_BLEED_PT = 0.5 * PT_PER_MM;

export type Box = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };
export type Sides = { l: number; t: number; r: number; b: number };

export const intersectBoxes = (a: Box, b: Box | null): Box => {
  if (!b) return a;
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
};

export type CardMeasurement =
  | {
      kind: "card";
      /** Card centre on the page. */
      center: { x: number; y: number };
      /** Bleed visible on the page (after clipping), per side, average. */
      visibleBleedPt: number;
      /** Smallest bleed the image itself carries on any side (clip ignored). */
      availableBleedPt: number;
    }
  | {
      kind: "mismatch";
      center: { x: number; y: number };
      visibleSize: Size;
    }
  | { kind: "ignore" };

/**
 * Decide whether an image drawn at `imageBox` (clipped by `clip`) is a card of
 * `cardPt` size, and how much bleed it shows and carries.
 */
export const measureCard = (
  imageBox: Box,
  clip: Box | null,
  cardPt: Size,
): CardMeasurement => {
  const visible = intersectBoxes(imageBox, clip);
  if (visible.w <= 0 || visible.h <= 0) return { kind: "ignore" };

  const center = { x: visible.x + visible.w / 2, y: visible.y + visible.h / 2 };
  const bx = (visible.w - cardPt.w) / 2;
  const by = (visible.h - cardPt.h) / 2;

  const isCard =
    bx >= -CARD_TOLERANCE_PT &&
    by >= -CARD_TOLERANCE_PT &&
    bx <= MAX_VISIBLE_BLEED_PT &&
    by <= MAX_VISIBLE_BLEED_PT &&
    Math.abs(bx - by) <= CARD_TOLERANCE_PT;

  if (!isCard) {
    if (visible.w * visible.h < (cardPt.w * cardPt.h) / 4) {
      return { kind: "ignore" };
    }
    return {
      kind: "mismatch",
      center,
      visibleSize: { w: visible.w, h: visible.h },
    };
  }

  const cardLeft = center.x - cardPt.w / 2;
  const cardTop = center.y - cardPt.h / 2;
  const availableBleedPt = Math.max(
    0,
    Math.min(
      cardLeft - imageBox.x,
      cardTop - imageBox.y,
      imageBox.x + imageBox.w - (cardLeft + cardPt.w),
      imageBox.y + imageBox.h - (cardTop + cardPt.h),
    ),
  );

  return {
    kind: "card",
    center,
    visibleBleedPt: Math.max(0, (bx + by) / 2),
    availableBleedPt,
  };
};

export type CardCrop = {
  /** Crop rectangle in image pixels; may extend past the image's edges. */
  crop: Box;
  /** How far (px) the crop runs past each image edge: bleed to generate. */
  pad: Sides;
};

/**
 * The crop (in upright image pixels) of the rectangle `center ± (card/2 +
 * bleedPt)` on the page. The image's own pixels are used wherever they exist,
 * including bleed hidden by a clip; `pad` is non-zero only where the image
 * truly runs out.
 */
export const computeCardCrop = ({
  imageBox,
  imagePx,
  center,
  cardPt,
  bleedPt,
}: {
  imageBox: Box;
  imagePx: Size;
  center: { x: number; y: number };
  cardPt: Size;
  bleedPt: number;
}): CardCrop => {
  const sx = imagePx.w / imageBox.w;
  const sy = imagePx.h / imageBox.h;

  const tx0 = center.x - cardPt.w / 2 - bleedPt;
  const ty0 = center.y - cardPt.h / 2 - bleedPt;
  const tw = cardPt.w + 2 * bleedPt;
  const th = cardPt.h + 2 * bleedPt;

  const crop = {
    x: (tx0 - imageBox.x) * sx,
    y: (ty0 - imageBox.y) * sy,
    w: tw * sx,
    h: th * sy,
  };

  return {
    crop,
    pad: {
      l: Math.max(0, -crop.x),
      t: Math.max(0, -crop.y),
      r: Math.max(0, crop.x + crop.w - imagePx.w),
      b: Math.max(0, crop.y + crop.h - imagePx.h),
    },
  };
};

/** Median of a list of numbers (0 for an empty list). */
export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
