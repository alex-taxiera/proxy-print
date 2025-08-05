import { nanoid } from "nanoid";
import { ComponentProps, useCallback, useMemo, useState } from "react";

import { MAX_PREVIEW_CARDS } from "../const/preview";
import { usePreviewData } from "../hooks/usePreviewData";
import { useImageDownloadManager } from "./ImageDownloadManager";
import { GoogleImageData, Image, ImagesContext } from "./ImagesContext";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">,
) => {
  const { isFetching, add, remove, removeAll, getCachedImage } =
    useImageDownloadManager();
  const [images, setImages] = useState<Image[]>([]);
  const [imagesWithError, setImagesWithError] = useState<Image[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [loadedLocalImageIds, setLoadedLocalImageIds] = useState<Set<string>>(
    new Set(),
  );

  const { cardsPerPage } = usePreviewData();

  const onError = useCallback((image: Image) => {
    const uuid = image.uuid;
    setImages((old) => old.filter((i) => i.uuid !== uuid));
    setImagesWithError((old) => {
      const existingError = old.find((image) => image.uuid === uuid);
      if (existingError) {
        return old;
      }

      return old.concat(image);
    });
  }, []);

  const onClearErrors = useCallback(() => {
    setImagesWithError([]);
  }, []);

  const onLocalImageLoaded = useCallback((uuid: string) => {
    setLoadedLocalImageIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(uuid);
      return newSet;
    });
  }, []);

  const onRemove = useCallback(
    (uuid: string) => {
      remove(uuid);
      setImages((old) => old.filter((image) => image.uuid !== uuid));
    },
    [remove],
  );

  const onClear = useCallback(() => {
    removeAll();
    onClearErrors();
    setImages([]);
    setLoadedLocalImageIds(new Set());
  }, [removeAll, onClearErrors]);

  // Calculate local image loading state
  const loadedLocalImageCount = loadedLocalImageIds.size;
  const isLoadingLocalImages =
    loadedLocalImageCount <
    Math.min(
      images.length,
      MAX_PREVIEW_CARDS - (MAX_PREVIEW_CARDS % cardsPerPage),
    );

  const downloadImage = useCallback(
    async (image: Image) => {
      const id = image.id;
      try {
        const { mimeType, url } = await add(id!);
        setImages((old) =>
          old.map((image) =>
            image.id === id ? { ...image, mimeType, url } : image,
          ),
        );
      } catch {
        onError(image);
      }
    },
    [add, onError],
  );

  const onAdd = useCallback(
    (data: (File | GoogleImageData)[], index?: number) => {
      setImages((old) => {
        const images = data.map((item) => {
          const uuid = nanoid();
          if (item instanceof File) {
            return { uuid, file: item };
          }

          void downloadImage({ uuid, ...item });

          return { uuid, ...item };
        });
        if (index === undefined) {
          return old.concat(images);
        }

        return old.toSpliced(index, 0, ...images);
      });
    },
    [downloadImage],
  );

  const contextValue = useMemo(
    () => ({
      isFetching,
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onClearErrors,
      isRendering,
      setIsRendering,
      getCachedImage,
      loadedLocalImageIds,
      onLocalImageLoaded,
      isLoadingLocalImages,
      loadedLocalImageCount,
    }),
    [
      isFetching,
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onClearErrors,
      isRendering,
      setIsRendering,
      getCachedImage,
      loadedLocalImageIds,
      onLocalImageLoaded,
      isLoadingLocalImages,
      loadedLocalImageCount,
    ],
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
