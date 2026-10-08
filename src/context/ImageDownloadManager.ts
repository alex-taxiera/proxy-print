import {
  FetchQueryOptions,
  QueryKey,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";

import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import { ImageQueryData } from "@/queries/images";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { renderCardImage } from "@/utils/card-image";
import { UpscaleMethod } from "@/utils/upscale-methods";

type Item = {
  uuid: string;
  queryData: FetchQueryOptions<ImageQueryData>;
  /**
   * Also bring an already-cached image in line with `upscaleMethod`. Cached
   * images never refetch, so without this a re-import ignores the setting.
   */
  upscaleCached?: boolean;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

export function useImageDownloadManager({
  maxInflight = 20,
  upscaleMethod,
  cardWidth,
  cardHeight,
  trackProgress = true,
}: {
  maxInflight?: number;
  upscaleMethod?: UpscaleMethod;
  cardWidth?: number;
  cardHeight?: number;
  trackProgress?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const queueRef = useRef<Item[]>([]);
  const inflightRef = useRef<Item[]>([]);
  const pendingUpscalesRef = useRef(new Map<string, Promise<void>>());
  const { upscaleImage } = useUpscaleImage();

  const upscaleQueryData = async <
    T extends Extract<ImageQueryData, { original: Blob }>,
  >(
    result: T,
    method: UpscaleMethod,
  ): Promise<T> => {
    const upscaledOriginal = await upscaleImage(result.original, method);
    const data =
      cardWidth && cardHeight
        ? await renderCardImage(
            upscaledOriginal,
            result.mimeType,
            cardWidth,
            cardHeight,
            {
              hasBleed: result.hasBleed,
              hasDarkenedEdges: result.hasDarkenedEdges,
            },
          )
        : upscaledOriginal;
    return {
      ...result,
      data,
      upscaledOriginal,
      isUpscaled: true,
      upscaleMethod: method,
    };
  };

  const upscaleCachedImage = (queryKey: QueryKey, method: UpscaleMethod) => {
    const pendingKey = JSON.stringify([queryKey, method]);
    const pending = pendingUpscalesRef.current.get(pendingKey);
    if (pending) {
      return pending;
    }

    const cached = queryClient.getQueryData<ImageQueryData>(queryKey);
    if (
      !cached ||
      !("original" in cached) ||
      (cached.isUpscaled && (cached.upscaleMethod ?? "anime-fast") === method)
    ) {
      return Promise.resolve();
    }

    queryClient.setQueryData<ImageQueryData>(queryKey, () => ({
      ...cached,
      isProcessing: true,
    }));
    const promise = upscaleQueryData(cached, method)
      .then((next) => {
        queryClient.setQueryData<ImageQueryData>(queryKey, next);
      })
      .catch((error: unknown) => {
        // The image itself loaded fine; keep it and just drop the spinner.
        queryClient.setQueryData<ImageQueryData>(queryKey, cached);
        console.error("Upscale failed for cached image", queryKey, error);
      })
      .finally(() => {
        pendingUpscalesRef.current.delete(pendingKey);
      });
    pendingUpscalesRef.current.set(pendingKey, promise);
    return promise;
  };

  const processQueue = () => {
    while (
      inflightRef.current.length < maxInflight &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      inflightRef.current.push(item);

      const queryData = upscaleMethod
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
                return upscaleQueryData(result, upscaleMethod);
              }

              throw new Error("Query function is not a function");
            },
          }
        : item.queryData;

      queryClient
        .fetchQuery(queryData)
        .then(() =>
          upscaleMethod && item.upscaleCached
            ? upscaleCachedImage(item.queryData.queryKey, upscaleMethod)
            : undefined,
        )
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
    upscaleCached,
  }: Pick<Item, "uuid" | "queryData" | "upscaleCached">): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (trackProgress) useDownloadProgressStore.getState().start();
      queueRef.current.push({
        uuid,
        queryData,
        upscaleCached,
        resolve,
        reject,
      });
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
