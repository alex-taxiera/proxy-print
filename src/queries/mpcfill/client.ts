import * as Sentry from "@sentry/react";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

import { MpcFillCardType } from "./normalize-query";

/**
 * A client for the MPC Autofill backend API (https://github.com/chilli-axe/mpc-autofill).
 *
 * Desktop only: the API sends no CORS headers for app origins, so requests go
 * through the `mpcfill_request` command in src-tauri/src/mpcfill.rs rather
 * than the webview's fetch. That command only reaches the endpoints named
 * here.
 */
type MpcFillEndpoint =
  | "sources"
  | "searchEngineHealth"
  | "editorSearchV3"
  | "editorSearchV2"
  | "cards";

export class MpcFillRequestError extends Error {
  /** The HTTP status, when the server answered at all. */
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "MpcFillRequestError";
    this.status = status;
  }
}

const CommandErrorSchema = z.object({
  status: z.number().nullable().optional(),
  message: z.string(),
});

// The official clients space their calls out; do the same.
const MIN_REQUEST_SPACING_MS = 100;
let lastRequestAt = 0;
let requestQueue: Promise<unknown> = Promise.resolve();

const request = (
  serverUrl: string,
  endpoint: MpcFillEndpoint,
  body?: unknown,
): Promise<unknown> => {
  const run = async () => {
    const wait = lastRequestAt + MIN_REQUEST_SPACING_MS - Date.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();

    return Sentry.startSpan(
      {
        name: `mpcfill ${endpoint}`,
        op: "http.client",
        attributes: { "mpcfill.endpoint": endpoint },
      },
      async () => {
        try {
          return await invoke<unknown>("mpcfill_request", {
            baseUrl: serverUrl,
            endpoint,
            body,
          });
        } catch (error) {
          const parsed = CommandErrorSchema.safeParse(error);
          if (parsed.success) {
            throw new MpcFillRequestError(
              parsed.data.message,
              parsed.data.status ?? null,
            );
          }
          throw new MpcFillRequestError(
            typeof error === "string" ? error : "The MPCFill request failed.",
          );
        }
      },
    );
  };

  const result = requestQueue.then(run);
  requestQueue = result.catch(() => undefined);
  return result;
};

const parseResponse = <T>(schema: z.ZodType<T>, raw: unknown): T => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new MpcFillRequestError(
      "The server's reply wasn't in the format MPC Autofill uses.",
    );
  }
  return parsed.data;
};

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

const SourceSchema = z.object({
  pk: z.number(),
  name: z.string(),
  sourceType: z.string().optional(),
});

export type MpcFillSource = z.infer<typeof SourceSchema>;

const SourcesResponseSchema = z.object({
  results: z.record(z.string(), SourceSchema),
});

export const parseSourcesResponse = (raw: unknown): MpcFillSource[] =>
  Object.values(parseResponse(SourcesResponseSchema, raw).results);

const SOURCES_TTL_MS = 60 * 60 * 1000;
const sourcesByServer = new Map<
  string,
  { fetchedAt: number; sources: Promise<MpcFillSource[]> }
>();

/**
 * A server's image sources. Every search has to list them, and they rarely
 * change, so they are fetched once an hour per server.
 */
