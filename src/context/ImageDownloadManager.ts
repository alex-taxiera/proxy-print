import { useCallback, useRef, useState } from "react";

type Item = {
  id: string;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

/**
 * Converts a Base64 string to a Blob.
 * @param base64String - The Base64 string of the image.
 * @param contentType - The MIME type of the image (e.g., "image/jpeg", "image/png").
 * @returns The resulting Blob object.
 */
function base64ToBlob(
  base64String: string,
  contentType: string = "image/jpeg"
): Blob {
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
  const imageCacheRef = useRef<Map<string, string>>(new Map());

  const [isFetching, setIsFetching] = useState(false);

  const processQueue = useCallback(() => {
    while (
      inflightRef.current.length < maxInflight &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift()!;
      inflightRef.current.push(item);
      setIsFetching((oldIsFetching) => oldIsFetching || true);
      const abortController = abortControllersRef.current.get(item.id);
      fetchImage(item, { signal: abortController?.signal })
        .then((data) => {
          const blob = base64ToBlob(data);
          const url = URL.createObjectURL(blob);
          imageCacheRef.current.set(item.id, url);
          item.resolve();
        })
        .catch((error) => {
          item.reject(error);
        })
        .finally(() => {
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
            setIsFetching(false);
          }
        });
    }
  }, [maxInflight]);

  const add = useCallback(
    (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (imageCacheRef.current.has(id)) {
          // resolve with cached image
          resolve();
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
          existingItem.resolve = () => {
            originalResolve();
            resolve();
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
    [maxInflight, processQueue]
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
    (id: string) => imageCacheRef.current.get(id),
    []
  );

  return {
    isFetching,
    getCachedImage,
    add,
    remove,
    removeAll,
  };
}
