import { createContext } from "react";

export type GoogleImageData = {
  id: string;
  name: string;
};

export type LocalImageData = {
  file: File;
};

export type ScryfallImageData = {
  uri: string;
  name: string;
};

export type EmptyImageData = {
  name: "empty";
};

export type ImageData = GoogleImageData | LocalImageData | ScryfallImageData;

export type BaseImage = {
  uuid: string;
};

export type Image = BaseImage & ImageData;

export type PossiblyEmptyImage = BaseImage & (ImageData | EmptyImageData);

export type DownloadableImage = {
  uuid: string;
} & (GoogleImageData | ScryfallImageData);

export const getIsLocalImage = (image: PossiblyEmptyImage) => {
  return "file" in image;
};

export const getIsDownloadableImage = (image: PossiblyEmptyImage) => {
  return "id" in image || "uri" in image;
};

export const getIsGoogleImage = (image: PossiblyEmptyImage) => {
  return "id" in image;
};

export const getIsScryfallImage = (image: PossiblyEmptyImage) => {
  return "uri" in image;
};

export const getIsEmptyImage = (
  image: PossiblyEmptyImage,
): image is BaseImage & EmptyImageData => {
  return "name" in image && image.name === "empty";
};

export const getIsImage = (image: PossiblyEmptyImage): image is Image => {
  return !getIsEmptyImage(image);
};

export type ImagesContextValue = {
  images: Image[];
  imagesWithError: DownloadableImage[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  onReorder: (images: Image[], newIndex: number) => void;
  onAdd: (
    files: (File | GoogleImageData | ScryfallImageData)[],
    index?: number,
  ) => void;
  onError: (image: DownloadableImage) => void;
  onRemove: (uuid: string) => void;
  onClear: (uuids?: string[]) => void;
  onClearErrors: () => void;
};

export const ImagesContext = createContext<ImagesContextValue>({
  images: [],
  imagesWithError: [],
  isRendering: false,
  setIsRendering: () => {},
  onReorder: () => {},
  onAdd: () => {},
  onError: () => {},
  onRemove: () => {},
  onClear: () => {},
  onClearErrors: () => {},
});
