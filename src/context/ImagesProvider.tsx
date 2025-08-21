import { nanoid } from "nanoid";
import { ComponentProps, useCallback, useMemo, useState } from "react";

import { addBleedEdge } from "../utils/add-bleed";
import {
  getMpcImageUri,
  useImageDownloadManager,
} from "./ImageDownloadManager";
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
  const googleDownloadManager = useImageDownloadManager({
    toastTitle: "Downloading images from MPC Autofill",
    toastDescription: "This may take a while...",
  });
  const scryfallDownloadManager = useImageDownloadManager({
    toastTitle: "Downloading images from Scryfall",
    toastDescription: "This should be quick.",
    maxInflight: Infinity,
    postProcess: addBleedEdge,
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

  const onClear = useCallback(() => {
    googleDownloadManager.removeAll();
    scryfallDownloadManager.removeAll();
    onClearErrors();
    setImages([]);
  }, [googleDownloadManager, scryfallDownloadManager, onClearErrors]);

  const downloadImage = useCallback(
    async (image: DownloadableImage) => {
      const isGoogleImage = getIsGoogleImage(image);
      const uri = isGoogleImage ? getMpcImageUri(image.id) : image.uri;
      try {
        const { mimeType, url } = await (isGoogleImage
          ? googleDownloadManager.add({ uuid: image.uuid, uri })
          : scryfallDownloadManager.add({ uuid: image.uuid, uri }));
        setImages((old) =>
          old.map((image) =>
            image.uuid === image.uuid
              ? ({ ...image, mimeType, url } as Image)
              : image,
          ),
        );
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

  const isFetching = useMemo(() => {
    return (
      googleDownloadManager.isFetching || scryfallDownloadManager.isFetching
    );
  }, [googleDownloadManager, scryfallDownloadManager]);

  const getCachedImage = useCallback(
    (uuid: string) => {
      return (
        googleDownloadManager.getCachedImage(uuid) ||
        scryfallDownloadManager.getCachedImage(uuid)
      );
    },
    [googleDownloadManager, scryfallDownloadManager],
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
      getCachedImage,
      onReorder,
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
      getCachedImage,
      onReorder,
    ],
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
