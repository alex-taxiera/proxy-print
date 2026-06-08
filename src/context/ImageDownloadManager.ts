import { FetchQueryOptions, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import { ImageQueryData } from "@/queries/images";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { addBleedEdge } from "@/utils/add-bleed";

type Item = {
  uuid: string;
  queryData: FetchQueryOptions<ImageQueryData>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

export function useImageDownloadManager({
  maxInflight = 20,
  upscale,
  cardWidth,
  cardHeight,
  trackProgress = true,
}: {
  maxInflight?: number;
  upscale?: boolean;
  cardWidth?: number;
  cardHeight?: number;
  trackProgress?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const queueRef = useRef<Item[]>([]);
  const inflightRef = useRef<Item[]>([]);
  const { upscaleImage } = useUpscaleImage();

  const processQueue = () => {
    while (
      inflightRef.current.length < maxInflight &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      inflightRef.current.push(item);

      const queryData = upscale
        ? {
            ...item.queryData,
            queryFn: async (...args: unknown[]) => {
              if (typeof item.queryData.queryFn === "function") {
                const result = await item.queryData.queryFn(
                  ...(args as Parameters<typeof item.queryData.queryFn>),
                );
                if (!("original" in result)) {
                  return result;
                }
                const upscaledOriginal = await upscaleImage(result.original);
                let data: Blob;
                if (result.hasBleed && cardWidth && cardHeight) {
                  data = await addBleedEdge(
                    upscaledOriginal,
                    result.mimeType,
                    cardWidth,
                    cardHeight,
                  );
                } else {
                  data = upscaledOriginal;
                }
                return {
                  ...result,
                  data,
                  upscaledOriginal,
                  isUpscaled: true,
                };
              }

              throw new Error("Query function is not a function");
            },
          }
        : item.queryData;

      queryClient
        .fetchQuery(queryData)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          if (trackProgress) useDownloadProgressStore.getState().finish();
          inflightRef.current = inflightRef.current.filter((i) => i !== item);
          if (
            inflightRef.current.length < maxInflight &&
            queueRef.current.length > 0
          ) {
            processQueue();
          }
        });
    }
  };

  const add = ({
    uuid,
    queryData,
  }: Pick<Item, "uuid" | "queryData">): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (trackProgress) useDownloadProgressStore.getState().start();
      queueRef.current.push({ uuid, queryData, resolve, reject });
      if (inflightRef.current.length < maxInflight) {
        processQueue();
      }
    });
  };

  /**
   * Remove a download from the queue
   * @param id The id of the download to remove
   * @remarks If the download is inflight, it cannot be aborted, so it will continue to completion
   * @remarks If the download is in the queue, it will be removed
   */
  const remove = (uuid: string) => {
    const queueItem = queueRef.current.find((i) => i.uuid === uuid);
    if (queueItem) {
      queueRef.current = queueRef.current.filter((i) => i.uuid !== uuid);
      if (trackProgress) useDownloadProgressStore.getState().finish();
    }
  };

  /**
   * Remove all downloads from the queue
   * @remarks Downloads that are inflight will remain
   * @remarks Downloads that are in the queue will be removed
   */
  const removeAll = () => {
    const removedCount = queueRef.current.length;
    queueRef.current = [];
    if (trackProgress && removedCount > 0) {
      const store = useDownloadProgressStore.getState();
      for (let i = 0; i < removedCount; i++) store.finish();
    }
  };

  return {
    add,
    remove,
    removeAll,
  };
}
