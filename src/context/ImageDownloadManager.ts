type Item = {
  id: string;
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
};

export class ImageDownloadManager {
  private queue: Item[] = [];
  private inflight: Item[] = [];

  constructor(private maxInflight = 20) {}

  public get queueLength() {
    return this.queue.length;
  }

  public fetch(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    while (this.inflight.length < this.maxInflight && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.inflight.push(item);
      this.fetchImage(item.id)
        .then((data) => {
          item.resolve(data);
        })
        .catch((error) => {
          item.reject(error);
        })
        .finally(() => {
          this.inflight = this.inflight.filter((i) => i !== item);
          this.processQueue();
        });
    }
  }

  private async fetchImage(id: string): Promise<string> {
    const url =
      "https://script.google.com/macros/s/AKfycbw8laScKBfxda2Wb0g63gkYDBdy8NWNxINoC4xDOwnCQ3JMFdruam1MdmNmN4wI5k4/exec";
    const params = new URLSearchParams({ id });

    const response = await fetch(`${url}?${params}`);
    return await response.text();
  }
}
