import { MenuSelectionDetails, Portal } from "@ark-ui/react";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faDownload,
  faEllipsisV,
  faExpand,
  faTrash,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useMemo } from "react";

import { css } from "styled-system/css";
import { hstack, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { Link } from "~/components/ui/link";
import { Menu } from "~/components/ui/menu";
import { Pagination } from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip } from "~/components/ui/tooltip";

import { ImageErrors } from "~/components/ImageErrors";

import { ImageLoadingContext } from "~/context/ImageLoadingContext";
import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import { ImagesContext } from "~/context/ImagesContext";
import { useGeneratePdf } from "~/hooks/useGeneratePdf";
import { usePreviewData } from "~/hooks/usePreviewData";
import { formatCount, formatSelectionCount } from "~/utils/pluralize";
import { progressEvents } from "~/utils/progress-events";

import { useCardActions } from "./Card/useCardActions";

const NoSelectionActions = ({
  isReferenceCardLoaded,
  contentRef,
}: {
  isReferenceCardLoaded: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
}) => {
  const { isRendering, setIsRendering, images } = useContext(ImagesContext);
  const { isLoadingImages } = useContext(ImageLoadingContext);
  const generatePdf = useGeneratePdf(contentRef);
  const { onSelectAllImages } = useContext(ImageSelectionContext);

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit("progress", {
      progress: 0,
      phase: "Initializing",
    });
    generatePdf();
  };

  const { remove, isDownloading, downloadImages } = useCardActions({
    images,
    currentPage: 0,
  });

  return (
    <div className={hstack({ gap: "2" })}>
      <Tooltip.Root
        disabled={!isRendering && !isLoadingImages && isReferenceCardLoaded}
        positioning={{
          placement: "top",
        }}
      >
        <Tooltip.Trigger asChild>
          <Button
            disabled={isRendering || isLoadingImages || !isReferenceCardLoaded}
            onClick={() => handleSave()}
          >
            Generate PDF
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
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="outline"
            colorPalette="gray"
            aria-label="Actions"
            type="button"
          >
            <FontAwesomeIcon icon={faEllipsisV} size="lg" />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item
                  value="select-all"
                  onSelect={() => onSelectAllImages(true)}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faCheck} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Select all</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="remove-all"
                  onSelect={() => remove()}
                  disabled={isRendering}
                  color="fg.error"
                >
                  <Menu.ItemIndicator color="fg.error">
                    <FontAwesomeIcon icon={faTrash} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove all</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="downloadZip"
                  onSelect={() => downloadImages()}
                  disabled={isLoadingImages || isDownloading}
                >
                  <Menu.ItemIndicator>
                    {isDownloading ? (
                      <Spinner size="sm" mr="1px" />
                    ) : (
                      <FontAwesomeIcon icon={faDownload} />
                    )}
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Download all (ZIP)</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  );
};

