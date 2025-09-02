import {
  ComponentProps,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { ImageSelectionContext } from "./ImageSelectionContext";
import { ImagesContext } from "./ImagesContext";

export const ImageSelectionProvider = (
  props: Omit<ComponentProps<typeof ImageSelectionContext.Provider>, "value">,
) => {
  const { images } = useContext(ImagesContext);
  const [selectedImageUuids, setSelectedImageUuids] = useState<string[]>([]);

  const isAllSelected = useMemo(() => {
    return selectedImageUuids.length === images.length;
  }, [selectedImageUuids, images]);

  const onSelectImageUuid = useCallback((uuid: string, selected: boolean) => {
    if (selected) {
      setSelectedImageUuids((old) => [...old, uuid]);
    } else {
      setSelectedImageUuids((old) => old.filter((id) => id !== uuid));
    }
  }, []);
  const onSelectAllImages = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedImageUuids(images.map((image) => image.uuid));
      } else {
        setSelectedImageUuids([]);
      }
    },
    [images],
  );

  const getIsSelected = useCallback(
    (uuid: string) => selectedImageUuids.includes(uuid),
    [selectedImageUuids],
  );

  const contextValue = useMemo(
    () => ({
      selectedImageUuids,
      isAllSelected,
      onSelectImageUuid,
      onSelectAllImages,
      getIsSelected,
    }),
    [
      selectedImageUuids,
      isAllSelected,
      onSelectImageUuid,
      onSelectAllImages,
      getIsSelected,
    ],
  );

  return <ImageSelectionContext.Provider {...props} value={contextValue} />;
};
