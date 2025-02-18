import { createContext } from "react";

export type Image = {
  uuid: string;
  file?: File
}

export type ImagesContextValue = {
  images: Image[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (files: File[], index?: number) => void;
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
