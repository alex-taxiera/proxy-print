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
  // Ref instead of state — only used for logic, never drives rendering
  const isHoveringRef = useRef(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useDragDropMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => {
      setIsDragging(false);
      isHoveringRef.current = false;
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

  // Ref breaks the self-reference that useCallback can't express without a TDZ violation
  const setHoverTimeoutRef = useRef<(timeout?: number) => void>(() => {});

  const setHoverTimeout = useCallback(
    (timeout?: number) => {
      hoverTimerRef.current = setTimeout(() => {
        onHoverTimeout?.();
        setHoverTimeoutRef.current(hoverTimeoutMs * 4);
      }, timeout ?? hoverTimeoutMs);
    },
    [onHoverTimeout, hoverTimeoutMs],
  );

  // Keep ref in sync so the scheduled callback always calls the latest version
  useEffect(() => {
    setHoverTimeoutRef.current = setHoverTimeout;
  }, [setHoverTimeout]);

  // Monitor when we become a drop target — use refs to avoid setState-in-effect
  useEffect(() => {
    if (isDropTarget && !isHoveringRef.current) {
      if (disabled || !onHoverTimeout) return;
      isHoveringRef.current = true;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setHoverTimeout();
    } else if (!isDropTarget && isHoveringRef.current) {
      isHoveringRef.current = false;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }
  }, [isDropTarget, setHoverTimeout, disabled, onHoverTimeout]);

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
