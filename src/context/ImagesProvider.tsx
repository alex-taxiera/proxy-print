import { ComponentProps, useCallback, useMemo, useState } from "react";
import { GoogleImageData, Image, ImagesContext } from "./ImagesContext";
import { nanoid } from "nanoid";
import { ImageDownloadManager } from "./ImageDownloadManager";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">
) => {
  const downloadManager = useMemo(() => new ImageDownloadManager(), []);
  const [images, setImages] = useState<Image[]>([]);
  const [imagesWithError, setImagesWithError] = useState<Image[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  const onError = useCallback(
    (uuid: string) => {
      setImages((old) => old.filter((image) => image.uuid !== uuid));
      setImagesWithError((old) => {
        const image = images.find((image) => image.uuid === uuid);
        if (!image) {
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
    downloadManager.remove(uuid);
    setImages((old) => old.filter((image) => image.uuid !== uuid));
  }, [downloadManager]);

  const onClear = useCallback(() => {
    downloadManager.removeAll();
    onClearErrors();
    setImages([]);
  }, [downloadManager, onClearErrors]);

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
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onError,
      onClearErrors,
      isRendering,
      setIsRendering,
      downloadManager,
    }),
    [
      images,
      imagesWithError,
      onClear,
      onRemove,
      onAdd,
      onError,
      onClearErrors,
      isRendering,
      setIsRendering,
      downloadManager,
    ]
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
