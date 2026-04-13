import { ComponentProps, useContext, useState } from "react";

import { ImageSelectionContext } from "./ImageSelectionContext";
import { ImagesContext } from "./ImagesContext";

export const ImageSelectionProvider = (
  props: Omit<ComponentProps<typeof ImageSelectionContext.Provider>, "value">,
) => {
  const { images } = useContext(ImagesContext);
  const [selectedImageUuids, setSelectedImageUuids] = useState<string[]>([]);

  const isAllSelected = selectedImageUuids.length === images.length;

  const onSelectImageUuid = (uuid: string, selected: boolean) => {
    if (selected) {
      setSelectedImageUuids((old) => [...old, uuid]);
    } else {
      setSelectedImageUuids((old) => old.filter((id) => id !== uuid));
    }
  };
  const onSelectAllImages = (selected: boolean) => {
    if (selected) {
      setSelectedImageUuids(images.map((image) => image.uuid));
    } else {
      setSelectedImageUuids([]);
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
