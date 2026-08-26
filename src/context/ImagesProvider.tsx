import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { ComponentProps, useEffect, useMemo, useState } from "react";

import {
  ImageQueryData,
  getIsDownloadableImageCacheEvent,
  getQueryDataForImage,
  getQueryKeyForImageData,
} from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import {
  hydrateImageQueryData,
  persistImageQueryData,
  removeImageQueryData,
} from "@/utils/imageQueryCache";

import { useImageDownloadManager } from "./ImageDownloadManager";
import {
  CardSlot,
  DownloadableImage,
  getFronts,
  getSortedSlots,
  getIsGoogleImage,
  GoogleImageData,
  Image,
  ImageData,
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
  const queryClient = useQueryClient();
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
  const storeProjects = useSettingsStore((s) => s.projects);
  const activeProjectName = useSettingsStore((s) => s.activeProjectName);
  const storeSaveProject = useSettingsStore((s) => s.saveProject);
  const storeDeleteProject = useSettingsStore((s) => s.deleteProject);
  const storeSetActiveProjectName = useSettingsStore(
    (s) => s.setActiveProjectName,
  );
  const [slots, setSlots] = useState<Map<string, CardSlot>>(new Map());
  const [imagesWithError, setImagesWithError] = useState<DownloadableImage[]>(
    [],
  );
  const [isRendering, setIsRendering] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [savedCacheSizes, setSavedCacheSizes] = useState<Map<string, number>>(
    new Map(),
  );
  const [isLoadingProject, setIsLoadingProject] = useState(false);

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
      const front = item.front ? { ...item.front, uuid: slotId } : null;
      const back = item.back ? { ...item.back, uuid: `${slotId}:back` } : null;
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
      };
      if (getIsLocalImage(cbImage)) void loadLocalImage(cbImage);
      else void downloadImage(cbImage);
    }
    for (const slot of newSlots) {
      if (slot.front) {
        if ("file" in slot.front) void loadLocalImage(slot.front);
        else void downloadImage(slot.front);
      }
      if (slot.back) {
        if ("file" in slot.back) void loadLocalImage(slot.back);
        else void downloadImage(slot.back);
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

  const onAddBackToSlots = (
    slotIds: string[],
    data: LocalImageData | GoogleImageData | ScryfallImageData,
  ) => {
    // Trigger downloads outside the state updater to avoid side effects
    // inside a potentially re-invoked updater function.
    const backsBySlotId = new Map<string, Image>();
    for (const slotId of slotIds) {
      const back: Image = { ...data, uuid: `${slotId}:back` };
      backsBySlotId.set(slotId, back);
      if ("file" in back) {
        void loadLocalImage(back);
      } else {
        void downloadImage(back);
      }
    }

    setSlots((old) => {
      const next = new Map(old);
      for (const [slotId, back] of backsBySlotId) {
        const currentSlot = next.get(slotId);
        if (!currentSlot) continue;
        next.set(slotId, { ...currentSlot, back });
      }
      return next;
    });
  };

  const onReplaceScryfallPrinting = async (
    slotId: string,
    data: { front: ScryfallImageData; back: ScryfallImageData | null },
  ) => {
    const currentSlot = slots.get(slotId);
    if (!currentSlot?.front || !("uri" in currentSlot.front)) {
      throw new Error("Only Scryfall card printings can be replaced.");
    }

    const front: Image = { ...data.front, uuid: currentSlot.front.uuid };
    const back =
      data.back === null
        ? currentSlot.back
        : ({ ...data.back, uuid: `${slotId}:back` } satisfies Image);

    const downloads = [
      scryfallDownloadManager.add({
        uuid: front.uuid,
        queryData: getQueryDataForImage(front, settings),
      }),
    ];
    if (data.back) {
      downloads.push(
        scryfallDownloadManager.add({
          uuid: back!.uuid,
          queryData: getQueryDataForImage(back!, settings),
        }),
      );
    }

    await Promise.all(downloads);

    setSlots((old) => {
      const slot = old.get(slotId);
      if (!slot) {
        return old;
      }

      const next = new Map(old);
      next.set(slotId, { ...slot, front, back });
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

  const onRemoveBackFromSlots = (slotIds: string[]) => {
    setSlots((old) => {
      const next = new Map(old);
      for (const slotId of slotIds) {
        const currentSlot = next.get(slotId);
        if (!currentSlot?.back) continue;

        googleDownloadManager.remove(currentSlot.back.uuid);
        scryfallDownloadManager.remove(currentSlot.back.uuid);
        localDownloadManager.remove(currentSlot.back.uuid);

        next.set(slotId, { ...currentSlot, back: null });
      }
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

  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (getIsDownloadableImageCacheEvent(event)) {
        setCacheVersion((v) => v + 1);
      }
    });
  }, [queryClient]);

  const imageKey = (img: ImageData | null): string => {
    if (!img) return "";
    if ("id" in img) return `g:${img.id}`;
    if ("uri" in img) return `s:${img.uri}`;
    return `l:${img.hash}`;
  };

  const isProjectDirty = useMemo(() => {
    const current = getSortedSlots(slots);
    if (current.length === 0 && !activeProjectName) return false;
    if (!activeProjectName) return current.length > 0;
    const saved = storeProjects[activeProjectName];
    if (!saved) return false;
    if (current.length !== saved.slots.length) return true;
    return current.some((slot, i) => {
      const s = saved.slots[i];
      if (
        imageKey(slot.front) !== imageKey(s.front) ||
        imageKey(slot.back) !== imageKey(s.back)
      )
        return true;
      for (const img of [slot.front, slot.back]) {
        if (!img) continue;
        const qk = JSON.stringify(getQueryKeyForImageData(img));
        const savedSize = savedCacheSizes.get(qk);
        if (savedSize === undefined) continue;
        const currentSize = queryClient.getQueryData<ImageQueryData>(
          getQueryKeyForImageData(img),
        )?.data.size;
        if (currentSize !== savedSize) return true;
      }
      return false;
    });
    // imageKey is a stable inline function — safe to omit from deps
    // cacheVersion is an intentional trigger: queryClient.getQueryData() reads
    // live cache data that changes without touching React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slots,
    activeProjectName,
    storeProjects,
    cacheVersion,
    savedCacheSizes,
    queryClient,
  ]);

  useEffect(() => {
    if (!isProjectDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isProjectDirty]);

  const saveProject = async (name: string) => {
    const currentSlots = getSortedSlots(slots);
    const projectSlots: SlotInputData[] = currentSlots.map((slot) => ({
      front: slot.front,
      back: slot.back,
    }));
    const sizes = new Map<string, number>();
    for (const slot of currentSlots) {
      for (const image of [slot.front, slot.back]) {
        if (!image) continue;
        const queryKey = getQueryKeyForImageData(image);
        const cached = queryClient.getQueryData<ImageQueryData>(queryKey);
        if (cached) {
          await persistImageQueryData(queryKey, cached);
          sizes.set(JSON.stringify(queryKey), cached.data.size);
        }
      }
    }
    setSavedCacheSizes(sizes);
    storeSaveProject(name, projectSlots);
  };

  const loadProject = async (name: string) => {
    const project = storeProjects[name];
    if (!project) return;
    setIsLoadingProject(true);
    try {
      const images = project.slots
        .flatMap((slot) => [slot.front, slot.back])
        .filter((image): image is NonNullable<typeof image> => image !== null);
      const results = await Promise.all(
        images.map(async (image) => {
          const queryKey = getQueryKeyForImageData(image);
          const cached = await hydrateImageQueryData(queryKey);
          return cached ? { queryKey, cached } : null;
        }),
      );
      const sizes = new Map<string, number>();
      for (const result of results) {
        if (!result) continue;
        queryClient.setQueryData(result.queryKey, result.cached);
        sizes.set(JSON.stringify(result.queryKey), result.cached.data.size);
      }
      setSavedCacheSizes(sizes);
      onClear();
      onAddSlots(project.slots);
      storeSetActiveProjectName(name);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const deleteProject = (name: string) => {
    const project = storeProjects[name];
    if (project) {
      const remainingKeys = new Set(
        Object.entries(storeProjects)
          .filter(([k]) => k !== name)
          .flatMap(([, p]) =>
            p.slots.flatMap((s) =>
              [s.front, s.back]
                .filter(Boolean)
                .map((img) => JSON.stringify(getQueryKeyForImageData(img!))),
            ),
          ),
      );
      for (const slot of project.slots) {
        for (const image of [slot.front, slot.back]) {
          if (!image) continue;
          const qk = getQueryKeyForImageData(image);
          if (!remainingKeys.has(JSON.stringify(qk))) {
            void removeImageQueryData(qk);
          }
        }
      }
    }
    storeDeleteProject(name);
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
    onAddBackToSlots,
    onReplaceScryfallPrinting,
    onRemoveBack,
    onRemoveBackFromSlots,
    onInsertEmptySlot,
    onError,
    onClearErrors,
    isRendering,
    setIsRendering,
    onReorderSlots,
    onReorder,
    onMoveSlotToAbsoluteIndex,
    projects: storeProjects,
    activeProjectName,
    isProjectDirty,
    isLoadingProject,
    saveProject,
    loadProject,
    deleteProject,
  };

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
