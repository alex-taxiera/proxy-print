import { createContext } from "react";

export type ImageSelectionContextValue = {
  selectedImageUuids: string[];
  isAllSelected: boolean;
  onSelectImageUuid: (uuid: string, selected: boolean) => void;
  onSelectAllImages: (selected: boolean) => void;
  getIsSelected: (uuid: string) => boolean;
};

export const ImageSelectionContext = createContext<ImageSelectionContextValue>({
  selectedImageUuids: [],
  isAllSelected: false,
  onSelectImageUuid: () => {},
  onSelectAllImages: () => {},
  getIsSelected: () => false,
});
