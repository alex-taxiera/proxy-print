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

  const onRemove = useCallback((uuid: string) => {
    remove(uuid);
    setImages((old) => old.filter((image) => image.uuid !== uuid));
  }, [remove]);

  const onClear = useCallback(() => {
    removeAll();
    onClearErrors();
    setImages([]);
  }, [removeAll, onClearErrors]);

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
      downloadImage: add,
      getCachedImage,
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
    ]
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
