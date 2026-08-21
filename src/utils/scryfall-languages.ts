export const SCRYFALL_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
  "ko",
  "ru",
  "zhs",
  "zht",
  "he",
  "la",
  "grc",
  "ar",
  "sa",
  "ph",
] as const;

export type ScryfallLanguage = (typeof SCRYFALL_LANGUAGE_CODES)[number];
export type ScryfallLanguageFilter = ScryfallLanguage | "all";

export const SCRYFALL_LANGUAGES: ReadonlyArray<{
  value: ScryfallLanguage;
  label: string;
}> = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ru", label: "Russian" },
  { value: "zhs", label: "Simplified Chinese" },
  { value: "zht", label: "Traditional Chinese" },
  { value: "he", label: "Hebrew" },
  { value: "la", label: "Latin" },
  { value: "grc", label: "Ancient Greek" },
  { value: "ar", label: "Arabic" },
  { value: "sa", label: "Sanskrit" },
  { value: "ph", label: "Phyrexian" },
];

export const filterScryfallItemsByLanguage = <T extends { lang: string }>(
  items: T[],
  language: ScryfallLanguageFilter,
) =>
  language === "all" ? items : items.filter((item) => item.lang === language);
