import { createContext } from "react";

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
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (files: (File | GoogleImageData)[], index?: number) => void;
  onRemove: (uuid: string) => void;
  onClear: () => void;
}

export const ImagesContext = createContext<ImagesContextValue>({
  images: [],
  isRendering: false,
  setIsRendering: () => {},
  onAdd: () => {},
  onRemove: () => {},
  onClear: () => {},
});