export const getMpcFillSources = (
  serverUrl: string,
): Promise<MpcFillSource[]> => {
  const cached = sourcesByServer.get(serverUrl);
  if (cached && Date.now() - cached.fetchedAt < SOURCES_TTL_MS) {
    return cached.sources;
  }

  const sources = request(serverUrl, "sources").then(parseSourcesResponse);
  sourcesByServer.set(serverUrl, { fetchedAt: Date.now(), sources });
  sources.catch(() => {
    if (sourcesByServer.get(serverUrl)?.sources === sources) {
      sourcesByServer.delete(serverUrl);
    }
  });
  return sources;
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type MpcFillSearchOptions = {
  /** Match every word anywhere in the name rather than the whole name. */
  fuzzySearch: boolean;
  /** Limit results to one source, or null for all of them. */
  sourceId: number | null;
};

/**
 * The settings object every search carries. Sources are listed in the
 * server's order, which is also the order results come back in; one that is
 * missing or disabled is left out of the search.
 */
export const buildSearchSettings = (
  sources: MpcFillSource[],
  { fuzzySearch, sourceId }: MpcFillSearchOptions,
) => ({
  searchTypeSettings: { fuzzySearch, filterCardbacks: false },
  sourceSettings: {
    sources: sources.map(
      (source) =>
        [source.pk, sourceId === null || source.pk === sourceId] as const,
    ),
  },
  filterSettings: {
    minimumDPI: 0,
    maximumDPI: 1500,
    // Megabytes.
    maximumSize: 30,
    languages: [],
    includesTags: [],
    excludesTags: ["NSFW"],
  },
});

const SEARCH_KEY = "q";

const SearchV3ResponseSchema = z.object({
  results: z.record(z.string(), z.array(z.string())),
});

const SearchV2ResponseSchema = z.object({
  results: z.record(z.string(), z.record(z.string(), z.array(z.string()))),
});

export const parseSearchV3Response = (raw: unknown): string[] =>
  parseResponse(SearchV3ResponseSchema, raw).results[SEARCH_KEY] ?? [];

/** The legacy endpoint keys its reply by the query string it was sent. */
export const parseSearchV2Response = (
  raw: unknown,
  query: string,
  cardType: MpcFillCardType,
): string[] => {
  const { results } = parseResponse(SearchV2ResponseSchema, raw);
  const byType =
    results[query] ??
    // One query in, so one entry out, whatever the server keyed it by.
    (Object.keys(results).length === 1 ? Object.values(results)[0] : undefined);
  return byType?.[cardType] ?? [];
};

/** Servers that answered 404 to `/3/editorSearch/`, so we stop asking. */
const serversWithoutV3 = new Set<string>();

/**
 * Finds every image for a card name, as identifiers in the server's ranking
 * (source order, then the source's own priority). `query` must already be
 * normalised with `normalizeMpcFillQuery`.
 *
 * The public mpcfill.com runs a build older than the repository and only has
 * the legacy `/2/` search, so `/3/` is tried first and dropped on a 404 — the
 * same fallback the official frontend uses.
 */
export const searchMpcFill = async (
  serverUrl: string,
  query: string,
  cardType: MpcFillCardType,
  options: MpcFillSearchOptions,
): Promise<string[]> => {
  const sources = await getMpcFillSources(serverUrl);
  const searchSettings = buildSearchSettings(sources, options);

  if (!serversWithoutV3.has(serverUrl)) {
    try {
      return parseSearchV3Response(
        await request(serverUrl, "editorSearchV3", {
          queries: { [SEARCH_KEY]: { query, cardType } },
          searchSettings,
        }),
      );
    } catch (error) {
      if (!(error instanceof MpcFillRequestError) || error.status !== 404) {
        throw error;
      }
      serversWithoutV3.add(serverUrl);
    }
  }

  return parseSearchV2Response(
    await request(serverUrl, "editorSearchV2", {
      queries: [{ query, cardType }],
      searchSettings,
    }),
    query,
    cardType,
  );
};

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

const CardSchema = z.object({
  /** The Google Drive file id, for Google Drive sources. */
  identifier: z.string(),
  name: z.string(),
  extension: z.string().default("png"),
  searchq: z.string().default(""),
  sourceName: z.string().default(""),
  sourceType: z.string().default("Google Drive"),
  dpi: z.number().optional(),
  smallThumbnailUrl: z.string().optional(),
});

export type MpcFillCard = z.infer<typeof CardSchema>;

const CardsResponseSchema = z.object({
  results: z.record(z.string(), z.unknown()),
});

/** The most identifiers `/2/cards/` accepts in one request. */
export const MPCFILL_CARDS_MAX_PER_REQUEST = 1000;

/**
 * Cards in the order of `identifiers`. The server answers with a map and
 * silently leaves out ids it doesn't know; a card we can't read is skipped
 * rather than failing the whole page.
 */
export const parseCardsResponse = (
  raw: unknown,
  identifiers: string[],
): MpcFillCard[] => {
  const { results } = parseResponse(CardsResponseSchema, raw);
  return identifiers.flatMap((identifier) => {
    const parsed = CardSchema.safeParse(results[identifier]);
    return parsed.success ? [parsed.data] : [];
  });
};

export const getMpcFillCards = async (
  serverUrl: string,
  identifiers: string[],
): Promise<MpcFillCard[]> => {
  if (identifiers.length === 0) {
    return [];
  }
  if (identifiers.length > MPCFILL_CARDS_MAX_PER_REQUEST) {
    throw new MpcFillRequestError("Too many cards requested at once.");
  }
  return parseCardsResponse(
    await request(serverUrl, "cards", { cardIdentifiers: identifiers }),
    identifiers,
  );
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

const HealthResponseSchema = z.object({ online: z.boolean() });

/**
 * Confirms a URL is a working MPC Autofill backend, the way the official
 * frontend validates one. Throws with a reason if it isn't.
 */
export const checkMpcFillServer = async (serverUrl: string): Promise<void> => {
  const { online } = parseResponse(
    HealthResponseSchema,
    await request(serverUrl, "searchEngineHealth"),
  );
  if (!online) {
    throw new MpcFillRequestError("That server's search engine is offline.");
  }
};

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const getIsMpcFillCardDownloadable = (card: MpcFillCard) =>
  card.sourceType === "Google Drive";

/**
 * Thumbnail URLs to try in order. The first two are the image bucket and
 * worker mpcfill.com itself serves thumbnails from; they are deployment
 * details rather than a documented contract, so the URL the backend reports
 * (a Google Drive thumbnail link) is the fallback.
 */
export const getMpcFillThumbnailUris = (card: MpcFillCard): string[] => {
  const id = encodeURIComponent(card.identifier);
  const uris = getIsMpcFillCardDownloadable(card)
    ? [
        `https://img.mpcautofill.com/${id}-small-google_drive`,
        `https://cdn.mpcautofill.com/images/google_drive/small/${id}.jpg`,
      ]
    : [];
  if (card.smallThumbnailUrl?.startsWith("https://")) {
    uris.push(card.smallThumbnailUrl);
  }
  return uris;
};
