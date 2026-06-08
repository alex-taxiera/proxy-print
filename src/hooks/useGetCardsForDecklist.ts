import { ScryfallCard } from "@scryfall/api-types";
import { nanoid } from "nanoid";

import { DownloadableImage, ScryfallImageData } from "@/context/ImagesContext";
import {
  ScryfallCardsCollectionIdentifier,
  useScryfallCardsCollection,
} from "@/queries/useScryfallCardsCollection";
import { parseDecklist } from "@/utils/parse-decklist";

/**
 * Converts a decklist string to Scryfall card image data
 */
export const useGetCardsForDecklist = () => {
  const { mutateAsync: getCards } = useScryfallCardsCollection();

  return async (decklist: string) => {
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

    const exactIdentifiers = identifiers.map((identifier) =>
      "collector_number" in identifier && identifier.collector_number != null
        ? {
            set: identifier.set,
            collector_number: identifier.collector_number,
          }
        : {
            name: identifier.name,
            set: identifier.set,
          },
    ) as ScryfallCardsCollectionIdentifier[];

    // split cards into chunks of 75 cards
    const chunks = [];
    for (let i = 0; i < exactIdentifiers.length; i += 75) {
      chunks.push(exactIdentifiers.slice(i, i + 75));
    }

    const maps = await Promise.all(chunks.map((chunk) => getCards(chunk)));

    const cards = new Map(maps.flatMap((map) => Array.from(map)));

    const errors: DownloadableImage[] = [];

    // duplicate entries that have more than one quantity
    const fullList: ScryfallCard.Any[] = [];
    const retryList: typeof identifiers = [];
    for (let i = 0; i < exactIdentifiers.length; i++) {
      const fullIdentifier = identifiers[i];
      const identifier = exactIdentifiers[i];
      const card = cards.get(identifier);

      if (card) {
        fullList.push(
          ...Array.from(
            { length: quantityMap.get(fullIdentifier) ?? 0 },
            () => card,
          ),
        );
      } else if ("collector_number" in identifier || identifier.set) {
        retryList.push(fullIdentifier);
      } else {
        errors.push({
          uuid: nanoid(),
          uri: "",
          id: identifier.set,
          name: identifier.name,
        });
      }
    }

    if (retryList.length > 0) {
      // try various identifiers for each, linking back to the original identifier
      const retryIdentifierMap = new Map<
        (typeof identifiers)[number],
        ScryfallCardsCollectionIdentifier[]
      >();

      for (let i = 0; i < retryList.length; i++) {
        const identifier = retryList[i];
        const newIdentifiers: ScryfallCardsCollectionIdentifier[] = [];

        if (identifier.collector_number != null) {
          const setIdentifier = {
            name: identifier.name,
            set: identifier.set,
          };
          newIdentifiers.push(setIdentifier);
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
            id: [
              identifier.set,
              "collector_number" in identifier
                ? identifier.collector_number
                : undefined,
            ]
              .filter(Boolean)
              .join(" "),
            name: identifier.name ?? "",
          });
        }
      }
    }

    const slotItems = fullList
      .map((card) => {
        if ("image_uris" in card) {
          return {
            front: {
              uri: card?.image_uris?.png,
              name: card?.name,
            },
            back: null,
          };
        }

        if ("card_faces" in card) {
          const [frontFace, backFace] = card.card_faces;
          const front =
            frontFace && "image_uris" in frontFace
              ? {
                  uri: frontFace.image_uris?.png,
                  name: frontFace.name,
                }
              : null;
          const back =
            backFace && "image_uris" in backFace
              ? {
                  uri: backFace.image_uris?.png,
                  name: backFace.name,
                }
              : null;

          return {
            front,
            back,
          };
        }

        return null;
      })
      .filter(
        (
          slot,
        ): slot is {
          front: ScryfallImageData;
          back: ScryfallImageData | null;
        } => slot !== null && slot.front !== null,
      );

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

    return { items, slotItems, errors };
  };
};
