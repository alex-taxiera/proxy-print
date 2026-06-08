import { Box } from "@chakra-ui/react";
import { pointerIntersection } from "@dnd-kit/collision";
import { useDroppable, useDragDropMonitor } from "@dnd-kit/react";
import { useRef, useState, useEffect, useCallback } from "react";

export const PageDrop = ({
  id,
  disabled,
  children,
  onHoverTimeout,
  hoverTimeoutMs = 200,
}: React.PropsWithChildren<{
  id: string;
  disabled?: boolean;
  onHoverTimeout?: () => void;
  hoverTimeoutMs?: number;
}>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useDragDropMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => {
      setIsDragging(false);
      setIsHovering(false);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    },
  });

  const { isDropTarget, ref } = useDroppable({
    id,
    type: "page",
    accept: "card",
    disabled,
    collisionDetector: pointerIntersection,
  });

  const setHoverTimeout = useCallback(
    (timeout?: number) => {
      hoverTimerRef.current = setTimeout(() => {
        onHoverTimeout?.();
        setHoverTimeout(hoverTimeoutMs * 4);
      }, timeout ?? hoverTimeoutMs);
    },
    [onHoverTimeout, hoverTimeoutMs],
  );

  // Handle hover timeout logic
  const handleHoverStart = useCallback(() => {
    if (disabled || !onHoverTimeout) return;

    setIsHovering(true);

    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set new timer
    setHoverTimeout();
  }, [disabled, onHoverTimeout, setHoverTimeout]);

  const handleHoverEnd = useCallback(() => {
    setIsHovering(false);

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Monitor when we become a drop target (hovering over)
  useEffect(() => {
    if (isDropTarget && !isHovering) {
      handleHoverStart();
    } else if (!isDropTarget && isHovering) {
      handleHoverEnd();
    }
  }, [isDropTarget, isHovering, handleHoverStart, handleHoverEnd]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  return (
    <Box
      ref={ref}
      visibility={!disabled && isDragging ? "visible" : "hidden"}
      bg={
        isDropTarget ? "accent.900" : isDragging ? "bg.default" : "transparent"
      }
      borderColor="border.default"
      borderStyle="solid"
      borderWidth="1px"
      borderRadius="md"
      width="24"
      height="var(--page-height, 11 var(--page-unit, in))"
      paddingY="4"
      transitionProperty="common"
      transitionDuration="fast"
    >
      {children}
    </Box>
  );
};
