import { useQueryClient } from "@tanstack/react-query";
import { useContext, useMemo, useCallback, useState, useEffect } from "react";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import { Image, ImagesContext, getIsLocalImage } from "~/context/ImagesContext";
import { useSettingsStore } from "~/store/settingsStore";
import { usePreviewData } from "~/hooks/usePreviewData";
import {
  getIsDownloadableImageCacheEvent,
  ImageQueryData,
  getQueryKeyForImage,
} from "~/queries/images";
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

const useDownloadImages = (images: Image[]) => {
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
  }, [images, queryClient]);

  return {
    isDownloading,
    downloadImages,
  };
};

const useGetCanAddBleed = (images: Image[]) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const data = images.map((image) =>
      queryClient.getQueryData<ImageQueryData>(getQueryKeyForImage(image)),
    );

    return data.some((queryData) => {
      if (!queryData) return false;
      if ("original" in queryData) {
        return queryData.data.size === queryData.original.size;
      }
      return false;
    });
  }, [images, queryClient]);
};

const useGetCanRevertToOriginal = (images: Image[]) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    const data = images.map((image) =>
      queryClient.getQueryData<ImageQueryData>(getQueryKeyForImage(image)),
    );

    return data.some((queryData) => {
      if (!queryData) return false;
      if ("original" in queryData) {
        return queryData.original.size !== queryData.data.size;
      }
      return false;
    });
  }, [images, queryClient]);
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

  const getCanAddBleed = useGetCanAddBleed(images);
  const getCanRevertToOriginal = useGetCanRevertToOriginal(images);

  const [canAddBleed, setCanAddBleed] = useState(getCanAddBleed);
  const [canRevertToOriginal, setCanRevertToOriginal] = useState(false);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const isDownloadableImageCacheEvent =
        getIsDownloadableImageCacheEvent(event);

      if (isDownloadableImageCacheEvent) {
        setCanAddBleed(getCanAddBleed());
      }
    });
    return unsubscribe;
  }, [queryClient, getCanAddBleed]);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const isDownloadableImageCacheEvent =
        getIsDownloadableImageCacheEvent(event);

      if (isDownloadableImageCacheEvent) {
        setCanRevertToOriginal(getCanRevertToOriginal());
      }
    });
    return unsubscribe;
  }, [queryClient, getCanRevertToOriginal]);

  const { isDownloading, downloadImages } = useDownloadImages(images);

  const remove = useCallback(() => {
    onClear(images.map((image) => image.uuid));
  }, [onClear, images]);

  const addBleed = useCallback(() => {
    if (getCanAddBleed()) {
      void Promise.all(
        images.map(async (image) => {
          const queryData = queryClient.getQueryData<ImageQueryData>(
            getQueryKeyForImage(image),
          );
          if (queryData && "original" in queryData) {
            const data = await addBleedEdge(
              queryData.original,
              queryData.mimeType,
              Number(settings.cardWidth),
              Number(settings.cardHeight),
            );
            queryClient.setQueryData<ImageQueryData>(
              getQueryKeyForImage(image),
              () => ({ ...queryData, data }),
            );
          }
        }),
      );
    }
  }, [
    queryClient,
    settings.cardWidth,
    settings.cardHeight,
    getCanAddBleed,
    images,
  ]);

  const revertToOriginal = useCallback(() => {
    if (getCanRevertToOriginal()) {
      images.forEach((image) => {
        queryClient.setQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
          (old) => {
            if (!old || !("original" in old)) {
              return undefined;
            }

            return {
              ...old,
              data: old.original,
            };
          },
        );
      });
    }
  }, [getCanRevertToOriginal, queryClient, images]);

  const canMoveToNextPage = useMemo(() => {
    return currentPage === imageMatrix.length;
  }, [currentPage, imageMatrix.length]);

  const canMoveToPreviousPage = useMemo(() => {
    return currentPage === 1;
  }, [currentPage]);

  const moveToPage = useCallback(
    (page: number) => {
      const newIndex =
        page > currentPage
          ? (page - 1) * cardsPerPage
          : page * cardsPerPage - 1 - Math.min(cardsPerPage, images.length - 1);
      onReorder(images, Math.max(0, newIndex));
      onSelectAllImages(false);
    },
    [currentPage, cardsPerPage, onReorder, onSelectAllImages, images],
  );

  const moveToNextPage = useCallback(
    () => moveToPage(currentPage + 1),
    [moveToPage, currentPage],
  );

  const moveToPreviousPage = useCallback(
    () => moveToPage(currentPage - 1),
    [moveToPage, currentPage],
  );

  return {
    remove,
    canAddBleed,
    addBleed,
    canRevertToOriginal,
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
