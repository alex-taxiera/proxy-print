import { createContext } from "react";
import { ImageDownloadManager } from "./ImageDownloadManager";

export type GoogleImageData = {
  id?: string;
  name?: string
}

export type Image = {
  uuid: string;
  file?: File;
} & GoogleImageData;

export type ImagesContextValue = {
  images: Image[];
  imagesWithError: Image[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  downloadManager: ImageDownloadManager;
  getDownloadedImage: (id: string) => string | undefined;
  onAdd: (files: (File | GoogleImageData)[], index?: number) => void;
  onRemove: (uuid: string) => void;
  onClear: () => void;
  onError: (uuid: string) => void;
  onClearErrors: () => void;
}

export const ImagesContext = createContext<ImagesContextValue>({
  images: [],
  imagesWithError: [],
  isRendering: false,
  setIsRendering: () => {},
  downloadManager: new ImageDownloadManager(),
  getDownloadedImage: () => undefined,
  onAdd: () => {},
  onRemove: () => {},
  onClear: () => {},
  onError: () => {},
  onClearErrors: () => {},
});
