/**
 * Throttling utility for Scryfall API calls
 * Ensures a minimum 100ms delay between API requests to comply with rate limits
 */
export class ScryfallClient {
  private lastCallTime = 0;
  private readonly throttleDelay = 100; // 100ms delay between calls

  /**
   * Performs a throttled fetch request to Scryfall API
   * @param url - The URL to fetch from
   * @param options - Fetch options (method, body, headers, etc.)
   * @returns Promise<Response> - The fetch response
   */
  async throttledFetch(url: string, options?: RequestInit): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.throttleDelay) {
      const delay = this.throttleDelay - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastCallTime = Date.now();
    return fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });
  }

  /**
   * Performs a throttled GET request to Scryfall API
   * @param url - The URL to fetch from
   * @param options - Additional fetch options
   * @returns Promise<Response> - The fetch response
   */
  async get(
    url: string,
    options?: Omit<RequestInit, "method">,
  ): Promise<Response> {
    return this.throttledFetch(url, { ...options, method: "GET" });
  }

  /**
   * Performs a throttled POST request to Scryfall API
   * @param url - The URL to fetch from
   * @param body - The request body
   * @param options - Additional fetch options
   * @returns Promise<Response> - The fetch response
   */
  async post(
    url: string,
    body: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ): Promise<Response> {
    return this.throttledFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }
}

// Global instance to ensure consistent throttling across all Scryfall API calls
export const scryfallClient = new ScryfallClient();
