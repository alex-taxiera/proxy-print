/** Max RGB channel value still treated as "black". */
export const NEAR_BLACK_THRESHOLD = 30;

export type EdgeBand = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * How far in from each cut edge the darkening reaches, in mm. Sized for a
 * standard black card border, with a deeper bottom to cover the collector line.
 */
const EDGE_BAND_MM: EdgeBand = {
  top: 2,
  bottom: 8.5,
  left: 1,
  right: 1,
};

/**
 * Converts the darkening band to pixels.
 *
 * @param mmToPixels - Pixels per mm of the image being darkened
 * @param insetMm - Distance from the image edge to the cut line, for images
 * that already include bleed. The band grows to cover it.
 */
export function getEdgeBandPx(mmToPixels: number, insetMm = 0): EdgeBand {
  const toPx = (mm: number) => Math.round((mm + insetMm) * mmToPixels);

  return {
    top: toPx(EDGE_BAND_MM.top),
    bottom: toPx(EDGE_BAND_MM.bottom),
    left: toPx(EDGE_BAND_MM.left),
    right: toPx(EDGE_BAND_MM.right),
  };
}

/**
 * Flattens near-black pixels inside the band to pure black, in place. Only
 * pixels that are already dark change, so artwork and text are left alone.
 *
 * @param data - RGBA pixel data, as found on `ImageData`
 */
export function darkenEdgePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  band: EdgeBand,
  threshold = NEAR_BLACK_THRESHOLD,
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inBand =
        y < band.top ||
        y >= height - band.bottom ||
        x < band.left ||
        x >= width - band.right;

      if (!inBand) continue;

      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (r < threshold && g < threshold && b < threshold) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }
}
