import type { ScryfallCard } from "@scryfall/api-types";
import { useInfiniteQuery } from "@tanstack/react-query";

import { scryfallClient } from "./scryfallClient";
import { getScryfallCardsQueryKey } from "./useScryfallCardsCollection";

const SCRYFALL_API_URL = "https://api.scryfall.com";

type ScryfallPrintingsPage = {
  data: ScryfallCard.Any[];
  has_more: boolean;
  next_page?: string;
};

export const getScryfallPrintingsQueryKey = (name: string) =>
  [...getScryfallCardsQueryKey(), "printings", name] as const;

export const getScryfallPrintingsUrl = (name: string) =>
  `${SCRYFALL_API_URL}/cards/search?${new URLSearchParams({
    q: `!"${name}"`,
    unique: "prints",
    order: "released",
    dir: "desc",
    include_multilingual: "true",
  })}`;

const getPrintingsPage = async (
  url: string,
): Promise<ScryfallPrintingsPage> => {
  const response = await scryfallClient.get(url);

  if (!response.ok) {
    throw new Error(`Unable to load card printings (${response.status})`);
  }

  return (await response.json()) as ScryfallPrintingsPage;
};

export const useScryfallPrintings = (name: string) =>
  useInfiniteQuery({
    queryKey: getScryfallPrintingsQueryKey(name),
    queryFn: ({ pageParam }) => getPrintingsPage(pageParam),
    initialPageParam: getScryfallPrintingsUrl(name),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_page : undefined,
    enabled: name.length > 0,
    staleTime: "static",
  });
