import { ImageData } from "@/context/ImagesContext";

/**
 * Stable, content-derived id used to dedupe images inside a bundle — the
 * same card referenced from many slots/projects is written to the zip once.
 */
export const bundleImageId = (image: ImageData): string => {
  if ("id" in image) return `google:${image.id}`;
  if ("uri" in image) return `scryfall:${image.uri}`;
  return `local:${image.hash}`;
};
