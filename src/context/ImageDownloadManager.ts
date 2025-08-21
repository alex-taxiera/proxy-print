import { useCallback, useRef, useState } from "react";

import { toaster } from "../utils/toaster";

type Item = {
  uuid: string;
  uri: string;
  postProcess?: (data: Blob, mimeType: string) => Promise<Blob>;
  resolve: (value: { mimeType: string; url: string }) => void;
  reject: (reason?: unknown) => void;
};

export function getMpcImageUri(id: string) {
  return `https://script.google.com/macros/s/AKfycbw8laScKBfxda2Wb0g63gkYDBdy8NWNxINoC4xDOwnCQ3JMFdruam1MdmNmN4wI5k4/exec?id=${id}`;
}

/**
 * Converts a Base64 string to a Blob.
 * @param base64String - The Base64 string of the image.
 * @param contentType - The MIME type of the image (e.g., "image/jpeg", "image/png").
 * @returns The resulting Blob object.
 */
function base64ToBlob(base64String: string, contentType: string): Blob {
  // Decode the Base64 string
  const byteCharacters = atob(base64String);

  // Convert the decoded string into an array of bytes
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  // Create a Uint8Array from the byte numbers
  const byteArray = new Uint8Array(byteNumbers);

  // Create and return the Blob
  return new Blob([byteArray], { type: contentType });
}

async function fetchImage(
  { uri, postProcess }: Item,
  init?: RequestInit,
): Promise<{ data: Blob; mimeType: string }> {
  // FIXME: this signal doesn't work because script.google.com redirects to script.googleusercontent.com
  const response = await fetch(uri, init);
  // read headers and parse correctly
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("image/")) {
    const data = await response.blob();
    if (postProcess) {
      const processed = await postProcess(data, contentType);
      return { data: processed, mimeType: contentType };
    }
    return { data, mimeType: contentType };
  }

  const text = await response.text();
  let mimeType = "image/png";

  // Check for JPEG signature (base64 starts with /9j/ for JFIF)
  if (text.startsWith("/9j/")) {
    mimeType = "image/jpeg";
  }
  // Check for WebP signature (UklGRiI)
  else if (text.startsWith("UklGRiI")) {
    mimeType = "image/webp";
  }
  const data = base64ToBlob(text, mimeType);

  if (postProcess) {
    const processed = await postProcess(data, mimeType);
    return { data: processed, mimeType };
  }

  return { data, mimeType };
}

export function useImageDownloadManager({
  maxInflight = 20,
  toastTitle = "Downloading images",
  toastDescription,
  postProcess,
}: {
  maxInflight?: number;
  toastTitle?: string;
  toastDescription?: string;
  postProcess?: (data: Blob, mimeType: string) => Promise<Blob>;
} = {}) {
  const queueRef = useRef<Item[]>([]);
  const inflightRef = useRef<Item[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const imageCacheRef = useRef<Map<string, { url: string; mimeType: string }>>(
    new Map(),
  );

  const loadingToastId = useRef<string>();
  const [isFetching, setIsFetching] = useState(false);

  const raiseToast = useCallback(() => {
    if (!loadingToastId.current) {
      loadingToastId.current = toaster.create({
        title: toastTitle,
        description: toastDescription,
        duration: Infinity,
        closable: false,
        meta: {
          progress: null,
          totalProgressAmount:
            queueRef.current.length +
            inflightRef.current.length +
            imageCacheRef.current.size,
        },
      });
    } else {
      toaster.update(loadingToastId.current, {
        meta: {
          progress: imageCacheRef.current.size,
          totalProgressAmount:
            queueRef.current.length +
            inflightRef.current.length +
            imageCacheRef.current.size,
        },
      });
    }
  }, [toastDescription, toastTitle]);

  const processQueue = useCallback(() => {
    while (
      inflightRef.current.length < maxInflight &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      inflightRef.current.push(item);
      raiseToast();
      setIsFetching((oldIsFetching) => oldIsFetching || true);
      const abortController = abortControllersRef.current.get(item.uuid);

      fetchImage(item, { signal: abortController?.signal })
        .then(({ data, mimeType }) => {
          const url = URL.createObjectURL(data);
          imageCacheRef.current.set(item.uuid, { url, mimeType });
          item.resolve({ mimeType, url });
        })
        .catch((error) => {
          item.reject(error);
        })
        .finally(() => {
          raiseToast();
          abortControllersRef.current.delete(item.uuid);
          inflightRef.current = inflightRef.current.filter((i) => i !== item);
          if (
            inflightRef.current.length < maxInflight &&
            queueRef.current.length > 0
          ) {
            processQueue();
          } else if (
            inflightRef.current.length === 0 &&
            queueRef.current.length === 0
          ) {
            if (loadingToastId.current) {
              toaster.remove(loadingToastId.current);
              loadingToastId.current = undefined;
            }
            setIsFetching(false);
          }
        });
    }
  }, [maxInflight, raiseToast]);

  const add = useCallback(
    ({
      uuid,
      uri,
    }: Pick<Item, "uuid" | "uri" | "postProcess">): Promise<{
      mimeType: string;
      url: string;
    }> => {
      return new Promise((resolve, reject) => {
        if (imageCacheRef.current.has(uuid)) {
          // resolve with cached image
          resolve(imageCacheRef.current.get(uuid)!);
          return;
        }

        // check if inflight or queue contains the id
        // combine resolve and reject with the existing item
        const existingItem =
          inflightRef.current.find((i) => i.uuid === uuid) ||
          queueRef.current.find((i) => i.uuid === uuid);
        if (existingItem) {
          const originalResolve = existingItem.resolve;
          const originalReject = existingItem.reject;
          existingItem.resolve = (value) => {
            originalResolve(value);
            resolve(value);
          };
          existingItem.reject = (reason) => {
            originalReject(reason);
            reject(reason as Error);
          };
          return;
        }

        const abortController = new AbortController();
        abortControllersRef.current.set(uuid, abortController);
        queueRef.current.push({ uuid, uri, resolve, reject, postProcess });
        if (inflightRef.current.length < maxInflight) {
          processQueue();
        }
      });
    },
    [maxInflight, postProcess, processQueue],
  );

  /**
   * Remove a download from the queue
   * @param id The id of the download to remove
   * @remarks If the download is inflight, it cannot be aborted, so it will continue to completion
   * @remarks If the download is in the queue, it will be removed
   * @remarks If the download is cached, it will be remain
   */
  const remove = useCallback((id: string) => {
    const queueItem = queueRef.current.find((i) => i.uuid === id);
    if (queueItem) {
      queueRef.current = queueRef.current.filter((i) => i.uuid !== id);
    }
  }, []);

  /**
   * Remove all downloads from the queue
   * @remarks Downloads that are inflight or cached will remain
   * @remarks Downloads that are in the queue will be removed
   */
  const removeAll = useCallback(() => {
    queueRef.current = [];
  }, []);

  const getCachedImage = useCallback(
    (id: string) => imageCacheRef.current.get(id)?.url,
    [],
  );

  return {
    isFetching,
    getCachedImage,
    add,
    remove,
    removeAll,
  };
}
