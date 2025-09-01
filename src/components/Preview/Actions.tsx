import { MenuSelectionDetails, Portal } from "@ark-ui/react";
import {
  faArrowLeft,
  faArrowRight,
  faDownload,
  faEllipsisV,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useState } from "react";

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
import { getIsLocalImage, ImagesContext } from "~/context/ImagesContext";
import { useGeneratePdf } from "~/hooks/useGeneratePdf";
import { usePreviewData } from "~/hooks/usePreviewData";
import { getQueryKeyForImage, ImageQueryData } from "~/queries/images";
import { progressEvents } from "~/utils/progress-events";
import { toaster } from "~/utils/toaster";
import ZipWorker from "~/workers/zip-worker?worker";

const getExtensionFromMimeType = (mimeType: string) => {
  const extension = mimeType.split("/").pop();
  return extension ? `.${extension}` : "";
};

const generateDownloadName = (name: string, uuid: string, mimeType: string) => {
  const nameHasExtension = /\.[a-zA-Z0-9]+$/.test(name);
  const extension = getExtensionFromMimeType(mimeType);
  if (nameHasExtension) {
    // Insert uuid before the extension
    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return `${name.slice(0, lastDotIndex)} (${uuid})${name.slice(lastDotIndex)}`;
    }
    // Fallback, should not happen if nameHasExtension is true
    return `${name} (${uuid})${extension}`;
  } else {
    return `${name} (${uuid})${extension}`;
  }
};

const useDownloadImages = () => {
  const { images } = useContext(ImagesContext);
  const queryClient = useQueryClient();

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImages = useCallback(
    (uuids?: string[]) => {
      setIsDownloading(true);
      const toastId = toaster.create({
        type: "info",
        closable: false,
        duration: Infinity,
        title: "Downloading images",
      });

      const imagesToDownload = uuids
        ? images.filter((image) => uuids.includes(image.uuid))
        : images;

      const formattedData = imagesToDownload.map((image) => {
        if (getIsLocalImage(image)) {
          return {
            name: generateDownloadName(
              image.file.name,
              image.uuid,
              image.file.type,
            ),
            image: image.file,
          };
        }

        const queryData = queryClient.getQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
        )!;

        return {
          name: generateDownloadName(
            image.name,
            image.uuid,
            queryData.mimeType,
          ),
          image: queryData.data,
        };
      });

      // remove duplicate data based on url -- optional?
      const imageData = formattedData.filter(
        (data, index) =>
          index === formattedData.findIndex((t) => t.image === data.image),
      );

      const worker = new ZipWorker();
      worker.postMessage({ type: "zip", data: { imageData } });

      worker.onmessage = (e) => {
        console.log("e", e);
        const { type, data } = e.data as {
          type: string;
          data: { blob: Blob };
        };

        if (type === "zip") {
          toaster.remove(toastId);
          worker.terminate();
          setIsDownloading(false);
          const { blob } = data;
          console.log("blob", blob);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `proxyprint_download_${Date.now()}.zip`;
          a.click();
          URL.revokeObjectURL(url);
        }
      };

      worker.onerror = (e) => {
        console.error("Worker error:", e.error);
        setIsDownloading(false);
        toaster.remove(toastId);
        worker.terminate();
      };
    },
    [images, queryClient],
  );

  return {
    isDownloading,
    downloadImages,
  };
};

const NoSelectionActions = ({
  isReferenceCardLoaded,
  contentRef,
}: {
  isReferenceCardLoaded: boolean;
  contentRef: React.RefObject<HTMLDivElement>;
}) => {
  const { onClear, isRendering, setIsRendering } = useContext(ImagesContext);
  const { isLoadingImages } = useContext(ImageLoadingContext);
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

  const { isDownloading, downloadImages } = useDownloadImages();
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
                  value="clear"
                  onSelect={() => onClear()}
                  disabled={isRendering}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faTrash} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove all cards</Menu.ItemText>
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
                  <Menu.ItemText>Download images (ZIP)</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  );
};

