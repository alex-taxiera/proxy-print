type Item = {
  id: string;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

function convertAndCompressBase64ToJpeg(base64String: string, outputQuality = 1) {
  return new Promise<Blob>((resolve, reject) => {
    // Create an Image element
    const img = new Image();
    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      ctx!.drawImage(img, 0, 0);

      // Convert the canvas to a JPEG Blob with the specified quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob); // Return the Blob
          } else {
            reject(new Error('Failed to create JPEG Blob'));
          }
        },
        'image/jpeg',
        outputQuality // Compression quality (0.0 - 1.0)
      );
    };

    img.onerror = (err) => reject(err);

    // Set the image source to the base64 string
    img.src = `data:image/png;base64,${base64String}`;
  });
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

  public remove(id: string) {
    const inflight = this.inflight.find((i) => i.id === id);
    if (inflight) {
      const abortController = this.abortControllers.get(id);
      abortController?.abort();
      this.inflight = this.inflight.filter((i) => i !== inflight);
    }
    const queue = this.queue.find((i) => i.id === id);
    if (queue) {
      this.queue = this.queue.filter((i) => i.id !== id);
    }

    const item = this.imageCache.get(id);
    if (item) {
      URL.revokeObjectURL(item);
      this.imageCache.delete(id);
    }
  }

  public removeAll() {
    this.queue = [];
    this.inflight.forEach((item) => {
      this.abortControllers.get(item.id)?.abort();
    });
    this.inflight = [];
    this.imageCache.forEach((url) => URL.revokeObjectURL(url));
    this.imageCache.clear();
  }

  private processQueue() {
    while (this.inflight.length < this.maxInflight && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.inflight.push(item);
      this.fetchImage(item)
        .then(async (data) => {
          const blob = await convertAndCompressBase64ToJpeg(data);
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
