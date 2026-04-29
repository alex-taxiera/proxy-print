import { useQueryClient } from "@tanstack/react-query";
import { useContext, useState, useEffect } from "react";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import { Image, ImagesContext, getIsLocalImage } from "~/context/ImagesContext";
import { usePreviewData } from "~/hooks/usePreviewData";
import { useUpscaleImage } from "~/hooks/useUpscaleImage";
import {
  getIsDownloadableImageCacheEvent,
  ImageQueryData,
  getQueryKeyForImage,
} from "~/queries/images";
import { useSettingsStore } from "~/store/settingsStore";
import { addBleedEdge } from "~/utils/add-bleed";
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
    const lastDotIndex = name.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return `${name.slice(0, lastDotIndex)} (${uuid})${name.slice(lastDotIndex)}`;
    }
    return `${name} (${uuid})${extension}`;
  } else {
    return `${name} (${uuid})${extension}`;
  }
};

const useDownloadImages = (images: Image[]) => {
  const queryClient = useQueryClient();

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImages = () => {
    setIsDownloading(true);
    const toastId = toaster.create({
      type: "info",
      closable: false,
      duration: Infinity,
      title: "Downloading images",
    });

    const formattedData = images.map((image) => {
      const queryData = queryClient.getQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
      )!;

      if (getIsLocalImage(image)) {
        return {
          name: generateDownloadName(
            image.file.name,
            image.uuid,
            image.file.type,
          ),
          image: queryData.data,
        };
      }

      return {
        name: generateDownloadName(image.name, image.uuid, queryData.mimeType),
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
  };

  return {
    isDownloading,
    downloadImages,
  };
};

const hasOriginal = (
  queryData: ImageQueryData,
): queryData is ImageQueryData & {
  original: Blob | File;
  isUpscaled: boolean;
  hasBleed: boolean;
  upscaledOriginal?: Blob;
} => "original" in queryData;

const useImageStates = (images: Image[]) => {
  const queryClient = useQueryClient();

  const getStates = () => {
    const allData = images.map((image) =>
      queryClient.getQueryData<ImageQueryData>(getQueryKeyForImage(image)),
    );

    return {
      canAddBleed: allData.some((d) => d && hasOriginal(d) && !d.hasBleed),
      canRemoveBleed: allData.some((d) => d && hasOriginal(d) && d.hasBleed),
      canUpscale: allData.some((d) => d && hasOriginal(d) && !d.isUpscaled),
      canRemoveUpscale: allData.some(
        (d) => d && hasOriginal(d) && d.isUpscaled,
      ),
      canRevertToOriginal: allData.some(
        (d) => d && hasOriginal(d) && (d.isUpscaled || d.hasBleed),
      ),
    };
  };

  return getStates;
};

export type UseCardActionsProps = {
  images: Image[];
  currentPage: number;
};

export const useCardActions = ({
  images,
  currentPage,
}: UseCardActionsProps) => {
  const { onReorder, onClear } = useContext(ImagesContext);
  const { cardsPerPage, imageMatrix } = usePreviewData();
  const { onSelectAllImages } = useContext(ImageSelectionContext);
  const settings = useSettingsStore((s) => s.settings);
  const queryClient = useQueryClient();
  const { upscaleImage } = useUpscaleImage();

  const getStates = useImageStates(images);

  const [states, setStates] = useState(getStates);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (getIsDownloadableImageCacheEvent(event)) {
        setStates(getStates());
      }
    });
    return unsubscribe;
  }, [queryClient, getStates]);

  const { isDownloading, downloadImages } = useDownloadImages(images);

  const remove = () => {
    onClear(images.map((image) => image.uuid));
  };

  const addBleed = () => {
    void Promise.all(
      images.map(async (image) => {
        const queryData = queryClient.getQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
        );
        if (queryData && hasOriginal(queryData) && !queryData.hasBleed) {
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({ ...queryData, isProcessing: true }),
          );
          const base = queryData.upscaledOriginal ?? queryData.original;
          const data = await addBleedEdge(
            base,
            queryData.mimeType,
            Number(settings.cardWidth),
            Number(settings.cardHeight),
          );
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({ ...queryData, data, hasBleed: true }),
          );
        }
      }),
    );
  };

  const removeBleed = () => {
    images.forEach((image) => {
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        (old) => {
          if (!old || !hasOriginal(old) || !old.hasBleed) return old;
          return {
            ...old,
            data: old.upscaledOriginal ?? old.original,
            hasBleed: false,
          };
        },
      );
    });
  };

  const upscale = () => {
    void Promise.all(
      images.map(async (image) => {
        const queryData = queryClient.getQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
        );
        if (queryData && hasOriginal(queryData) && !queryData.isUpscaled) {
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({ ...queryData, isProcessing: true }),
          );
          const upscaledOriginal = await upscaleImage(queryData.original);
          let data: Blob;
          if (queryData.hasBleed) {
            data = await addBleedEdge(
              upscaledOriginal,
              queryData.mimeType,
              Number(settings.cardWidth),
              Number(settings.cardHeight),
            );
          } else {
            data = upscaledOriginal;
          }
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({ ...queryData, data, upscaledOriginal, isUpscaled: true }),
          );
        }
      }),
    );
  };

  const removeUpscale = () => {
    void Promise.all(
      images.map(async (image) => {
        const queryData = queryClient.getQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
        );
        if (queryData && hasOriginal(queryData) && queryData.isUpscaled) {
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({ ...queryData, isProcessing: true }),
          );
          let data: Blob;
          if (queryData.hasBleed) {
            data = await addBleedEdge(
              queryData.original,
              queryData.mimeType,
              Number(settings.cardWidth),
              Number(settings.cardHeight),
            );
          } else {
            data = queryData.original;
          }
          queryClient.setQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
            () => ({
              ...queryData,
              data,
              upscaledOriginal: undefined,
              isUpscaled: false,
            }),
          );
        }
      }),
    );
  };

  const revertToOriginal = () => {
    images.forEach((image) => {
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        (old) => {
          if (!old || !hasOriginal(old)) return old;
          return {
            ...old,
            data: old.original,
            upscaledOriginal: undefined,
            isUpscaled: false,
            hasBleed: false,
          };
        },
      );
    });
  };

  const canMoveToNextPage = currentPage === imageMatrix.length;

  const canMoveToPreviousPage = currentPage === 1;

  const moveToPage = (page: number) => {
    const newIndex =
      page > currentPage
        ? (page - 1) * cardsPerPage
        : page * cardsPerPage - 1 - Math.min(cardsPerPage, images.length - 1);
    onReorder(images, Math.max(0, newIndex));
    onSelectAllImages(false);
  };

  const moveToNextPage = () => moveToPage(currentPage + 1);

  const moveToPreviousPage = () => moveToPage(currentPage - 1);

  return {
    remove,
    canAddBleed: states.canAddBleed,
    addBleed,
    canRemoveBleed: states.canRemoveBleed,
    removeBleed,
    canUpscale: states.canUpscale,
    upscale,
    canRemoveUpscale: states.canRemoveUpscale,
    removeUpscale,
    canRevertToOriginal: states.canRevertToOriginal,
    revertToOriginal,
    canMoveToNextPage,
    canMoveToPreviousPage,
    moveToPage,
    moveToNextPage,
    moveToPreviousPage,
    isDownloading,
    downloadImages,
  };
};
