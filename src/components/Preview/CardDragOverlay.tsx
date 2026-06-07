import { Box } from "@chakra-ui/react";
import { DragOverlay } from "@dnd-kit/react";

import { getIsSortableCardData } from "@/hooks/useSortableCard";
import { formatCount } from "@/utils/pluralize";

export type CardDragOverlayProps = {
  dragOverlayOffset: {
    x: number;
    y: number;
  } | null;
};

export const CardDragOverlay = ({
  dragOverlayOffset,
}: CardDragOverlayProps) => {
  return (
    <DragOverlay>
      {(source) => {
        return (
          <Box
            height="full"
            position="relative"
            width="full"
            overflow="visible"
          >
            <Box
              left={`${dragOverlayOffset?.x}px`}
              top={`${dragOverlayOffset?.y}px`}
              background="accent.solid"
              borderRadius="md"
              color="white"
              padding="2"
              fontSize="sm"
              textAlign="center"
              width="max"
              maxWidth="var(--card-width)"
              wordBreak="break-all"
              position="absolute"
              zIndex="1"
              pointerEvents="none"
            >
              {getIsSortableCardData(source.data)
                ? source.data.images.length === 1
                  ? "name" in source.data.images[0]
                    ? source.data.images[0].name
                    : source.data.images[0].file.name
                  : formatCount(source.data.images.length, "card")
                : "unknown"}
            </Box>
          </Box>
        );
      }}
    </DragOverlay>
  );
};
