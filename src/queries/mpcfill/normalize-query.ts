export const MPCFILL_CARD_TYPES = ["CARD", "TOKEN", "CARDBACK"] as const;

export type MpcFillCardType = (typeof MPCFILL_CARD_TYPES)[number];

/** The prefixes MPC Autofill uses in decklists and XML `<query>` elements. */
const CARD_TYPE_PREFIXES: Record<MpcFillCardType, string> = {
  CARD: "",
  TOKEN: "t:",
  CARDBACK: "b:",
};

// Python's `string.punctuation`, which the backend strips from every query.
const PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i;

/**
 * What MPC Autofill reduces a card name to before matching (its `searchq`).
 * A port of `to_searchable` in the backend's `search/sanitisation.py`, so the
 * query we send is the string the legacy search endpoint keys its reply by.
 */
export const normalizeMpcFillQuery = (input: string): string =>
  input
    .toLowerCase()
    // "Lightning Bolt (Full Art B)" and "Opt [NSFW]" search as the bare name.
    .replace(/[([].*?[)\]]/g, "")
    .replace(/-/g, " ")
    .replace(/’/g, "'")
    .replace(PUNCTUATION, "")
    .replace(/\d/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Splits a card type prefix (`t:treasure`, `b:black lotus`) off a query. The
 * returned query is not normalised yet.
 */
export const parseMpcFillQuery = (
  input: string,
): { query: string; cardType: MpcFillCardType } => {
  const match = /^\s*([bt]):(.*)$/i.exec(input);
  if (!match) {
    return { query: input.trim(), cardType: "CARD" };
  }
  return {
    query: match[2].trim(),
    cardType: match[1].toLowerCase() === "t" ? "TOKEN" : "CARDBACK",
  };
};

/** The `<query>` MPC Autofill writes for a card: type prefix plus searchq. */
export const formatMpcFillQuery = (
  searchq: string,
  cardType: MpcFillCardType,
): string => `${CARD_TYPE_PREFIXES[cardType]}${searchq}`;

/** A file name without its image extension, as a starting search term. */
export const stripImageExtension = (name: string): string =>
  name.replace(IMAGE_EXTENSION, "");
