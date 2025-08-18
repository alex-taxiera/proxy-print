import { createContext } from "react";

export type GoogleImageData = {
  id: string;
  name: string;
  mimeType?: string;
  url?: string;
};

export type LocalImageData = {
  file: File;
};

export type ScryfallImageData = {
  uri: string;
  name: string;
  mimeType?: "image/png";
  url?: string;
};

export type Image = {
  uuid: string;
} & (GoogleImageData | LocalImageData | ScryfallImageData);

export type DownloadableImage = {
  uuid: string;
} & (GoogleImageData | ScryfallImageData);

export const getIsLocalImage = (image: Image) => {
  return "file" in image;
};

export const getIsDownloadableImage = (image: Image) => {
  return "id" in image || "uri" in image;
};

export const getIsGoogleImage = (image: Image) => {
  return "id" in image;
};

export const getIsScryfallImage = (image: Image) => {
  return "uri" in image;
};

export type ImagesContextValue = {
  isFetching: boolean;
  images: Image[];
  imagesWithError: DownloadableImage[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  onReorder: (imageUuid: string, newIndex: number) => void;
  getCachedImage: (id: string) => string | undefined;
  onAdd: (
    files: (File | GoogleImageData | ScryfallImageData)[],
    index?: number,
  ) => void;
  onRemove: (uuid: string) => void;
  onClear: () => void;
  onClearErrors: () => void;
};

export const ImagesContext = createContext<ImagesContextValue>({
  isFetching: false,
  images: [],
  imagesWithError: [],
  isRendering: false,
  setIsRendering: () => {},
  onReorder: () => {},
  getCachedImage: () => undefined,
  onAdd: () => {},
  onRemove: () => {},
  onClear: () => {},
  onClearErrors: () => {},
});
