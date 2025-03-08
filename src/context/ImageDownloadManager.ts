type Item = {
  id: string;
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
};

export class ImageDownloadManager {
  private queue: Item[] = [];
  private inflight: Item[] = [];
  private abortControllers = new Map<string, AbortController>();

  constructor(private maxInflight = 20) {}

  public get queueLength() {
    return this.queue.length;
  }

  public fetch(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      this.abortControllers.set(id, abortController);
      this.queue.push({ id, resolve, reject });
      if (this.inflight.length < this.maxInflight) {
        this.processQueue();
      }
    });
  }

  public remove(id: string) {
    const item = this.inflight.find((i) => i.id === id);
    if (item) {
      const abortController = this.abortControllers.get(id);
      abortController?.abort();
      this.inflight = this.inflight.filter((i) => i !== item);
    } else {
      this.queue = this.queue.filter((i) => i.id !== id);
    }
  }

  public removeAll() {
    this.queue = [];
    this.inflight.forEach((item) => {
      this.abortControllers.get(item.id)?.abort();
    });
    this.inflight = [];
  }

  private processQueue() {
    while (this.inflight.length < this.maxInflight && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.inflight.push(item);
      this.fetchImage(item)
        .then((data) => {
          item.resolve(data);
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
    const response = await fetch(`${url}?${params}`, { signal: abortController?.signal });
    return await response.text();
  }
}
