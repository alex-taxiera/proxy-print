import { useCallback, useRef, useState } from "react";

import { toaster } from "../utils/toaster";

type Item = {
  id: string;
  resolve: (value: { mimeType: string; url: string }) => void;
  reject: (reason?: unknown) => void;
};

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

async function fetchImage({ id }: Item, init?: RequestInit): Promise<string> {
  const url =
    "https://script.google.com/macros/s/AKfycbw8laScKBfxda2Wb0g63gkYDBdy8NWNxINoC4xDOwnCQ3JMFdruam1MdmNmN4wI5k4/exec";
  const params = new URLSearchParams({ id });
  // FIXME: this signal doesn't work because script.google.com redirects to script.googleusercontent.com
  const response = await fetch(`${url}?${params}`, init);
  return await response.text();
}

export function useImageDownloadManager({
  maxInflight = 20,
}: {
  maxInflight?: number;
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
        title: "Downloading images from MPC Autofill",
        description: "This may take a while...",
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
  }, [loadingToastId]);

  const processQueue = useCallback(() => {
    while (
      inflightRef.current.length < maxInflight &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      inflightRef.current.push(item);
      raiseToast();
      setIsFetching((oldIsFetching) => oldIsFetching || true);
      const abortController = abortControllersRef.current.get(item.id);
      fetchImage(item, { signal: abortController?.signal })
        .then((data) => {
          let mimeType = "image/png";

          // Check for JPEG signature (base64 starts with /9j/ for JFIF)
          if (data.startsWith("/9j/")) {
            mimeType = "image/jpeg";
          }
          // Check for WebP signature (UklGRiI)
          else if (data.startsWith("UklGRiI")) {
            mimeType = "image/webp";
          }
          const blob = base64ToBlob(data, mimeType);
          const url = URL.createObjectURL(blob);
          imageCacheRef.current.set(item.id, { url, mimeType });
          item.resolve({ mimeType, url });
        })
        .catch((error) => {
          item.reject(error);
        })
        .finally(() => {
          raiseToast();
          abortControllersRef.current.delete(item.id);
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
    (id: string): Promise<{ mimeType: string; url: string }> => {
      return new Promise((resolve, reject) => {
        if (imageCacheRef.current.has(id)) {
          // resolve with cached image
          resolve(imageCacheRef.current.get(id)!);
          return;
        }

        // check if inflight or queue contains the id
        // combine resolve and reject with the existing item
        const existingItem =
          inflightRef.current.find((i) => i.id === id) ||
          queueRef.current.find((i) => i.id === id);
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
        abortControllersRef.current.set(id, abortController);
        queueRef.current.push({ id, resolve, reject });
        if (inflightRef.current.length < maxInflight) {
          processQueue();
        }
      });
    },
    [maxInflight, processQueue],
  );

  /**
   * Remove a download from the queue
   * @param id The id of the download to remove
   * @remarks If the download is inflight, it cannot be aborted, so it will continue to completion
   * @remarks If the download is in the queue, it will be removed
   * @remarks If the download is cached, it will be remain
   */
  const remove = useCallback((id: string) => {
    const queueItem = queueRef.current.find((i) => i.id === id);
    if (queueItem) {
      queueRef.current = queueRef.current.filter((i) => i.id !== id);
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
