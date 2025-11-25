import { nanoid } from "nanoid";
import {
  ComponentProps,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { getQueryDataForImage } from "~/queries/images";

import { useImageDownloadManager } from "./ImageDownloadManager";
import {
  DownloadableImage,
  getIsGoogleImage,
  GoogleImageData,
  Image,
  ImagesContext,
  LocalImage,
  LocalImageData,
  ScryfallImageData,
} from "./ImagesContext";
import { SettingsContext } from "./SettingsContext";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">,
) => {
  const { settings } = useContext(SettingsContext);

  const googleDownloadManager = useImageDownloadManager();
  const scryfallDownloadManager = useImageDownloadManager({
    maxInflight: Infinity,
    upscale: settings.upscaleScryfallImages,
  });
  const localDownloadManager = useImageDownloadManager({
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
      const queryData = getQueryDataForImage(image, settings);
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
    [googleDownloadManager, scryfallDownloadManager, onError, settings],
  );

  const loadLocalImage = useCallback(
    async (image: LocalImage) => {
      const queryData = getQueryDataForImage(image, settings);
      await localDownloadManager.add({
        uuid: image.uuid,
        queryData,
      });
    },
    [localDownloadManager, settings],
  );

  const onAdd = useCallback(
    (
      data: (LocalImageData | GoogleImageData | ScryfallImageData)[],
      index?: number,
    ) => {
      setImages((old) => {
        const images = data.map((item) => {
          const uuid = nanoid();
          const newItem = { ...item, uuid };
          if ("file" in newItem) {
            void loadLocalImage(newItem);
            return newItem;
          }

          void downloadImage(newItem);

          return newItem;
        });
        if (index === undefined) {
          return old.concat(images);
        }

        return old.toSpliced(index, 0, ...images);
      });
    },
    [loadLocalImage, downloadImage],
  );

  const onReorder = useCallback((imagesToMove: Image[], newIndex: number) => {
    setImages((old) => {
      // Find the indices of all images to move
      const indicesToMove = imagesToMove
        .map((img) => old.findIndex((image) => image.uuid === img.uuid))
        .filter((index) => index !== -1)
        .sort((a, b) => a - b);

      if (
        indicesToMove.length === 0 ||
        newIndex < 0 ||
        newIndex >= old.length
      ) {
        return old;
      }

      const updated = [...old];

      // Remove all images to move (in reverse order to maintain indices)
      const movedImages: Image[] = [];
      for (let i = indicesToMove.length - 1; i >= 0; i--) {
        const [removed] = updated.splice(indicesToMove[i], 1);
        movedImages.unshift(removed);
      }

      // Insert all moved images at the new position
      updated.splice(newIndex, 0, ...movedImages);

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