const SelectionActions = ({ currentPage }: { currentPage: number }) => {
  const { images, onClear, isRendering, onReorder } = useContext(ImagesContext);
  const { cardsPerPage, imageMatrix } = usePreviewData();
  const { onSelectAllImages, selectedImageUuids } = useContext(
    ImageSelectionContext,
  );
  const { isLoadingImages } = useContext(ImageLoadingContext);
  const { isDownloading, downloadImages } = useDownloadImages();
  const selectedImageCount = selectedImageUuids.length;
  const selectedImages = useMemo(
    () => images.filter((image) => selectedImageUuids.includes(image.uuid)),
    [images, selectedImageUuids],
  );

  const isOnLastPage = useMemo(() => {
    return currentPage === imageMatrix.length;
  }, [currentPage, imageMatrix.length]);

  const isOnFirstPage = useMemo(() => {
    return currentPage === 1;
  }, [currentPage]);

  const onMoveToNextPage = useCallback(() => {
    const newIndex = currentPage * cardsPerPage;
    onReorder(selectedImages, newIndex);
  }, [selectedImages, currentPage, cardsPerPage, onReorder]);

  const onMoveToPreviousPage = useCallback(() => {
    const newIndex = (currentPage - 1) * cardsPerPage - 1;
    onReorder(selectedImages, newIndex);
  }, [selectedImages, currentPage, cardsPerPage, onReorder]);

  const onMoveToPage = useCallback(
    (details: MenuSelectionDetails) => {
      const page = parseInt(details.value);
      const newIndex =
        page > currentPage
          ? (page - 1) * cardsPerPage
          : page * cardsPerPage - 1;
      onReorder(selectedImages, newIndex);
      onSelectAllImages(false);
    },
    [selectedImages, currentPage, cardsPerPage, onReorder, onSelectAllImages],
  );

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
              <Menu.ItemGroup>
                <Menu.Item
                  value="clear"
                  onSelect={() => onClear(selectedImageUuids)}
                  disabled={isRendering}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faTrash} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove selected cards</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="downloadZip"
                  onSelect={() => downloadImages(selectedImageUuids)}
                  disabled={isLoadingImages || isDownloading}
                >
                  <Menu.ItemIndicator>
                    {isDownloading ? (
                      <Spinner size="sm" mr="1px" />
                    ) : (
                      <FontAwesomeIcon icon={faDownload} />
                    )}
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Download images (ZIP)</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
              <Menu.ItemGroup>
                {!isOnLastPage ? (
                  <Menu.Item
                    onSelect={onMoveToNextPage}
                    value="move-to-next-page"
                  >
                    <Menu.ItemIndicator>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Menu.ItemIndicator>
                    <Menu.ItemText>Move to next page</Menu.ItemText>
                  </Menu.Item>
                ) : null}
                {!isOnFirstPage ? (
                  <Menu.Item
                    onSelect={onMoveToPreviousPage}
                    value="move-to-previous-page"
                  >
                    <Menu.ItemIndicator>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </Menu.ItemIndicator>
                    <Menu.ItemText>Move to previous page</Menu.ItemText>
                  </Menu.Item>
                ) : null}
                {imageMatrix.length > 1 ? (
                  <Menu.Root
                    onSelect={onMoveToPage}
                    positioning={{ gutter: 10, placement: "right-start" }}
                  >
                    <Menu.TriggerItem>
                      <FontAwesomeIcon icon={faEllipsisV} />
                      Move to ...
                    </Menu.TriggerItem>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          {imageMatrix.map((_, index) => (
                            <Menu.Item
                              key={index}
                              disabled={index + 1 === currentPage}
                              value={(index + 1).toString()}
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
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <span>
        {selectedImageCount} image{selectedImageCount === 1 ? "" : "s"} selected
      </span>
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
