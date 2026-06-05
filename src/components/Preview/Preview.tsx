import { DragDropProvider, DragDropEventHandlers } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useRef, useState, useEffect, useCallback } from "react";

import { css, cx } from "styled-system/css";
import { center, grid, hstack, vstack } from "styled-system/patterns";

import { ProgressOverlay } from "@/components/ProgressOverlay";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { ImagesContext } from "@/context/ImagesContext";
import { usePreviewData } from "@/hooks/usePreviewData";
import { getIsSortableCardData } from "@/hooks/useSortableCard";
import { useSettingsStore, computeCssVars } from "@/store/settingsStore";

import { Actions } from "./Actions";
import { Card } from "./Card";
import { CardDragOverlay } from "./CardDragOverlay";
import { PageDrop } from "./PageDrop";

const usePagination = () => {
  const { pages, cardsPerPage, rowsPerPage } = usePreviewData();

  const [currentPage, setCurrentPage] = useState(1);
  const [isReferenceCardLoaded, setIsReferenceCardLoaded] = useState(false);

  const currentPageData = pages[currentPage - 1] ?? {
    items: [],
    pageType: "front" as const,
    gridColumns: 3,
  };

  const currentCards = currentPageData.items;

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, pages.length)));
      setIsReferenceCardLoaded(false);
    },
    [pages.length],
  );

  const nextPage = () => {
    setCurrentPage((old) => Math.min(old + 1, pages.length));
    setIsReferenceCardLoaded(false);
  };

  const previousPage = () => {
    setCurrentPage((old) => Math.max(old - 1, 1));
    setIsReferenceCardLoaded(false);
  };

  const onImageLoad = () => {
    setIsReferenceCardLoaded(true);
  };

  useEffect(() => {
    if (currentPage > pages.length) {
      changePage(pages.length || 1);
    }
  }, [currentPage, pages.length, changePage]);

  return {
    pages,
    cardsPerPage,
    rowsPerPage,
    currentPage,
    currentPageData,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    nextPage,
    previousPage,
    onImageLoad,
  };
};

// Lightweight skeleton: same CSS class structure as the real card, no interactivity.
// Used by useGeneratePdf for getBoundingClientRect() measurements free of any transform.
// No <img> needed — image dimensions are computed from settings in useGeneratePdf.
const MeasurementCard = () => (
  <div className={cx("card", css({ position: "relative" }))}>
    <div
      className={cx(
        "image-container",
        center({
          overflow: "hidden",
          width: "var(--item-width, 63mm)",
          height: "var(--item-height, 88mm)",
        }),
      )}
    />
  </div>
);

