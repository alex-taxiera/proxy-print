import { pointerIntersection } from "@dnd-kit/collision";
import {
  DragDropProvider,
  DragDropEventHandlers,
  useDroppable,
  useDragDropMonitor,
  DragOverlay,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useContext,
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";

import { css, cx } from "styled-system/css";
import { center, grid, hstack, vstack } from "styled-system/patterns";

import { ImagesContext } from "../../context/ImagesContext";
import { SettingsContext } from "../../context/SettingsContext";
import { usePreviewData } from "../../hooks/usePreviewData";
import { getIsSortableCardData } from "../../hooks/useSortableCard";
import { ProgressOverlay } from "../ProgressOverlay";
import { Link } from "../ui/link";
import { Actions } from "./Actions";
import { Card } from "./Card";

const containerStyles = css.raw({
  flex: 1,
  minWidth: 0,
  overflow: "auto",
});

const usePagination = () => {
  const { imageMatrix } = usePreviewData();

  const [currentPage, setCurrentPage] = useState(1);
  const [isReferenceCardLoaded, setIsReferenceCardLoaded] = useState(false);

  const currentCards = useMemo(
    () => imageMatrix[currentPage - 1] ?? [],
    [imageMatrix, currentPage],
  );

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, imageMatrix.length)));
      setIsReferenceCardLoaded(false);
    },
    [imageMatrix.length],
  );

  const nextPage = useCallback(() => {
    setCurrentPage((old) => Math.min(old + 1, imageMatrix.length));
    setIsReferenceCardLoaded(false);
  }, [imageMatrix.length]);

  const previousPage = useCallback(() => {
    setCurrentPage((old) => Math.max(old - 1, 1));
    setIsReferenceCardLoaded(false);
  }, []);

  const onImageLoad = useCallback(() => {
    setIsReferenceCardLoaded(true);
  }, []);

  useEffect(() => {
    if (currentPage > imageMatrix.length) {
      changePage(imageMatrix.length || 1);
    }
  }, [currentPage, imageMatrix.length, changePage]);

  return {
    currentPage,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    nextPage,
    previousPage,
    onImageLoad,
  };
};

const PageDrop = ({
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
    <div
      ref={ref}
      className={css({
        visibility: !disabled && isDragging ? "visible" : "hidden",
        bg: isDropTarget
          ? "accent.5"
          : isDragging
            ? "bg.default"
            : "transparent",
        borderColor: "border.default",
        borderStyle: "solid",
        borderWidth: "1px",
        borderRadius: "l2",
        width: "24",
        height: "var(--page-height, 11 var(--page-unit, in))",
        paddingY: "4",
      })}
    >
      {children}
    </div>
  );
};

