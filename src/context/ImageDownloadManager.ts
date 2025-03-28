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
function base64ToBlob(base64String: string, contentType: string = 'image/jpeg'): Blob {
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

export class ImageDownloadManager {
  private queue: Item[] = [];
  private inflight: Item[] = [];
  private abortControllers = new Map<string, AbortController>();
  private imageCache = new Map<string, string>();

  constructor(private maxInflight = 20) {}

  public getCachedImage(id: string) {
    return this.imageCache.get(id);
  }

  public get queueLength() {
    return this.queue.length;
  }

  public fetch(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(id)) {
        // resolve with cached image
        resolve();
        return;
      }

      // check if inflight or queue contains the id
      // combine resolve and reject with the existing item
      const existingItem =
        this.inflight.find((i) => i.id === id) ||
        this.queue.find((i) => i.id === id);
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
      this.abortControllers.set(id, abortController);
      this.queue.push({ id, resolve, reject });
      if (this.inflight.length < this.maxInflight) {
        this.processQueue();
      }
    });
  }

  /**
   * Remove a download from the queue
   * @param id The id of the download to remove
   * @remarks If the download is inflight, it cannot be aborted, so it will continue to completion
   * @remarks If the download is in the queue, it will be removed
   * @remarks If the download is cached, it will be remain
   */
  public remove(id: string) {
    const queue = this.queue.find((i) => i.id === id);
    if (queue) {
      this.queue = this.queue.filter((i) => i.id !== id);
    }
  }

  /**
   * Remove all downloads from the queue
   * @remarks Downloads that are inflight or cached will remain
   * @remarks Downloads that are in the queue will be removed
   */
  public removeAll() {
    this.queue = [];
  }

  private processQueue() {
    while (this.inflight.length < this.maxInflight && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.inflight.push(item);
      this.fetchImage(item)
        .then((data) => {
          const blob = base64ToBlob(data);
          const url = URL.createObjectURL(blob);
          this.imageCache.set(item.id, url);
          item.resolve();
        })
        .catch((error) => {
          item.reject(error);
        })
        .finally(() => {
          this.abortControllers.delete(item.id);
          this.inflight = this.inflight.filter((i) => i !== item);
          if (
            this.inflight.length < this.maxInflight &&
            this.queue.length > 0
          ) {
            this.processQueue();
          }
        });
    }
  }

  private async fetchImage({ id }: Item): Promise<string> {
    const abortController = this.abortControllers.get(id);
    const url =
      "https://script.google.com/macros/s/AKfycbw8laScKBfxda2Wb0g63gkYDBdy8NWNxINoC4xDOwnCQ3JMFdruam1MdmNmN4wI5k4/exec";
    const params = new URLSearchParams({ id });
    // FIXME: this signal doesn't work because script.google.com redirects to script.googleusercontent.com
    const response = await fetch(`${url}?${params}`, {
      signal: abortController?.signal,
    });
    return await response.text();
  }
}