type PageGridProps = {
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const PageGrid = ({ style, children }: PageGridProps) => (
  <div
    className={cx(
      "page",
      center({
        flexDirection: "column",
        height: "var(--page-height, 11 var(--page-unit, in))",
        width: "var(--page-width, 8.5 var(--page-unit, in))",
        "--item-width":
          "calc(var(--card-width, 63mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
        "--item-height":
          "calc(var(--card-height, 88mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
      }),
    )}
    style={style}
  >
    <div
      className={grid({
        gap: "0",
        gridTemplateColumns: "repeat(var(--grid-columns, 3), min-content)",
        pageBreakAfter: "always",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        rowGap: "var(--row-gap)",
        columnGap: "var(--column-gap)",
      })}
    >
      {children}
    </div>
  </div>
);

export const Preview = () => {
  const settings = useSettingsStore((s) => s.settings);
  const cssVars = computeCssVars(settings);

  const {
    isRendering,
    onReorder,
    onReorderSlots,
    onMoveSlotToAbsoluteIndex,
    sortedSlots,
  } = useContext(ImagesContext);

  const { onSelectAllImages, getIsSelected } = useContext(
    ImageSelectionContext,
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const {
    pages,
    cardsPerPage,
    rowsPerPage,
    currentPage,
    currentPageData,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    onImageLoad,
  } = usePagination();

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pages.length;

  const pageTransformStyle = (() => {
    // if (isRendering) return undefined;
    const isBack = currentPageData.pageType === "back";
    const offsetX = Number(isBack ? settings.backOffsetX : settings.offsetX);
    const offsetY = Number(isBack ? settings.backOffsetY : settings.offsetY);
    const rotation = Number(
      isBack ? settings.backPageRotation : settings.pageRotation,
    );
    if (offsetX === 0 && offsetY === 0 && rotation === 0) return undefined;
    return {
      transform: `rotate(${rotation}deg) translate(${offsetX}mm, ${offsetY}mm)`,
    };
  })();

  // In duplex mode pages alternate front/back, so drag-to-page navigation skips
  // 2 pages to keep the user on the same face type (front→front, back→back).
  const isDuplex = settings.printMode === "duplex";
  const dragPageStep = isDuplex ? 2 : 1;

  // Disable drop zones when there is no same-face page in that direction.
  const isDragPrevDisabled = isDuplex ? currentPage <= 2 : isFirstPage;
  const isDragNextDisabled = isDuplex
    ? currentPage >= pages.length - 1
    : isLastPage;

  const dragPreviousPage = () => {
    changePage(Math.max(1, currentPage - dragPageStep));
  };

  const dragNextPage = () => {
    changePage(Math.min(pages.length, currentPage + dragPageStep));
  };

  const [dragOverlayOffset, setDragOverlayOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const onDragStart: DragDropEventHandlers["onDragStart"] = (event) => {
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
  };

  // Strip `:back`, `:front-empty`, `:back-empty`, `:back-preview` suffixes to get the base slot ID.
  const toSlotId = (uuid: string) => uuid.split(":")[0];

  const onDragEnd: DragDropEventHandlers["onDragEnd"] = (event) => {
    const { source, target } = event.operation;

    if (!source || !target) {
      return;
    }

    if (isSortable(source) && getIsSortableCardData(source.data)) {
      if (getIsSortableCardData(target.data)) {
        const imagesToMove = source.data.images;
        const dragTargetId = target.id as string;

        if (imagesToMove.length > 0) {
          // Use slot IDs so back-face drags work correctly
          const slotIdsToMove = [
            ...new Set(imagesToMove.map((img) => toSlotId(img.uuid))),
          ];
          const targetSlotId = toSlotId(dragTargetId);
          const newIndex = sortedSlots.findIndex((s) => s.id === targetSlotId);
          if (newIndex >= 0) {
            onReorderSlots(slotIdsToMove, newIndex);
          } else {
            // Target is a padding slot (slotId=null). Place the card at the
            // exact visual position, inserting empty gap-filler slots as needed.
            const pageDat = pages[currentPage - 1];
            const paddingIdx =
              pageDat?.items.findIndex((c) => c.image.uuid === dragTargetId) ??
              -1;
            if (paddingIdx >= 0 && pageDat) {
              onMoveSlotToAbsoluteIndex(
                slotIdsToMove,
                pageDat.insertBoundary.first + paddingIdx,
              );
            }
          }
        }
      } else if (target.type === "page") {
        // In duplex mode skip 2 pages so the card lands on the same face type.
        // slotGroup maps a page number to its underlying slot-range index:
        //   duplex: every 2 pages share one group → floor((page-1)/2)
        //   others: each page is its own group  → page-1
        switch (target.id) {
          case "prev-page": {
            const targetPage = Math.max(1, currentPage - dragPageStep);
            const targetBoundary = pages[targetPage - 1]?.insertBoundary;
            onReorder(
              source.data.images,
              targetBoundary?.last ??
                (Math.floor((targetPage - 1) / (isDuplex ? 2 : 1)) + 1) *
                  cardsPerPage -
                  1,
            );
            changePage(targetPage);
            break;
          }
          case "next-page": {
            const targetPage = Math.min(
              pages.length,
              currentPage + dragPageStep,
            );
            const targetBoundary = pages[targetPage - 1]?.insertBoundary;
            onReorder(
              source.data.images,
              targetBoundary?.first ??
                Math.floor((targetPage - 1) / (isDuplex ? 2 : 1)) *
                  cardsPerPage,
            );
            changePage(targetPage);
            break;
          }
        }
      }

      if (getIsSelected(source.id as string)) {
        onSelectAllImages(false);
      }
    }
  };

  return (
    <div style={cssVars}>
      <ProgressOverlay />
      {/* TODO: use grid so that actions and pagination don't need to be inside dragdrop provider */}
      <DragDropProvider
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(event) => {
          event.preventDefault();
        }}
      >
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
          <PageDrop
            id="prev-page"
            disabled={isDragPrevDisabled}
            onHoverTimeout={dragPreviousPage}
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
              gap: "0",
            })}
          >
            <Actions
              contentRef={contentRef}
              isReferenceCardLoaded={isReferenceCardLoaded}
              currentPage={currentPage}
              changePage={changePage}
            />
            <div
              style={
                {
                  "--rows-per-page": rowsPerPage.toString(),
                  "--columns-per-page": currentPageData.gridColumns.toString(),
                  "--grid-columns": currentPageData.gridColumns.toString(),
                } as Record<string, string>
              }
              className={vstack({
                maxWidth: "100%",
                position: "relative",
                "--bleed-edge-width": "var(--bleed-edge, 0mm)",
                "--image-zoom-width": "var(--image-zoom, 6.2mm)",
                "--guide-display":
                  currentPageData.pageType === "back" &&
                  !settings.backPagesShowGuides
                    ? "none"
                    : "var(--guides-display, block)",
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
              <div
                className={cx(
                  "page-container",
                  css(
                    {
                      position: "relative",
                      width: "100%",
                      background: "white",
                      boxShadow: "md",
                    },
                    isRendering ? { pointerEvents: "none" } : {},
                  ),
                )}
              >
                <PageGrid style={pageTransformStyle}>
                  {currentCards.map((item, index) => (
                    <Card
                      key={item.image.uuid || `empty-${index}`}
                      image={item.image}
                      index={index}
                      currentPage={currentPage}
                      onImageLoad={index === 0 ? onImageLoad : undefined}
                      slotId={item.slotId}
                      face={item.face}
                    />
                  ))}
                </PageGrid>
              </div>
              {/* Hidden measurement reference — never transformed, used by useGeneratePdf for layout measurements */}
              <div
                ref={contentRef}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "0",
                  visibility: "hidden",
                  pointerEvents: "none",
                }}
              >
                <PageGrid>
                  {Array.from({ length: currentCards.length }, (_, i) => (
                    <MeasurementCard key={i} />
                  ))}
                </PageGrid>
              </div>
            </div>
          </div>
          <PageDrop
            id="next-page"
            disabled={isDragNextDisabled}
            onHoverTimeout={dragNextPage}
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
        </div>
        <CardDragOverlay dragOverlayOffset={dragOverlayOffset} />
      </DragDropProvider>
    </div>
  );
};
