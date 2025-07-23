import { createContext } from "react";

export type GoogleImageData = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string
}

export type Image = {
  uuid: string;
  file?: File;
} & GoogleImageData;

export type ImagesContextValue = {
  isFetching: boolean;
  images: Image[];
  imagesWithError: Image[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  downloadImage: (id: string) => Promise<void>;
  getCachedImage: (id: string) => string | undefined;
  onAdd: (files: (File | GoogleImageData)[], index?: number) => void;
  onRemove: (uuid: string) => void;
  onClear: () => void;
  onError: (uuid: string) => void;
  onClearErrors: () => void;
  onLocalImageLoaded: (uuid: string) => void;
  isLoadingLocalImages: boolean;
  loadedLocalImageCount: number;
  totalLocalImageCount: number;
}

export const ImagesContext = createContext<ImagesContextValue>({
  isFetching: false,
  images: [],
  imagesWithError: [],
  isRendering: false,
  setIsRendering: () => {},
  downloadImage: () => Promise.resolve(),
  getCachedImage: () => undefined,
  onAdd: () => {},
  onRemove: () => {},
  onClear: () => {},
  onError: () => {},
  onClearErrors: () => {},
  onLocalImageLoaded: () => {},
  isLoadingLocalImages: false,
  loadedLocalImageCount: 0,
  totalLocalImageCount: 0,
});
