import type { ScryfallCard, ScryfallError } from "@scryfall/api-types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { scryfallClient } from "./scryfallClient";

const SCRYFALL_API_URL = "https://api.scryfall.com";

export const getScryfallQueryKey = () => ["scryfall"] as const;

export const getScryfallCardsQueryKey = () =>
  [...getScryfallQueryKey(), "cards"] as const;

export const getScryfallCardsCollectionQueryKey = () =>
  [...getScryfallCardsQueryKey(), "collection"] as const;

export type ScryfallCardsCollectionIdentifier = {
  name: string;
  collector_number?: string;
  set?: string;
};

export type UseScryfallCardsCollectionOptions = Omit<
  UseMutationOptions<
    Map<ScryfallCardsCollectionIdentifier, ScryfallCard.Any>,
    ScryfallError,
    ScryfallCardsCollectionIdentifier[]
  >,
  "mutationKey" | "mutationFn"
>;

export const useScryfallCardsCollection = (
  options?: UseScryfallCardsCollectionOptions,
) => {
  return useMutation<
    Map<ScryfallCardsCollectionIdentifier, ScryfallCard.Any>,
    ScryfallError,
    ScryfallCardsCollectionIdentifier[]
  >({
    ...options,
    mutationKey: getScryfallCardsCollectionQueryKey(),
    mutationFn: async (identifiers: ScryfallCardsCollectionIdentifier[]) => {
      const results = (await scryfallClient
        .post(`${SCRYFALL_API_URL}/cards/collection`, { identifiers })
        .then((res) => res.json())) as {
        not_found: ScryfallCardsCollectionIdentifier[];
        data: ScryfallCard.Any[];
      };

      const map = new Map<
        ScryfallCardsCollectionIdentifier,
        ScryfallCard.Any
      >();
      let resultIndex = 0;
      for (let i = 0; i < identifiers.length; i++) {
        // check if it was not found
        const isFound = !results.not_found.some(
          (item) => JSON.stringify(item) === JSON.stringify(identifiers[i]),
        );

        if (isFound) {
          const card = results.data[resultIndex];
          map.set(identifiers[i], card);
          resultIndex++;
        }
      }

      return map;
    },
  });
};
