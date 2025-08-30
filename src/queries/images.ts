import { FetchQueryOptions, QueryFunction } from "@tanstack/react-query";

import { DownloadableImage, getIsGoogleImage } from "~/context/ImagesContext";
import { addBleedEdge } from "~/utils/add-bleed";

const getMpcImageUri = (id: string) => {
  return `https://script.google.com/macros/s/AKfycbw8laScKBfxda2Wb0g63gkYDBdy8NWNxINoC4xDOwnCQ3JMFdruam1MdmNmN4wI5k4/exec?id=${id}`;
};

/**
 * Converts a Base64 string to a Blob.
 * @param base64String - The Base64 string of the image.
 * @param contentType - The MIME type of the image (e.g., "image/jpeg", "image/png").
 * @returns The resulting Blob object.
 */
function base64ToBlob(base64String: string, contentType: string): Blob {
  // Decode the Base64 string
  const byteCharacters = atob(base64String);

  // Convert the decoded string into an array of bytes
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  // Create a Uint8Array from the byte numbers
  const byteArray = new Uint8Array(byteNumbers);

  // Create and return the Blob
  return new Blob([byteArray], { type: contentType });
}

export const imagesQueryKey = () => ["images"] as const;

export const googleImagesQueryKey = () =>
  [...imagesQueryKey(), "google"] as const;

export const scryfallImagesQueryKey = () =>
  [...imagesQueryKey(), "scryfall"] as const;

export const getGoogleImageQueryKey = (uri: string) =>
  [...googleImagesQueryKey(), uri] as const;

export const getScryfallImageQueryKey = (uri: string) =>
  [...scryfallImagesQueryKey(), uri] as const;

export type ImageQueryData = {
  data: Blob;
  mimeType: string;
  url: string;
};

const buildGoogleImageQueryFn =
  (uri: string): QueryFunction<ImageQueryData> =>
  async ({ signal }) => {
    const response = await fetch(uri, { signal });
    const text = await response.text();

    let mimeType = "image/png";

    // Check for JPEG signature (base64 starts with /9j/ for JFIF)
    if (text.startsWith("/9j/")) {
      mimeType = "image/jpeg";
    }
    // Check for WebP signature (UklGRiI)
    else if (text.startsWith("UklGRiI")) {
      mimeType = "image/webp";
    }
    const data = base64ToBlob(text, mimeType);

    const url = URL.createObjectURL(data);

    return { data, mimeType, url };
  };

const buildScryfallImageQueryFn =
  (uri: string): QueryFunction<ImageQueryData> =>
  async ({ signal }) => {
    const response = await fetch(uri, { signal });

    const blob = await response.blob();
    const mimeType = response.headers.get("content-type") || "image/png";

    const data = await addBleedEdge(blob, mimeType);

    const url = URL.createObjectURL(data);

    return { data, mimeType, url };
  };

export const getQueryDataForImage = (
  image: DownloadableImage,
): FetchQueryOptions<ImageQueryData> => {
  const isGoogleImage = getIsGoogleImage(image);
  const uri = isGoogleImage ? getMpcImageUri(image.id) : image.uri;

  const queryKey = isGoogleImage
    ? getGoogleImageQueryKey(uri)
    : getScryfallImageQueryKey(uri);
  const queryFn = isGoogleImage
    ? buildGoogleImageQueryFn(uri)
    : buildScryfallImageQueryFn(uri);

  return { queryKey, queryFn, staleTime: Infinity, retry: 3 };
};
