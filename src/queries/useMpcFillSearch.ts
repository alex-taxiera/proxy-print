import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getMpcFillCards,
  getMpcFillSources,
  searchMpcFill,
} from "./mpcfill/client";
import { MpcFillCardType } from "./mpcfill/normalize-query";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/** How many results the swap dialog loads card details for at a time. */
export const MPCFILL_CARDS_PAGE_SIZE = 60;

export const getMpcFillQueryKey = (serverUrl: string) =>
  ["mpcfill", serverUrl] as const;

export const useMpcFillSources = (serverUrl: string, enabled: boolean) =>
  useQuery({
    queryKey: [...getMpcFillQueryKey(serverUrl), "sources"],
    queryFn: () => getMpcFillSources(serverUrl),
    enabled,
    staleTime: ONE_HOUR,
  });

export type MpcFillSearchParams = {
  /** Already normalised with `normalizeMpcFillQuery`. */
  query: string;
  cardType: MpcFillCardType;
  fuzzySearch: boolean;
  sourceId: number | null;
};

/** The identifiers of every image matching a card name, best first. */
export const useMpcFillSearch = (
  serverUrl: string,
  { query, cardType, fuzzySearch, sourceId }: MpcFillSearchParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: [
      ...getMpcFillQueryKey(serverUrl),
      "search",
      { query, cardType, fuzzySearch, sourceId },
    ],
    queryFn: () =>
      searchMpcFill(serverUrl, query, cardType, { fuzzySearch, sourceId }),
    enabled: enabled && query.length > 0,
    staleTime: FIVE_MINUTES,
  });

/**
 * Card details for a search's identifiers, a page at a time. A popular card
 * has hundreds of images, and each page is a grid of thumbnails to load.
 */
export const useMpcFillCards = (serverUrl: string, identifiers: string[]) =>
  useInfiniteQuery({
    queryKey: [...getMpcFillQueryKey(serverUrl), "cards", identifiers],
    queryFn: ({ pageParam }) =>
      getMpcFillCards(
        serverUrl,
        identifiers.slice(pageParam, pageParam + MPCFILL_CARDS_PAGE_SIZE),
      ),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
      lastPageParam + MPCFILL_CARDS_PAGE_SIZE < identifiers.length
        ? lastPageParam + MPCFILL_CARDS_PAGE_SIZE
        : undefined,
    enabled: identifiers.length > 0,
    staleTime: FIVE_MINUTES,
  });
