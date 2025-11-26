import { pointerIntersection } from "@dnd-kit/collision";
import { useSortable } from "@dnd-kit/react/sortable";
import { useContext } from "react";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import {
  PossiblyEmptyImage,
  ImagesContext,
  getIsEmptyImage,
} from "~/context/ImagesContext";

export type SortableCardData = ReturnType<
  typeof useSortableCard
>["sortable"]["data"];

export const getIsSortableCardData = (
  data: unknown,
): data is SortableCardData => {
  return typeof data === "object" && data !== null && "images" in data;
};

export const useSortableCard = ({
  image,
  index,
  isPending,
  imageSrc,
}: {
  image: PossiblyEmptyImage;
  index: number;
  isPending: boolean;
  imageSrc: string;
  absoluteIndex: number;
}) => {
  const { images } = useContext(ImagesContext);
  const { getIsSelected } = useContext(ImageSelectionContext);
  const isSelected = getIsSelected(image.uuid);
  const selectedImages = images.filter((image) => getIsSelected(image.uuid));
  const isEmpty = getIsEmptyImage(image);

  return useSortable({
    id: image.uuid,
    disabled: isEmpty || isPending || !imageSrc,
    index,
    type: "card",
    accept: "card",
    collisionDetector: pointerIntersection,
    data: {
      images: isEmpty ? [] : isSelected ? selectedImages : [image],
    },
  });
};
