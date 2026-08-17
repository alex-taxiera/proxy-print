import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { toaster } from "@/components/ui/toaster";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { Image, ImagesContext, getIsLocalImage } from "@/context/ImagesContext";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import {
  getIsDownloadableImageCacheEvent,
  ImageQueryData,
  getQueryKeyForImage,
} from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import { addBleedEdge } from "@/utils/add-bleed";
import { downloadBlob } from "@/utils/download-blob";
import ZipWorker from "@/workers/zip-worker?worker";

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

const useDownloadImages = () => {
  const queryClient = useQueryClient();

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImages = (images: Image[]) => {
    setIsDownloading(true);
    const toastId = toaster.create({
      type: "info",
      closable: false,
      duration: Infinity,
      title: "Downloading images",
    });

    const formattedData = images.flatMap((image) => {
      const queryData = queryClient.getQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
      );

      // An image can be missing from the cache if it never finished loading.
      if (!queryData) return [];

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
      const { type, data } = e.data as {
        type: string;
        data: { blob: Blob };
      };

      if (type === "zip") {
        toaster.remove(toastId);
        worker.terminate();
        setIsDownloading(false);
        downloadBlob(data.blob, `proxyprint_download_${Date.now()}.zip`);
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

type CardActionStates = {
  canAddBleed: boolean;
  canRemoveBleed: boolean;
  canUpscale: boolean;
  canRemoveUpscale: boolean;
  canRevertToOriginal: boolean;
};

const defaultCardActionStates: CardActionStates = {
  canAddBleed: false,
  canRemoveBleed: false,
  canUpscale: false,
  canRemoveUpscale: false,
  canRevertToOriginal: false,
};

const getCardActionStates = (
  images: Image[],
  queryClient: ReturnType<typeof useQueryClient>,
): CardActionStates => {
  if (images.length === 0) {
    return defaultCardActionStates;
  }

  const allData = images.map((image) =>
    queryClient.getQueryData<ImageQueryData>(getQueryKeyForImage(image)),
  );

  return {
    canAddBleed: allData.some((d) => d && hasOriginal(d) && !d.hasBleed),
    canRemoveBleed: allData.some((d) => d && hasOriginal(d) && d.hasBleed),
    canUpscale: allData.some((d) => d && hasOriginal(d) && !d.isUpscaled),
    canRemoveUpscale: allData.some((d) => d && hasOriginal(d) && d.isUpscaled),
    canRevertToOriginal: allData.some(
      (d) => d && hasOriginal(d) && (d.isUpscaled || d.hasBleed),
    ),
  };
};

export type UseCardActionsProps = {
  images: Image[];
  currentPage: number;
};

export const useCardActions = ({
  images,
  currentPage,
}: UseCardActionsProps) => {
  const {
    onReorder,
    onClear,
    onAdd,
    images: allImages,
    slots,
  } = useContext(ImagesContext);
  const { cardsPerPage, imageMatrix } = usePreviewData();
  const { onSelectAllImages } = useContext(ImageSelectionContext);
  const settings = useSettingsStore((s) => s.settings);
  const queryClient = useQueryClient();
  const { upscaleImage } = useUpscaleImage();

  const trackedImageKeys = useMemo(
    () =>
      new Set(
        images.map((image) => JSON.stringify(getQueryKeyForImage(image))),
      ),
    [images],
  );
  const trackedImageKeysRef = useRef(trackedImageKeys);

  useEffect(() => {
    trackedImageKeysRef.current = trackedImageKeys;
  }, [trackedImageKeys]);

  const subscribeToImageCache = useCallback(
    (onStoreChange: () => void) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (!getIsDownloadableImageCacheEvent(event) || !event.query) {
          return;
        }

        const queryKey = JSON.stringify(event.query.queryKey);
        if (trackedImageKeysRef.current.has(queryKey)) {
          onStoreChange();
        }
      }),
    [queryClient],
  );

  const [, setCacheVersion] = useState(0);

  useEffect(
    () =>
      subscribeToImageCache(() => setCacheVersion((version) => version + 1)),
    [subscribeToImageCache],
  );

  const states = getCardActionStates(images, queryClient);

  const { isDownloading, downloadImages: runDownload } = useDownloadImages();

  // A slot's id is its front image's uuid, so the selection (which only ever
  // contains fronts) maps straight onto the slots holding the paired backs.
  const pairedBackCount = images.filter(
    (image) => slots.get(image.uuid)?.back,
  ).length;

  const downloadImages = (options?: { includeBacks?: boolean }) => {
    const toDownload = options?.includeBacks
      ? images.flatMap((image) => {
          const back = slots.get(image.uuid)?.back;
          return back ? [image, back] : [image];
        })
      : images;

    // If backs are not requested, use the existing downloader which creates a flat zip
    if (!options?.includeBacks) {
      runDownload(toDownload);
      return;
    }

    // When including backs, structure files into fronts/ and backs/ folders.
    const formattedData = images.flatMap((frontImage) => {
      const frontQuery = queryClient.getQueryData<ImageQueryData>(
        getQueryKeyForImage(frontImage),
      );

      if (!frontQuery) return [];

      const frontEntry = {
        name: `fronts/${generateDownloadName(
          getIsLocalImage(frontImage) ? frontImage.file.name : frontImage.name,
          frontImage.uuid,
          frontQuery.mimeType,
        )}`,
        image: frontQuery.data,
      } as const;

      const slot = slots.get(frontImage.uuid);
      if (!slot || !slot.back) return [frontEntry];

      const backImage = slot.back;
      const backQuery = queryClient.getQueryData<ImageQueryData>(
        getQueryKeyForImage(backImage),
      );

      if (!backQuery) return [frontEntry];

      // Name the back file to refer to the front slot id (front UUID) to keep pairs obvious
      const backExt = getExtensionFromMimeType(backQuery.mimeType) || "";
      const backEntry = {
        name: `backs/${frontImage.uuid}${backExt}`,
        image: backQuery.data,
      } as const;

      return [frontEntry, backEntry];
    });

    // remove duplicate data based on blob equality (same heuristic as previous implementation)
    const imageData = formattedData.filter(
      (data, index) =>
        index === formattedData.findIndex((t) => t.image === data.image),
    );

    const worker = new ZipWorker();
    worker.postMessage({ type: "zip", data: { imageData } });

    worker.onmessage = (e) => {
      const { type, data } = e.data as {
        type: string;
        data: { blob: Blob };
      };

      if (type === "zip") {
        setIsDownloading(false);
        worker.terminate();
        downloadBlob(data.blob, `proxyprint_download_${Date.now()}.zip`);
      }
    };

    worker.onerror = (e) => {
      console.error("Worker error:", e.error);
      setIsDownloading(false);
      worker.terminate();
    };
  };

  const remove = () => {
    onClear(images.map((image) => image.uuid));
  };

  const addMore = (count: number) => {
    // Process from last to first so each insertion doesn't shift the
    // indices of cards earlier in the list that haven't been processed yet.
    const sorted = [...images].sort(
      (a, b) => allImages.indexOf(b) - allImages.indexOf(a),
    );
    for (const image of sorted) {
      onAdd(
        Array.from({ length: count }, () => image),
        allImages.indexOf(image) + 1,
      );
    }
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
    const total = images.length;
    let completed = 0;

    const toastId = toaster.create({
      type: "loading",
      closable: false,
      duration: Infinity,
      title: "Upscaling images",
      description: "Processing selected images...",
      meta: { progress: completed, totalProgressAmount: total },
    });

    const updateProgress = () => {
      toaster.update(toastId, {
        meta: { progress: completed, totalProgressAmount: total },
      });
    };

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
          try {
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
              () => ({
                ...queryData,
                data,
                upscaledOriginal,
                isUpscaled: true,
              }),
            );
          } catch (error) {
            // On error, clear isProcessing so UI doesn't stay stuck; keep original data
            queryClient.setQueryData<ImageQueryData>(
              getQueryKeyForImage(image),
              () => ({ ...queryData }),
            );
            console.error("Upscale failed for image", image.uuid, error);
          } finally {
            completed += 1;
            updateProgress();
          }
        } else {
          // Nothing to do for this image; count it as completed
          completed += 1;
          updateProgress();
        }
      }),
    ).then(() => {
      // Show 100% and remove toast after short delay
      toaster.update(toastId, {
        meta: { progress: total, totalProgressAmount: total },
      });
      setTimeout(() => toaster.remove(toastId), 1000);
    });
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
    addMore,
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
    pairedBackCount,
  };
};
