import { addBleedEdge, BLEED_MM, calculateDpi, needsBleed } from "./add-bleed";
import { darkenEdgePixels, getEdgeBandPx } from "./darken-edges";

/**
 * Darkens the border of an image that is not getting generated bleed. Images
 * that are getting it are darkened inside `addBleedEdge` instead, so the bleed
 * is built from the darkened border.
 */
export async function darkenEdges(
  src: Blob,
  mimeType: string,
  targetWidthMm: number,
  targetHeightMm: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(src);
  const { width, height } = bitmap;

  // An image that already includes bleed has its border further in, so
  // the band is measured from the cut line rather than the image edge.
  const includesBleed = !needsBleed(
    width,
    height,
    targetWidthMm,
    targetHeightMm,
  );
  const insetMm = includesBleed ? BLEED_MM : 0;
  const dpi = calculateDpi(
    width,
    height,
    targetWidthMm + insetMm * 2,
    targetHeightMm + insetMm * 2,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  darkenEdgePixels(
    imageData.data,
    width,
    height,
    getEdgeBandPx(dpi / 25.4, insetMm),
  );
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? src), mimeType);
  });
}

export type CardImageTransforms = {
  hasBleed: boolean;
  hasDarkenedEdges?: boolean;
};

/**
 * Builds the image a card displays and prints from its original (or upscaled
 * original), applying whichever of generated bleed and edge darkening are on.
 */
export function renderCardImage(
  base: Blob,
  mimeType: string,
  targetWidthMm: number,
  targetHeightMm: number,
  { hasBleed, hasDarkenedEdges = false }: CardImageTransforms,
): Promise<Blob> {
  if (hasBleed) {
    return addBleedEdge(base, mimeType, targetWidthMm, targetHeightMm, {
      darkenEdges: hasDarkenedEdges,
    });
  }

  if (hasDarkenedEdges) {
    return darkenEdges(base, mimeType, targetWidthMm, targetHeightMm);
  }

  return Promise.resolve(base);
}
