import { pointerIntersection } from "@dnd-kit/collision";
import { useSortable } from "@dnd-kit/react/sortable";

import { Image } from "../context/ImagesContext";

export type SortableCardData = ReturnType<
  typeof useSortableCard
>["sortable"]["data"];

export const getIsSortableCardData = (
  data: unknown,
): data is SortableCardData => {
  return (
    typeof data === "object" &&
    data !== null &&
    "absoluteIndex" in data &&
    "image" in data
  );
};

export const useSortableCard = ({
  image,
  index,
  isEmpty,
  isPending,
  imageSrc,
  absoluteIndex,
}: {
  image: Image;
  index: number;
  isEmpty: boolean;
  isPending: boolean;
  imageSrc: string;
  absoluteIndex: number;
}) => {
  return useSortable({
    id: image.uuid,
    disabled: isEmpty || isPending || !imageSrc,
    index,
    type: "card",
    accept: "card",
    collisionDetector: pointerIntersection,
    data: {
      absoluteIndex,
      image,
    },
  });
};
