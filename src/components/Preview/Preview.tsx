import { DragDropProvider, DragDropEventHandlers } from "@dnd-kit/react";
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

import { Link } from "~/components/ui/link";

import { ProgressOverlay } from "~/components/ProgressOverlay";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import { ImagesContext } from "~/context/ImagesContext";
import { useSettingsStore, computeCssVars } from "~/store/settingsStore";
import { usePreviewData } from "~/hooks/usePreviewData";
import { getIsSortableCardData } from "~/hooks/useSortableCard";

import { Actions } from "./Actions";
import { Card } from "./Card";
import { CardDragOverlay } from "./CardDragOverlay";
import { PageDrop } from "./PageDrop";

const containerStyles = css.raw({
  flex: 1,
  minWidth: 0,
  overflow: "auto",
});

const usePagination = () => {
  const { pages } = usePreviewData();

  const [currentPage, setCurrentPage] = useState(1);
  const [isReferenceCardLoaded, setIsReferenceCardLoaded] = useState(false);

  const currentPageData = useMemo(
    () => pages[currentPage - 1] ?? { items: [], pageType: "front" as const, gridColumns: 3 },
    [pages, currentPage],
  );

  const currentCards = useMemo(() => currentPageData.items, [currentPageData]);

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, pages.length)));
      setIsReferenceCardLoaded(false);
    },
    [pages.length],
  );

  const nextPage = useCallback(() => {
    setCurrentPage((old) => Math.min(old + 1, pages.length));
    setIsReferenceCardLoaded(false);
  }, [pages.length]);

  const previousPage = useCallback(() => {
    setCurrentPage((old) => Math.max(old - 1, 1));
    setIsReferenceCardLoaded(false);
  }, []);

  const onImageLoad = useCallback(() => {
    setIsReferenceCardLoaded(true);
  }, []);

  useEffect(() => {
    if (currentPage > pages.length) {
      changePage(pages.length || 1);
    }
  }, [currentPage, pages.length, changePage]);

  return {
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

export const Preview = () => {
  const settings = useSettingsStore((s) => s.settings);
  const cssVars = useMemo(() => computeCssVars(settings), [settings]);

  const { images, isRendering, imagesWithError, onReorder, onReorderSlots, sortedSlots } =
    useContext(ImagesContext);

  const { onSelectAllImages, getIsSelected } = useContext(
    ImageSelectionContext,
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const { pages, cardsPerPage, rowsPerPage } =
    usePreviewData();

  const {
    currentPage,
    currentPageData,
    currentCards,
    isReferenceCardLoaded,
    changePage,
    onImageLoad,
  } = usePagination();

  const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);
  const isLastPage = useMemo(
    () => currentPage === pages.length,
    [currentPage, pages.length],
  );

  // In duplex mode pages alternate front/back, so drag-to-page navigation skips
  // 2 pages to keep the user on the same face type (front→front, back→back).
  const isDuplex = settings.printMode === "duplex";
  const dragPageStep = isDuplex ? 2 : 1;

  // Disable drop zones when there is no same-face page in that direction.
  const isDragPrevDisabled = isDuplex ? currentPage <= 2 : isFirstPage;
  const isDragNextDisabled = isDuplex
    ? currentPage >= pages.length - 1
    : isLastPage;

  const dragPreviousPage = useCallback(() => {
    changePage(Math.max(1, currentPage - dragPageStep));
  }, [changePage, currentPage, dragPageStep]);

  const dragNextPage = useCallback(() => {
    changePage(Math.min(pages.length, currentPage + dragPageStep));
  }, [changePage, pages.length, currentPage, dragPageStep]);

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

  // Strip `:back`, `:front-empty`, `:back-empty`, `:back-preview` suffixes to get the base slot ID.
  const toSlotId = useCallback((uuid: string) => uuid.split(":")[0], []);

  const onDragEnd: DragDropEventHandlers["onDragEnd"] = useCallback(
    (event) => {
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
            const newIndex = sortedSlots.findIndex(
              (s) => s.id === targetSlotId,
            );
            if (newIndex >= 0) {
              onReorderSlots(slotIdsToMove, newIndex);
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
              onReorder(source.data.images, targetBoundary?.last ?? (Math.floor((targetPage - 1) / (isDuplex ? 2 : 1)) + 1) * cardsPerPage - 1);
              changePage(targetPage);
              break;
            }
            case "next-page": {
              const targetPage = Math.min(
                pages.length,
                currentPage + dragPageStep,
              );
              const targetBoundary = pages[targetPage - 1]?.insertBoundary;
              onReorder(source.data.images, targetBoundary?.first ?? Math.floor((targetPage - 1) / (isDuplex ? 2 : 1)) * cardsPerPage);
              changePage(targetPage);
              break;
            }
          }
        }

        if (getIsSelected(source.id as string)) {
          onSelectAllImages(false);
        }
      }
    },
    [
      onReorder,
      onReorderSlots,
      sortedSlots,
      toSlotId,
      cardsPerPage,
      changePage,
      currentPage,
      isDuplex,
      dragPageStep,
      pages,
      onSelectAllImages,
      getIsSelected,
    ],
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
              ref={contentRef}
              style={
                {
                  "--rows-per-page": rowsPerPage.toString(),
                  "--columns-per-page": currentPageData.gridColumns.toString(),
                  "--grid-columns": currentPageData.gridColumns.toString(),
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
                  </div>
                </div>
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
