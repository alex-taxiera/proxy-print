import { useContext } from "react";

import { css } from "styled-system/css";
import { hstack, vstack } from "styled-system/patterns";

import { ImagesContext } from "../../context/ImagesContext";
import { useGeneratePdf } from "../../hooks/useGeneratePdf";
import { useImageLoadingProgress } from "../../hooks/useImageLoadingProgress";
import { usePreviewData } from "../../hooks/usePreviewData";
import { progressEvents } from "../../utils/progress-events";
import { ImageErrors } from "../ImageErrors";
import { Button } from "../ui/button";
import { Pagination } from "../ui/pagination";
import { Tooltip } from "../ui/tooltip";

export type ActionsProps = {
  isReferenceCardLoaded: boolean;
  currentPage: number;
  changePage: (page: number) => void;
  contentRef: React.RefObject<HTMLDivElement>;
};

export const Actions = ({
  isReferenceCardLoaded,
  currentPage,
  changePage,
  contentRef,
}: ActionsProps) => {
  const {
    images,
    onClear,
    isRendering,
    setIsRendering,
    onClearErrors,
    imagesWithError,
  } = useContext(ImagesContext);

  const isLoadingImages = useImageLoadingProgress();

  const { imageMatrix, cardsPerPage } = usePreviewData();

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

  return (
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
            disabled={!isRendering && !isLoadingImages && isReferenceCardLoaded}
            positioning={{
              placement: "top",
            }}
          >
            <Tooltip.Trigger asChild>
              <Button
                disabled={
                  isRendering || isLoadingImages || !isReferenceCardLoaded
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
                  : isLoadingImages
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
            of {Math.min(imageMatrix.length * cardsPerPage, images.length)}
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
  );
};
