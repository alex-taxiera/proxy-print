import { ComponentProps, useContext, useState } from "react";

import { getIsAllSelected, reconcileSelection } from "@/utils/imageSelection";

import { ImageSelectionContext } from "./ImageSelectionContext";
import { ImagesContext } from "./ImagesContext";

export const ImageSelectionProvider = (
  props: Omit<ComponentProps<typeof ImageSelectionContext.Provider>, "value">,
) => {
  const { images } = useContext(ImagesContext);
  const [storedImageUuids, setStoredImageUuids] = useState<string[]>([]);

  const imageUuids = new Set(images.map((image) => image.uuid));
  const selectedImageUuids = reconcileSelection(storedImageUuids, imageUuids);

  const isAllSelected = getIsAllSelected(
    selectedImageUuids.length,
    images.length,
  );

  const onSelectImageUuid = (uuid: string, selected: boolean) => {
    setStoredImageUuids((old) => {
      const rest = reconcileSelection(old, imageUuids).filter(
        (id) => id !== uuid,
      );
      return selected ? [...rest, uuid] : rest;
    });
  };
  const onSelectAllImages = (selected: boolean) => {
    if (selected) {
      setStoredImageUuids(images.map((image) => image.uuid));
    } else {
      setStoredImageUuids([]);
    }
  };

  const getIsSelected = (uuid: string) => selectedImageUuids.includes(uuid);

  const contextValue = {
    selectedImageUuids,
    isAllSelected,
    onSelectImageUuid,
    onSelectAllImages,
    getIsSelected,
  };

  return <ImageSelectionContext.Provider {...props} value={contextValue} />;
};