export const SelectionMenuContent = ({
  currentPage,
}: {
  currentPage: number;
}) => {
  const { images, isRendering } = useContext(ImagesContext);
  const { imageMatrix } = usePreviewData();
  const { selectedImageUuids } = useContext(ImageSelectionContext);
  const { isLoadingImages } = useContext(ImageLoadingContext);
  const selectedImages = useMemo(
    () => images.filter((image) => selectedImageUuids.includes(image.uuid)),
    [images, selectedImageUuids],
  );

  const {
    remove,
    canAddBleed,
    addBleed,
    canRevertToOriginal,
    revertToOriginal,
    moveToPage,
    canMoveToNextPage,
    canMoveToPreviousPage,
    moveToNextPage,
    moveToPreviousPage,
    isDownloading,
    downloadImages,
  } = useCardActions({
    images: selectedImages,
    currentPage,
  });

  const onMoveToPage = useCallback(
    (details: MenuSelectionDetails) => moveToPage(parseInt(details.value)),
    [moveToPage],
  );

  return (
    <>
      <Menu.ItemGroup>
        <Menu.ItemGroupLabel>
          {formatSelectionCount(selectedImageUuids.length, "card")}
        </Menu.ItemGroupLabel>
        <Menu.Item
          value="clear-all"
          onSelect={() => remove()}
          disabled={isRendering}
          color="fg.error"
        >
          <Menu.ItemIndicator color="fg.error">
            <FontAwesomeIcon icon={faTrash} />
          </Menu.ItemIndicator>
          <Menu.ItemText>Remove all</Menu.ItemText>
        </Menu.Item>
        <Menu.Item
          value="download-all"
          onSelect={() => downloadImages()}
          disabled={isLoadingImages || isDownloading}
        >
          <Menu.ItemIndicator>
            {isDownloading ? (
              <Spinner size="sm" mr="1px" />
            ) : (
              <FontAwesomeIcon icon={faDownload} />
            )}
          </Menu.ItemIndicator>
          <Menu.ItemText>Download all (ZIP)</Menu.ItemText>
        </Menu.Item>
        {canAddBleed ? (
          <Menu.Item value="add-bleed-all" onSelect={() => addBleed()}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faExpand} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Add bleed to all</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {canRevertToOriginal ? (
          <Menu.Item value="revert-to-original-all" onSelect={revertToOriginal}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faUndo} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Revert all to original</Menu.ItemText>
          </Menu.Item>
        ) : null}
      </Menu.ItemGroup>
      <Menu.ItemGroup>
        {!canMoveToNextPage ? (
          <Menu.Item onSelect={moveToNextPage} value="move-to-next-page-all">
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faArrowRight} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Move all to next page</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {!canMoveToPreviousPage ? (
          <Menu.Item
            onSelect={moveToPreviousPage}
            value="move-to-previous-page-all"
          >
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Move all to previous page</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {imageMatrix.length > 1 ? (
          <Menu.Root
            onSelect={onMoveToPage}
            positioning={{ gutter: 10, placement: "right-start" }}
          >
            <Menu.TriggerItem>
              <FontAwesomeIcon icon={faEllipsisV} />
              Move all to ...
            </Menu.TriggerItem>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {imageMatrix.map((_, index) => (
                    <Menu.Item
                      key={index}
                      disabled={index + 1 === currentPage}
                      value={`${(index + 1).toString()}-all`}
                    >
                      Page {index + 1}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        ) : null}
      </Menu.ItemGroup>
    </>
  );
};

const SelectionActions = ({ currentPage }: { currentPage: number }) => {
  const { onSelectAllImages, selectedImageUuids } = useContext(
    ImageSelectionContext,
  );
  const selectedImageCount = selectedImageUuids.length;

  return (
    <div className={hstack({ gap: "2" })}>
      <Menu.Root onSelect={() => onSelectAllImages(false)}>
        <Menu.Trigger asChild>
          <Button colorPalette="gray" type="button">
            Actions
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <SelectionMenuContent currentPage={currentPage} />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <span>{formatCount(selectedImageCount, "card")} selected</span>
      <Link onClick={() => onSelectAllImages(false)}>Deselect all</Link>
    </div>
  );
};

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
  const { images, onClearErrors, imagesWithError } = useContext(ImagesContext);
  const { selectedImageUuids } = useContext(ImageSelectionContext);

  const { imageMatrix, cardsPerPage } = usePreviewData();

  return (
    <div
      className={vstack({
        gap: "2",
        width: "var(--page-width)",
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
          paddingLeft: "2",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "3",
          borderTopRadius: "md",
          backgroundColor: selectedImageUuids.length > 0 ? "bg.info" : "unset",
        })}
      >
        {selectedImageUuids.length === 0 ? (
          <NoSelectionActions
            isReferenceCardLoaded={isReferenceCardLoaded}
            contentRef={contentRef}
          />
        ) : (
          <SelectionActions currentPage={currentPage} />
        )}
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
            siblingCount={0}
            count={imageMatrix.length * cardsPerPage}
            page={currentPage}
            pageSize={cardsPerPage}
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
