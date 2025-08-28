import { nanoid } from "nanoid";
import { ComponentProps, useCallback, useMemo, useState } from "react";

import { getQueryDataForImage } from "../queries/images";
import { useImageDownloadManager } from "./ImageDownloadManager";
import {
  DownloadableImage,
  getIsGoogleImage,
  GoogleImageData,
  Image,
  ImagesContext,
  ScryfallImageData,
} from "./ImagesContext";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">,
) => {
  const googleDownloadManager = useImageDownloadManager();
  const scryfallDownloadManager = useImageDownloadManager({
    maxInflight: Infinity,
  });

  const [images, setImages] = useState<Image[]>([]);
  const [imagesWithError, setImagesWithError] = useState<DownloadableImage[]>(
    [],
  );
  const [isRendering, setIsRendering] = useState(false);

  const onError = useCallback((image: DownloadableImage) => {
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

  const onRemove = useCallback(
    (uuid: string) => {
      googleDownloadManager.remove(uuid);
      scryfallDownloadManager.remove(uuid);
      setImages((old) => old.filter((image) => image.uuid !== uuid));
    },
    [googleDownloadManager, scryfallDownloadManager],
  );

  const onClear = useCallback(
    (uuids?: string[]) => {
      if (uuids) {
        setImages((old) => old.filter((image) => !uuids.includes(image.uuid)));
        for (const uuid of uuids) {
          googleDownloadManager.remove(uuid);
          scryfallDownloadManager.remove(uuid);
        }
      } else {
        googleDownloadManager.removeAll();
        scryfallDownloadManager.removeAll();
        onClearErrors();
        setImages([]);
      }
    },
    [googleDownloadManager, scryfallDownloadManager, onClearErrors],
  );

  const downloadImage = useCallback(
    async (image: DownloadableImage) => {
      const isGoogleImage = getIsGoogleImage(image);
      const queryData = getQueryDataForImage(image);
      try {
        if (isGoogleImage) {
          await googleDownloadManager.add({ uuid: image.uuid, queryData });
        } else {
          await scryfallDownloadManager.add({ uuid: image.uuid, queryData });
        }
      } catch {
        onError(image);
      }
    },
    [googleDownloadManager, scryfallDownloadManager, onError],
  );

  const onAdd = useCallback(
    (data: (File | GoogleImageData | ScryfallImageData)[], index?: number) => {
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

  const onReorder = useCallback((imageUuid: string, newIndex: number) => {
    setImages((old) => {
      const currentIndex = old.findIndex((image) => image.uuid === imageUuid);
      if (currentIndex === -1 || newIndex < 0 || newIndex >= old.length) {
        return old;
      }
      const updated = [...old];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  }, []);

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
      onReorder,
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
      onReorder,
    ],
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
