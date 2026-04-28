import { FetchQueryOptions, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { useUpscaleImage } from "~/hooks/useUpscaleImage";
import { ImageQueryData } from "~/queries/images";
import { useDownloadProgressStore } from "~/store/downloadProgressStore";

type Item = {
  uuid: string;
  queryData: FetchQueryOptions<ImageQueryData>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

export function useImageDownloadManager({
  maxInflight = 20,
  upscale,
}: {
  maxInflight?: number;
  upscale?: boolean;
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
                const data = await item.queryData.queryFn(
                  ...(args as Parameters<typeof item.queryData.queryFn>),
                );
                const upscaled = await upscaleImage(data.data);
                return {
                  ...data,
                  data: upscaled,
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
          useDownloadProgressStore.getState().finish();
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
      // Record the download as pending before it hits the queue so the
      // progress store is always incremented synchronously on add().
      useDownloadProgressStore.getState().start();
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
      useDownloadProgressStore.getState().finish();
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
    if (removedCount > 0) {
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
