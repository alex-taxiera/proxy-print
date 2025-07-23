import { ComponentProps, useCallback, useMemo, useState } from "react";
import { GoogleImageData, Image, ImagesContext } from "./ImagesContext";
import { nanoid } from "nanoid";
import { useImageDownloadManager } from "./ImageDownloadManager";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">
) => {
  const {
    isFetching,
    add,
    remove,
    removeAll,
    getCachedImage,
  } = useImageDownloadManager();
  const [images, setImages] = useState<Image[]>([]);
  const [imagesWithError, setImagesWithError] = useState<Image[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [loadedLocalImageIds, setLoadedLocalImageIds] = useState<Set<string>>(new Set());

  const onError = useCallback(
    (uuid: string) => {
      setImages((old) => old.filter((image) => image.uuid !== uuid));
      setImagesWithError((old) => {
        const image = images.find((image) => image.uuid === uuid);
        const existingError = old.find((image) => image.uuid === uuid);
        if (!image || existingError) {
          return old;
        }

        return old.concat(image);
      });
    },
    [images]
  );

  const onClearErrors = useCallback(() => {
    setImagesWithError([]);
  }, []);

  const onLocalImageLoaded = useCallback((uuid: string) => {
    setLoadedLocalImageIds(prev => {
      const newSet = new Set(prev);
      newSet.add(uuid);
      return newSet;
    });
  }, []);

  const onRemove = useCallback((uuid: string) => {
    remove(uuid);
    setImages((old) => old.filter((image) => image.uuid !== uuid));
  }, [remove]);

  const onClear = useCallback(() => {
    removeAll();
    onClearErrors();
    setImages([]);
    setLoadedLocalImageIds(new Set());
  }, [removeAll, onClearErrors]);

  // Calculate local image loading state
  const totalLocalImageCount = images.filter(img => img.file).length;
  const loadedLocalImageCount = loadedLocalImageIds.size;
  const isLoadingLocalImages = loadedLocalImageCount < totalLocalImageCount;

  const onAdd = useCallback(
    (data: (File | GoogleImageData)[], index?: number) => {
      setImages((old) => {
        const images = data.map((item) => {
          if (item instanceof File) {
            return { uuid: nanoid(), file: item };
          }

          return { uuid: nanoid(), ...item };
        });
        if (index === undefined) {
          return old.concat(images);
        }

        return old.toSpliced(index, 0, ...images);
      });
    },
    []
  );

  const downloadImage = useCallback(async (id: string) => {
    const { mimeType, url } = await add(id);
    setImages((old) => old.map((image) => image.id === id ? { ...image, mimeType, url } : image));
  }, [add]);

  const contextValue = useMemo(
    () => ({
      isFetching,
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onError,
      onClearErrors,
      isRendering,
      setIsRendering,
      downloadImage,
      getCachedImage,
      onLocalImageLoaded,
      isLoadingLocalImages,
      loadedLocalImageCount,
      totalLocalImageCount,
    }),
    [
      isFetching,
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onError,
      onClearErrors,
      isRendering,
      setIsRendering,
      add,
      getCachedImage,
      onLocalImageLoaded,
      isLoadingLocalImages,
      loadedLocalImageCount,
      totalLocalImageCount,
    ]
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
