import {
  DragDropProvider,
  DragDropEventHandlers,
  useDroppable,
  useDragDropMonitor,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useCallback, useRef, useState, useMemo } from "react";

import { css, cx } from "styled-system/css";
import { center, flex, grid, hstack, vstack } from "styled-system/patterns";

import { Card } from "./Card";
import { ImageErrors } from "./components/ImageErrors";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { Button } from "./components/ui/button";
import { Link } from "./components/ui/link";
import { Pagination } from "./components/ui/pagination";
import { Tooltip } from "./components/ui/tooltip";
import { ImagesContext } from "./context/ImagesContext";
import { SettingsContext } from "./context/SettingsContext";
import { useGeneratePdf } from "./hooks/useGeneratePdf";
import { usePreviewData } from "./hooks/usePreviewData";
import { progressEvents } from "./utils/progress-events";

const containerStyles = flex.raw({
  direction: "column",
  alignItems: "center",
  paddingY: "6",
  paddingX: "2",
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

  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
    setIsReferenceCardLoaded(false);
  }, []);

  const onImageLoad = useCallback(() => {
    setIsReferenceCardLoaded(true);
  }, []);

  return {
    currentPage,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    onImageLoad,
  };
};

const PageDrop = ({
  id,
  disabled,
  children,
}: React.PropsWithChildren<{ id: string; disabled?: boolean }>) => {
  const [isDragging, setIsDragging] = useState(false);
  useDragDropMonitor({
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
  });
  const { isDropTarget, ref } = useDroppable({
    id,
    type: "page",
    accept: "card",
    disabled,
  });

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

export const PrintableImages = () => {
  const { cssVars } = useContext(SettingsContext);

  const {
    images,
    onClear,
    isRendering,
    setIsRendering,
    isFetching,
    onClearErrors,
    imagesWithError,
    onReorder,
  } = useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const { imageMatrix, cardsPerPage, rowsPerPage, columnsPerPage } =
    usePreviewData();

  const {
    currentPage,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    onImageLoad,
  } = usePagination();

  const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);
  const isLastPage = useMemo(
    () => currentPage === imageMatrix.length,
    [currentPage, imageMatrix.length],
  );

  const generatePdf = useGeneratePdf(contentRef);

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit("progress", {
      progress: 0,
      phase: "Initializing",
    });
    generatePdf();
  };

  const onDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
    (event) => {
      const { source, target } = event.operation;

      if (isSortable(source)) {
        if (target?.type === "page") {
          const absoluteIndex = images.findIndex(
            (img) => img.uuid === source.id,
          );
          switch (target.id) {
            case "prev-page":
              onReorder(
                source.id as string,
                absoluteIndex - source.sortable.initialIndex - 1,
              );
              changePage(currentPage - 1);
              break;
            case "next-page":
              onReorder(
                source.id as string,
                absoluteIndex + cardsPerPage - source.sortable.initialIndex,
              );
              changePage(currentPage + 1);
              break;
          }
        } else {
          // normal reordering
          const imageUuid = source.id as string;
          const newIndex =
            (currentPage - 1) * cardsPerPage + source.sortable.index;
          if (imageUuid && newIndex !== undefined) {
            onReorder(imageUuid, newIndex);
          }
        }
      }
    },
    [images, onReorder, changePage, currentPage, cardsPerPage],
  );

  if (images.length === 0) {
    return (
      <div
        className={css(containerStyles, {
          alignSelf: "stretch",
          justifyContent: "center",
          gap: "6",
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
        <p>
          You can download images from your{" "}
          <Link asChild>
            <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
              MPC Autofill
            </a>
          </Link>{" "}
          project with their &quot;Download Card Images&quot; option.
        </p>
      </div>
    );
  }

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div className={css(containerStyles)} style={cssVars}>
        <ProgressOverlay />
        <div
          className={hstack({
            direction: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "8",
          })}
        >
          <PageDrop id="prev-page" disabled={isFirstPage}>
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
              gap: "8",
            })}
          >
            <div
              className={vstack({
                gap: "2",
                width: "max(var(--page-width), 8.5in)",
                minWidth: "max",
                maxWidth: "full",
                alignItems: "stretch",
                position: "sticky",
                left: "0",
              })}
            >
              <div
                className={hstack({
                  gap: "2",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                })}
              >
                <div className={hstack({ gap: "2" })}>
                  <Button
                    colorPalette="gray"
                    disabled={isRendering}
                    onClick={() => onClear()}
                  >
                    Remove all cards
                  </Button>
                  <Tooltip.Root
                    disabled={
                      !isRendering && !isFetching && isReferenceCardLoaded
                    }
                    positioning={{
                      placement: "top",
                    }}
                  >
                    <Tooltip.Trigger asChild>
                      <Button
                        disabled={
                          isRendering || isFetching || !isReferenceCardLoaded
                        }
                        onClick={() => handleSave()}
                      >
                        Save
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Arrow>
                        <Tooltip.ArrowTip />
                      </Tooltip.Arrow>
                      <Tooltip.Content>
                        {isRendering
                          ? "Generating PDF..."
                          : isFetching
                            ? "Downloading images..."
                            : !isReferenceCardLoaded
                              ? "Loading images..."
                              : ""}
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                </div>
                <div
                  className={vstack({
                    alignItems: "center",
                    gap: "2",
                    visibility: imageMatrix.length > 1 ? "visible" : "hidden",
                  })}
                >
                  <span className={css({ fontSize: "xs", color: "fg.muted" })}>
                    Showing {currentPage * cardsPerPage - cardsPerPage + 1} -{" "}
                    {Math.min(
                      currentPage * cardsPerPage,
                      imageMatrix.length * cardsPerPage,
                      images.length,
                    )}{" "}
                    of{" "}
                    {Math.min(imageMatrix.length * cardsPerPage, images.length)}
                  </span>
                  <Pagination
                    count={imageMatrix.length * cardsPerPage}
                    page={currentPage}
                    pageSize={cardsPerPage}
                    siblingCount={1}
                    onPageChange={({ page }) => changePage(page)}
                  />
                </div>
              </div>
              <ImageErrors
                onDismiss={onClearErrors}
                imagesWithError={imagesWithError}
              />
            </div>
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
          <PageDrop id="next-page" disabled={isLastPage}>
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
        </div>
      </div>
    </DragDropProvider>
  );
};
