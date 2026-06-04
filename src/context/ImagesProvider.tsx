import { nanoid } from "nanoid";
import { ComponentProps, useEffect, useState } from "react";

import { getQueryDataForImage } from "~/queries/images";
import { useSettingsStore } from "~/store/settingsStore";

import { useImageDownloadManager } from "./ImageDownloadManager";
import {
  CardSlot,
  DownloadableImage,
  getFronts,
  getSortedSlots,
  getIsGoogleImage,
  GoogleImageData,
  Image,
  ImagesContext,
  LocalImage,
  LocalImageData,
  ScryfallImageData,
  SlotInputData,
} from "./ImagesContext";
import { getIsLocalImage } from "./ImagesContext";

const normalizeSlots = (slots: CardSlot[]) => {
  return slots.map((slot, index) => ({ ...slot, position: index }));
};

const toSlotMap = (slots: CardSlot[]) => {
  return new Map(slots.map((slot) => [slot.id, slot]));
};

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">,
) => {
  const settings = useSettingsStore((s) => s.settings);

  const googleDownloadManager = useImageDownloadManager();
  const scryfallDownloadManager = useImageDownloadManager({
    maxInflight: Infinity,
    upscale: settings.upscaleScryfallImages,
    cardWidth: Number(settings.cardWidth),
    cardHeight: Number(settings.cardHeight),
  });
  const localDownloadManager = useImageDownloadManager({
    maxInflight: Infinity,
    trackProgress: false,
  });

  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);

  const [slots, setSlots] = useState<Map<string, CardSlot>>(new Map());
  const [imagesWithError, setImagesWithError] = useState<DownloadableImage[]>(
    [],
  );
  const [isRendering, setIsRendering] = useState(false);

  const sortedSlots = getSortedSlots(slots);
  const images = getFronts(slots);

  const onError = (image: DownloadableImage) => {
    const uuid = image.uuid;
    setSlots((old) => {
      const next = getSortedSlots(old)
        .filter((slot) => slot.id !== uuid)
        .map((slot, index) => ({ ...slot, position: index }));
      return toSlotMap(next);
    });
    setImagesWithError((old) => {
      const existingError = old.find((image) => image.uuid === uuid);
      if (existingError) {
        return old;
      }

      return old.concat(image);
    });
  };

  const onClearErrors = () => {
    setImagesWithError([]);
  };

  const onRemove = (uuid: string) => {
    googleDownloadManager.remove(uuid);
    scryfallDownloadManager.remove(uuid);
    localDownloadManager.remove(uuid);
    setSlots((old) => {
      const next = getSortedSlots(old)
        .filter((slot) => slot.id !== uuid)
        .map((slot, index) => ({ ...slot, position: index }));
      return toSlotMap(next);
    });
  };

  const onClear = (uuids?: string[]) => {
    if (uuids) {
      setSlots((old) => {
        const toRemove = new Set(uuids);
        const next = getSortedSlots(old)
          .filter((slot) => !toRemove.has(slot.id))
          .map((slot, index) => ({ ...slot, position: index }));
        return toSlotMap(next);
      });
      for (const uuid of uuids) {
        googleDownloadManager.remove(uuid);
        scryfallDownloadManager.remove(uuid);
        localDownloadManager.remove(uuid);
      }
    } else {
      googleDownloadManager.removeAll();
      scryfallDownloadManager.removeAll();
      localDownloadManager.removeAll();
      onClearErrors();
      setSlots(new Map());
    }
  };

  const downloadImage = async (image: DownloadableImage) => {
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
  };

  const loadLocalImage = async (image: LocalImage) => {
    const queryData = getQueryDataForImage(image, settings);
    await localDownloadManager.add({
      uuid: image.uuid,
      queryData,
    });
  };

  // When defaultCardBack changes to a local file, load it into the query cache
  // so the preview grid can display it without waiting for onAddSlots.
  useEffect(() => {
    if (!defaultCardBack || !("file" in defaultCardBack)) return;
    const cbImage = {
      ...defaultCardBack,
      uuid: "default-card-back",
    } as LocalImage;
    const queryData = getQueryDataForImage(
      cbImage,
      useSettingsStore.getState().settings,
    );
    void localDownloadManager.add({ uuid: cbImage.uuid, queryData });
    // localDownloadManager is intentionally omitted — its add() always uses the
    // same stable internal refs regardless of which render's closure we hold.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCardBack]);

  const onAddSlots = (data: SlotInputData[], index?: number) => {
    // Pre-generate all slot objects (pure, no side effects).
    const newSlots: CardSlot[] = data.map((item) => {
      const slotId = nanoid();
      const front = item.front
        ? ({ ...item.front, uuid: slotId } as Image)
        : null;
      const back = item.back
        ? ({ ...item.back, uuid: `${slotId}:back` } as Image)
        : null;
      return { id: slotId, front, back, position: 0 } satisfies CardSlot;
    });

    // Trigger all downloads OUTSIDE the state updater. React may invoke state
    // updater functions more than once (StrictMode / Concurrent features), so
    // side effects must never live inside them.
    const currentCardBack = useSettingsStore.getState().defaultCardBack;
    if (currentCardBack && newSlots.length > 0) {
      const cbImage = {
        ...currentCardBack,
        uuid: "default-card-back",
      } as Image;
      if (getIsLocalImage(cbImage)) void loadLocalImage(cbImage as LocalImage);
      else void downloadImage(cbImage as DownloadableImage);
    }
    for (const slot of newSlots) {
      if (slot.front) {
        if ("file" in slot.front) void loadLocalImage(slot.front as LocalImage);
        else void downloadImage(slot.front as DownloadableImage);
      }
      if (slot.back) {
        if ("file" in slot.back) void loadLocalImage(slot.back as LocalImage);
        else void downloadImage(slot.back as DownloadableImage);
      }
    }

    // Pure state update — no side effects.
    setSlots((old) => {
      const oldSlots = getSortedSlots(old);
      if (index === undefined) {
        return toSlotMap(normalizeSlots(oldSlots.concat(newSlots)));
      }
      const insertAt = Math.max(0, Math.min(index, oldSlots.length));
      const updated = oldSlots.toSpliced(insertAt, 0, ...newSlots);
      return toSlotMap(normalizeSlots(updated));
    });
  };

  const onAdd = (
    data: (LocalImageData | GoogleImageData | ScryfallImageData)[],
    index?: number,
  ) => {
    onAddSlots(
      data.map((item) => ({
        front: item,
        back: null,
      })),
      index,
    );
  };

  const onAddBack = (
    slotId: string,
    data: LocalImageData | GoogleImageData | ScryfallImageData,
  ) => {
    // Trigger the download outside the state updater to avoid side effects
    // inside a potentially re-invoked updater function.
    const backUuid = `${slotId}:back`;
    const back: Image = { ...data, uuid: backUuid };
    if ("file" in back) {
      void loadLocalImage(back);
    } else {
      void downloadImage(back);
    }

    setSlots((old) => {
      const currentSlot = old.get(slotId);
      if (!currentSlot) {
        return old;
      }
      const next = new Map(old);
      next.set(slotId, { ...currentSlot, back });
      return next;
    });
  };

  const onRemoveBack = (slotId: string) => {
    setSlots((old) => {
      const currentSlot = old.get(slotId);
      if (!currentSlot?.back) {
        return old;
      }

      googleDownloadManager.remove(currentSlot.back.uuid);
      scryfallDownloadManager.remove(currentSlot.back.uuid);
      localDownloadManager.remove(currentSlot.back.uuid);

      const next = new Map(old);
      next.set(slotId, {
        ...currentSlot,
        back: null,
      });
      return next;
    });
  };

  const onInsertEmptySlot = (position: number) => {
    setSlots((old) => {
      const oldSlots = getSortedSlots(old);
      const newSlot: CardSlot = {
        id: nanoid(),
        front: null,
        back: null,
        position: 0,
      };

      const insertAt = Math.max(0, Math.min(position, oldSlots.length));
      const updated = oldSlots.toSpliced(insertAt, 0, newSlot);
      return toSlotMap(normalizeSlots(updated));
    });
  };

  const onReorderSlots = (slotIds: string[], newPosition: number) => {
    setSlots((old) => {
      const sorted = getSortedSlots(old);
      const idsToMove = new Set(slotIds);
      const moved = sorted.filter((slot) => idsToMove.has(slot.id));

      if (
        moved.length === 0 ||
        newPosition < 0 ||
        newPosition >= sorted.length
      ) {
        return old;
      }

      const remaining = sorted.filter((slot) => !idsToMove.has(slot.id));
      const insertAt = Math.max(0, Math.min(newPosition, remaining.length));
      const updated = remaining.toSpliced(insertAt, 0, ...moved);
      return toSlotMap(normalizeSlots(updated));
    });
  };

  const onReorder = (imagesToMove: Image[], newIndex: number) => {
    onReorderSlots(
      imagesToMove.map((image) => image.uuid),
      newIndex,
    );
  };

  const onMoveSlotToAbsoluteIndex = (
    slotIds: string[],
    targetAbsoluteIndex: number,
  ) => {
    setSlots((old) => {
      const sorted = getSortedSlots(old);
      const idsToMove = new Set(slotIds);
      const moved = sorted.filter((slot) => idsToMove.has(slot.id));

      if (moved.length === 0 || targetAbsoluteIndex < 0) return old;

      const remaining = sorted.filter((slot) => !idsToMove.has(slot.id));
      // How many empty filler slots we need to insert before the moved slots
      const gapCount = Math.max(0, targetAbsoluteIndex - remaining.length);
      const insertAt = targetAbsoluteIndex - gapCount;
      const emptySlots: CardSlot[] = Array.from({ length: gapCount }, () => ({
        id: nanoid(),
        front: null,
        back: null,
        position: 0,
      }));
      const updated = [
        ...remaining.slice(0, insertAt),
        ...emptySlots,
        ...moved,
        ...remaining.slice(insertAt),
      ];
      return toSlotMap(normalizeSlots(updated));
    });
  };

  const contextValue = {
    slots,
    sortedSlots,
    images,
    imagesWithError,
    onClear,
    onRemove,
    onAdd,
    onAddSlots,
    onAddBack,
    onRemoveBack,
    onInsertEmptySlot,
    onError,
    onClearErrors,
    isRendering,
    setIsRendering,
    onReorderSlots,
    onReorder,
    onMoveSlotToAbsoluteIndex,
  };

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
