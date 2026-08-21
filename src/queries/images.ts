import {
  FetchQueryOptions,
  QueryCacheNotifyEvent,
  QueryFunction,
} from "@tanstack/react-query";

import {
  getIsGoogleImage,
  getIsLocalImage,
  getIsScryfallImage,
  Image,
  ImageData,
} from "@/context/ImagesContext";
import { Settings } from "@/context/SettingsContext";
import { addBleedEdge, needsBleedFromFile } from "@/utils/add-bleed";

const MPC_BASE_URL = import.meta.env.DEV
  ? "/cdn-images"
  : "https://cdn.mpcautofill.com/images/google_drive/full";

const getMpcImageUri = (id: string) => {
  return `${MPC_BASE_URL}/${id}.jpg?dpi=1500&jpgQuality=100`;
};

export const getScryfallUris = (uri: string) => {
  const cloudflareOrigins = ["long-wind-b6b3.alex-taxiera.workers.dev"];

  return [
    ...cloudflareOrigins.map((base) => uri.replace("cards.scryfall.io", base)),
    uri,
  ];
};

export const imagesQueryKey = () => ["images"] as const;

export const googleImagesQueryKey = () =>
  [...imagesQueryKey(), "google"] as const;

export const scryfallImagesQueryKey = () =>
  [...imagesQueryKey(), "scryfall"] as const;

export type ScryfallImageQueryKey = ReturnType<typeof scryfallImagesQueryKey>;

export const localImagesQueryKey = () =>
  [...imagesQueryKey(), "local"] as const;

export type LocalImageQueryKey = ReturnType<typeof localImagesQueryKey>;

export const getGoogleImageQueryKey = (uri: string) =>
  [...googleImagesQueryKey(), uri] as const;

export const getScryfallImageQueryKey = (uri: string) =>
  [...scryfallImagesQueryKey(), uri] as const;

export const getLocalImageQueryKey = (hash: string) =>
  [...localImagesQueryKey(), hash] as const;

type BaseImageQueryData = {
  data: Blob;
  mimeType: string;
};

export type GoogleImageQueryData = BaseImageQueryData;

export type ScryfallImageQueryData = BaseImageQueryData & {
  original: Blob;
  upscaledOriginal?: Blob;
  isUpscaled: boolean;
  hasBleed: boolean;
  isProcessing?: boolean;
};

export type LocalImageQueryData = BaseImageQueryData & {
  original: File;
  upscaledOriginal?: Blob;
  isUpscaled: boolean;
  hasBleed: boolean;
  isProcessing?: boolean;
};

export type ImageQueryData =
  | GoogleImageQueryData
  | ScryfallImageQueryData
  | LocalImageQueryData;

const buildGoogleImageQueryFn =
  (uri: string): QueryFunction<GoogleImageQueryData> =>
  async ({ signal }) => {
    const response = await fetch(uri, { signal });
    const data = await response.blob();

    const mimeType = response.headers.get("content-type") || "image/jpeg";

    return { data, mimeType };
  };

const fetchScryfallImage = async (uris: string[], signal?: AbortSignal) => {
  for (const uri of uris) {
    const response = await fetch(uri, { signal });
    if (response.ok) {
      return response;
    }
  }
  throw new Error("Failed to fetch Scryfall image from all provided URIs");
};

const buildScryfallImageQueryFn =
  (uri: string, settings: Settings): QueryFunction<ScryfallImageQueryData> =>
  async ({ signal }) => {
    const response = await fetchScryfallImage(getScryfallUris(uri), signal);

    const blob = await response.blob();
    const mimeType = response.headers.get("content-type") || "image/png";

    const data = await addBleedEdge(
      blob,
      mimeType,
      Number(settings.cardWidth),
      Number(settings.cardHeight),
    );

    return {
      original: blob,
      data,
      mimeType,
      isUpscaled: false,
      hasBleed: true,
    };
  };

const buildLocalImageQueryFn =
  (file: File, settings: Settings): QueryFunction<LocalImageQueryData> =>
  async () => {
    const needsBleedEdge = await needsBleedFromFile(
      file,
      Number(settings.cardWidth),
      Number(settings.cardHeight),
    );
    const data = needsBleedEdge
      ? await addBleedEdge(
          file,
          file.type,
          Number(settings.cardWidth),
          Number(settings.cardHeight),
        )
      : file;
    return {
      original: file,
      data,
      mimeType: file.type,
      isUpscaled: false,
      hasBleed: needsBleedEdge,
    };
  };

const baseQueryOptions: Pick<
  FetchQueryOptions<ImageQueryData>,
  "staleTime" | "gcTime" | "retry"
> = {
  staleTime: "static",
  gcTime: Infinity,
  retry: 3,
};

export const getQueryKeyForImageData = (image: ImageData) => {
  if ("hash" in image) return getLocalImageQueryKey(image.hash);
  if ("id" in image) return getGoogleImageQueryKey(image.id);
  return getScryfallImageQueryKey(image.uri);
};

export const getQueryKeyForImage = (image: Image) => {
  if (getIsLocalImage(image)) {
    return getLocalImageQueryKey(image.hash);
  }
  if (getIsGoogleImage(image)) {
    return getGoogleImageQueryKey(image.id);
  }
  if (getIsScryfallImage(image)) {
    return getScryfallImageQueryKey(image.uri);
  }
  throw new Error("Invalid image type");
};

export const getQueryDataForImage = (
  image: Image,
  settings: Settings,
): FetchQueryOptions<ImageQueryData> => {
  if (getIsLocalImage(image)) {
    return {
      queryKey: getLocalImageQueryKey(image.hash),
      queryFn: buildLocalImageQueryFn(image.file, settings),
      ...baseQueryOptions,
    };
  }

  if (getIsGoogleImage(image)) {
    return {
      queryKey: getGoogleImageQueryKey(image.id),
      queryFn: buildGoogleImageQueryFn(getMpcImageUri(image.id)),
      ...baseQueryOptions,
    };
  }

  if (getIsScryfallImage(image)) {
    return {
      queryKey: getScryfallImageQueryKey(image.uri),
      queryFn: buildScryfallImageQueryFn(image.uri, settings),
      ...baseQueryOptions,
    };
  }

  throw new Error("Invalid image type");
};

export const getIsDownloadableImageCacheEvent = (
  event: QueryCacheNotifyEvent,
) => {
  const isImageQuery =
    event.query &&
    // Check if the query key starts with the imagesQueryKey
    Array.isArray(event.query.queryKey) &&
    event.query.queryKey.length > 0 &&
    event.query.queryKey.join(",").startsWith(`${imagesQueryKey().join(",")},`);

  // Exclude local image queries from progress tracking
  const isLocalImageQuery =
    event.query &&
    Array.isArray(event.query.queryKey) &&
    event.query.queryKey.length > 0 &&
    event.query.queryKey
      .join(",")
      .startsWith(`${localImagesQueryKey().join(",")},`);

  return (
    isImageQuery &&
    !isLocalImageQuery &&
    (event.type === "updated" ||
      event.type === "added" ||
      event.type === "removed")
  );
};
