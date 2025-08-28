import { Portal } from "@ark-ui/react";
import {
  faDownload,
  faEllipsisV,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useState } from "react";

import { css } from "styled-system/css";
import { hstack, vstack } from "styled-system/patterns";

import { getIsLocalImage, ImagesContext } from "../../context/ImagesContext";
import { useGeneratePdf } from "../../hooks/useGeneratePdf";
import { useImageLoadingProgress } from "../../hooks/useImageLoadingProgress";
import { usePreviewData } from "../../hooks/usePreviewData";
import { getQueryDataForImage, ImageQueryData } from "../../queries/images";
import { progressEvents } from "../../utils/progress-events";
import { toaster } from "../../utils/toaster";
import ZipWorker from "../../workers/zip-worker?worker";
import { ImageErrors } from "../ImageErrors";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { Menu } from "../ui/menu";
import { Pagination } from "../ui/pagination";
import { Spinner } from "../ui/spinner";
import { Tooltip } from "../ui/tooltip";

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

  const downloadImages = useCallback(() => {
    setIsDownloading(true);
    const toastId = toaster.create({
      type: "info",
      closable: false,
      duration: Infinity,
      title: "Downloading images",
    });

    const imageData = images.map((image) => {
      if (getIsLocalImage(image)) {
        return {
          name: generateDownloadName(
            image.file.name,
            image.uuid,
            image.file.type,
          ),
          file: image.file,
        };
      }

      const queryData = queryClient.getQueryData<ImageQueryData>(
        getQueryDataForImage(image).queryKey,
      )!;

      return {
        name: generateDownloadName(image.name, image.uuid, queryData.mimeType),
        url: queryData.url,
      };
    });

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
  }, [images, queryClient]);

  return {
    isDownloading,
    downloadImages,
  };
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

  const { isDownloading, downloadImages } = useDownloadImages();

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
                      disabled={isDownloading}
                    >
                      <Menu.ItemIndicator>
                        {isDownloading ? (
                          <Spinner />
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