export const Preview = () => {
  const { cssVars } = useContext(SettingsContext);

  const { images, isRendering, imagesWithError, onReorder } =
    useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const { imageMatrix, cardsPerPage, rowsPerPage, columnsPerPage } =
    usePreviewData();

  const {
    currentPage,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    nextPage,
    previousPage,
    onImageLoad,
  } = usePagination();

  const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);
  const isLastPage = useMemo(
    () => currentPage === imageMatrix.length,
    [currentPage, imageMatrix.length],
  );

  const [dragOverlayOffset, setDragOverlayOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const onDragStart: DragDropEventHandlers["onDragStart"] = useCallback(
    (event) => {
      const coordinates = event.operation.position.initial;
      // Get the mouse position relative to the viewport
      const mouseX = coordinates?.x ?? 0;
      const mouseY = coordinates?.y ?? 0;

      // Get the overlay's position in the viewport
      const overlayRect =
        event.operation.source?.element?.getBoundingClientRect();

      // Calculate the offset from the overlay's top-left corner to the mouse position
      // This gives us the relative position within the overlay
      const relativeX = overlayRect ? mouseX - overlayRect.x : 0;
      const relativeY = overlayRect ? mouseY - overlayRect.y : 0;
      setDragOverlayOffset({ x: relativeX, y: relativeY });
    },
    [],
  );

  const onDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
    (event) => {
      const { source, target } = event.operation;

      if (!source || !target) {
        return;
      }

      if (isSortable(source) && getIsSortableCardData(source.data)) {
        if (getIsSortableCardData(target.data)) {
          // normal reorder
          const imageUuid = source.id as string;
          const newIndex = target.data.absoluteIndex;

          if (imageUuid && newIndex !== undefined) {
            onReorder(imageUuid, newIndex);
          }
        } else if (target.type === "page") {
          // move to page
          switch (target.id) {
            case "prev-page":
              onReorder(
                source.id as string,
                source.data.absoluteIndex - source.sortable.initialIndex - 1,
              );
              changePage(currentPage - 1);
              break;
            case "next-page":
              onReorder(
                source.id as string,
                source.data.absoluteIndex +
                  cardsPerPage -
                  source.sortable.initialIndex,
              );
              changePage(currentPage + 1);
              break;
          }
        }
      }
    },
    [onReorder, cardsPerPage, changePage, currentPage],
  );

  if (images.length === 0 && imagesWithError.length === 0) {
    return (
      <div className={css(containerStyles)}>
        <div
          className={vstack({
            paddingY: "6",
            paddingX: "2",
            gap: "6",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            height: "full",
          })}
        >
          <p>Add images to get started.</p>
          <p>
            Upload an XML from{" "}
            <Link asChild>
              <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
                MPC Autofill
              </a>
            </Link>{" "}
            &quot;Download XML&quot; option.
          </p>
          <p>Or import a decklist from your favorite deckbuilder!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={css(containerStyles)} style={cssVars}>
      <ProgressOverlay />
      <div
        className={hstack({
          minWidth: "max",
          width: "full",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "6",
          paddingY: "6",
          paddingX: "2",
        })}
      >
        {/* TODO: use grid so that actions and pagination don't need to be inside dragdrop provider */}
        <DragDropProvider
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={(event) => {
            event.preventDefault();
          }}
        >
          <PageDrop
            id="prev-page"
            disabled={isFirstPage}
            onHoverTimeout={previousPage}
          >
            <div
              className={vstack({
                height: "full",
                fontWeight: "semibold",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <div className={vstack({ gap: "2", alignItems: "center" })}>
                <div
                  className={vstack({ gap: "0", textTransform: "uppercase" })}
                >
                  <span>Prev</span>
                  <span>Page</span>
                </div>
                <FontAwesomeIcon icon={faArrowLeft} />
              </div>
              <div className={vstack({ gap: "2", alignItems: "center" })}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <div
                  className={vstack({ gap: "0", textTransform: "uppercase" })}
                >
                  <span>Prev</span>
                  <span>Page</span>
                </div>
              </div>
            </div>
          </PageDrop>
          <div
            className={vstack({
              alignItems: "center",
              gap: "3",
            })}
          >
            <Actions
              contentRef={contentRef}
              isReferenceCardLoaded={isReferenceCardLoaded}
              currentPage={currentPage}
              changePage={changePage}
            />
            <div
              ref={contentRef}
              style={
                {
                  "--rows-per-page": rowsPerPage.toString(),
                  "--columns-per-page": columnsPerPage.toString(),
                  "--grid-columns": columnsPerPage.toString(),
                } as Record<string, string>
              }
              className={vstack({
                maxWidth: "100%",
                "--bleed-edge-width": "var(--bleed-edge, 0mm)",
                "--image-zoom-width": "var(--image-zoom, 6.2mm)",
                "--guide-display": "var(--guides-display, block)",
                "--guide-border-color": "var(--guides-color, #adff2f)",
                "--guide-border-color-inverted":
                  "var(--guides-color-inverted, #ff0000)",
                "--guide-border-width": "var(--guides-thickness, 1px)",
                "--image-container-buffer-width":
                  "var(--image-container-buffer, var(--guide-border-width))",
                "--guide-corner-offset":
                  "calc(calc(-0.5 * var(--guide-border-width)) + calc(var(--bleed-edge-width) * var(--guides-at-bleed-edge, 1)))",
              })}
            >
              {}
              <div
                className={css(
                  {
                    position: "relative",
                    width: "100%",
                  },
                  isRendering ? { pointerEvents: "none" } : {},
                )}
              >
                <div
                  className={cx(
                    "page",
                    center({
                      flexDirection: "column",
                      height: "var(--page-height, 11 var(--page-unit, in))",
                      width: "var(--page-width, 8.5 var(--page-unit, in))",
                      background: "white",
                      boxShadow: "md",
                      "--item-width":
                        "calc(var(--card-width, 63mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
                      "--item-height":
                        "calc(var(--card-height, 88mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
                    }),
                  )}
                >
                  <div
                    className={grid({
                      gap: "0",
                      gridTemplateColumns:
                        "repeat(var(--grid-columns, 3), min-content)",
                      pageBreakAfter: "always",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      rowGap: "var(--row-gap)",
                      columnGap: "var(--column-gap)",
                    })}
                  >
                    {currentCards.map((image, index) => (
                      <Card
                        key={image.uuid || `empty-${index}`}
                        image={image}
                        index={index}
                        onImageLoad={index === 0 ? onImageLoad : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <PageDrop
            id="next-page"
            disabled={isLastPage}
            onHoverTimeout={nextPage}
          >
            <div
              className={vstack({
                height: "full",
                fontWeight: "semibold",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <div className={vstack({ gap: "2", alignItems: "center" })}>
                <div
                  className={vstack({ gap: "0", textTransform: "uppercase" })}
                >
                  <span>Next</span>
                  <span>Page</span>
                </div>
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
              <div className={vstack({ gap: "2", alignItems: "center" })}>
                <FontAwesomeIcon icon={faArrowRight} />
                <div
                  className={vstack({ gap: "0", textTransform: "uppercase" })}
                >
                  <span>Next</span>
                  <span>Page</span>
                </div>
              </div>
            </div>
          </PageDrop>
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
                      ? "name" in source.data.image
                        ? source.data.image.name
                        : source.data.image.file.name
                      : "unknown"}
                  </div>
                </div>
              );
            }}
          </DragOverlay>
        </DragDropProvider>
      </div>
    </div>
  );
};
