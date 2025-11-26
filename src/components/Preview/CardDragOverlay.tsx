import { DragOverlay } from "@dnd-kit/react";

import { css } from "styled-system/css";

import { getIsSortableCardData } from "~/hooks/useSortableCard";
import { formatCount } from "~/utils/pluralize";

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
          <div
            className={css({
              height: "full",
              position: "relative",
              width: "100%",
              overflow: "visible",
            })}
          >
            <div
              style={{
                left: `${dragOverlayOffset?.x}px`,
                top: `${dragOverlayOffset?.y}px`,
              }}
              className={css({
                background: "accent.default",
                borderRadius: "l2",
                color: "accent.fg",
                padding: "2",
                fontSize: "sm",
                textAlign: "center",
                width: "max",
                maxWidth: "var(--card-width)",
                wordBreak: "break-all",
                position: "absolute",
                zIndex: "1",
                pointerEvents: "none",
              })}
            >
              {getIsSortableCardData(source.data)
                ? source.data.images.length === 1
                  ? "name" in source.data.images[0]
                    ? source.data.images[0].name
                    : source.data.images[0].file.name
                  : formatCount(source.data.images.length, "card")
                : "unknown"}
            </div>
          </div>
        );
      }}
    </DragOverlay>
  );
};
