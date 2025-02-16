import { createContext } from "react";

export type Image = {
  name: string;
  src?: string
}

export type ImagesContextValue = {
  images: Image[];
  setImages:React.Dispatch<React.SetStateAction<Image[]>>;
  onRemove: (index: number) => void;
  onAdd: (images: Image[], index?: number) => void;
}

export const ImagesContext = createContext<ImagesContextValue>({
  images: [],
  setImages: () => {},
  onRemove: () => {},
  onAdd: () => {},
});
