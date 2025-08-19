import { ScryfallCard } from "@scryfall/api-types";
import { nanoid } from "nanoid";
import { useCallback } from "react";

import { DownloadableImage, ScryfallImageData } from "../context/ImagesContext";
import {
  ScryfallCardsCollectionIdentifier,
  useScryfallCardsCollection,
} from "../queries/useScryfallCardsCollection";
import { parseDecklist } from "../utils/parseDecklist";

/**
 * Converts a decklist string to Scryfall card image data
 */
export const useGetCardsForDecklist = () => {
  const { mutateAsync: getCards } = useScryfallCardsCollection();

  return useCallback(
    async (decklist: string) => {
      const parsed = parseDecklist(decklist);

      // Log any parsing errors
      if (parsed.errors.length > 0) {
        console.warn("Parsing errors:", parsed.errors);
      }

      const identifiers = parsed.cards.map((card) => ({
        name: card.name,
        set: card.setCode,
        collector_number: card.cardNumber,
      }));

      const quantityMap = new Map<ScryfallCardsCollectionIdentifier, number>();
      for (let i = 0; i < parsed.cards.length; i++) {
        const card = parsed.cards[i];
        const identifier = identifiers[i];
        quantityMap.set(identifier, card.quantity);
      }

      // split cards into chunks of 75 cards
      const chunks = [];
      for (let i = 0; i < identifiers.length; i += 75) {
        chunks.push(identifiers.slice(i, i + 75));
      }

      const maps = await Promise.all(chunks.map((chunk) => getCards(chunk)));

      const cards = new Map(maps.flatMap((map) => Array.from(map)));

      const errors: DownloadableImage[] = [];

      // duplicate entries that have more than one quantity
      const fullList: ScryfallCard.Any[] = [];
      const retryList: ScryfallCardsCollectionIdentifier[] = [];
      for (const identifier of identifiers) {
        const card = cards.get(identifier);
        if (card) {
          fullList.push(
            ...Array.from(
              { length: quantityMap.get(identifier) ?? 0 },
              () => card,
            ),
          );
        } else if (identifier.collector_number || identifier.set) {
          retryList.push(identifier);
        } else {
          errors.push({
            uuid: nanoid(),
            uri: "",
            id: [identifier.set, identifier.collector_number]
              .filter(Boolean)
              .join(" "),
            name: identifier.name,
          });
        }
      }

      if (retryList.length > 0) {
        // try various identifiers for each, linking back to the original identifier
        const retryIdentifierMap = new Map<
          ScryfallCardsCollectionIdentifier,
          ScryfallCardsCollectionIdentifier[]
        >();

        for (let i = 0; i < retryList.length; i++) {
          const identifier = retryList[i];
          const newIdentifiers: ScryfallCardsCollectionIdentifier[] = [];

          if (identifier.collector_number) {
            const collectorNumberIdentifier = {
              name: identifier.name,
              collector_number: identifier.collector_number,
            };
            newIdentifiers.push(collectorNumberIdentifier);
          }

          newIdentifiers.push({ name: identifier.name });
          retryIdentifierMap.set(identifier, newIdentifiers);
        }

        const expandedIdentifiers = Array.from(
          retryIdentifierMap.values(),
        ).flat();

        // chunk into 75 at a time
        const chunks = [];
        for (let i = 0; i < expandedIdentifiers.length; i += 75) {
          chunks.push(expandedIdentifiers.slice(i, i + 75));
        }

        const retryMaps = await Promise.all(
          chunks.map((chunk) => getCards(chunk)),
        );

        const retryCards = new Map(retryMaps.flatMap((map) => Array.from(map)));

        for (const [
          identifier,
          retryIdentifiers,
        ] of retryIdentifierMap.entries()) {
          const cards = retryIdentifiers
            .map((identifier) => retryCards.get(identifier))
            .filter((card): card is ScryfallCard.Any => card !== undefined);
          if (cards.length > 0) {
            fullList.push(
              ...Array.from(
                { length: quantityMap.get(identifier) ?? 0 },
                () => cards[0],
              ),
            );
          } else {
            errors.push({
              uuid: nanoid(),
              uri: "",
              id: [identifier.set, identifier.collector_number]
                .filter(Boolean)
                .join(" "),
              name: identifier.name,
            });
          }
        }
      }

      const items = fullList
        .flatMap((card) => {
          if ("image_uris" in card) {
            return {
              uri: card?.image_uris?.png,
              name: card?.name,
            };
          } else if ("card_faces" in card) {
            return card.card_faces.map((face) => {
              if ("image_uris" in face) {
                return {
                  uri: face.image_uris?.png,
                  name: face.name,
                };
              }
            });
          }
        })
        .filter((c): c is ScryfallImageData => c !== undefined);

      return { items, errors };
    },
    [getCards],
  );
};
