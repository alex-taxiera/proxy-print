import { createContext } from "react";

export type GoogleImageData = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

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
  onReorder: (imageUuid: string, newIndex: number) => void;
  getCachedImage: (id: string) => string | undefined;
  onAdd: (files: (File | GoogleImageData)[], index?: number) => void;
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
