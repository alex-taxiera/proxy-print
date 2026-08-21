import { describe, expect, it } from "vitest";

import { getScryfallPrintingsUrl } from "@/queries/useScryfallPrintings";
import { filterScryfallItemsByLanguage } from "@/utils/scryfall-languages";

describe("getScryfallPrintingsUrl", () => {
  it("searches every multilingual printing by exact card name", () => {
    const url = new URL(getScryfallPrintingsUrl("D'Avenant Archer"));

    expect(url.pathname).toBe("/cards/search");
    expect(url.searchParams.get("q")).toBe(`!"D'Avenant Archer"`);
    expect(url.searchParams.get("unique")).toBe("prints");
    expect(url.searchParams.get("include_multilingual")).toBe("true");
    expect(url.searchParams.get("order")).toBe("released");
    expect(url.searchParams.get("dir")).toBe("desc");
  });

  describe("filterScryfallItemsByLanguage", () => {
    const printings = [
      { id: "english", lang: "en" },
      { id: "japanese", lang: "ja" },
    ];

    it("filters printings by the selected language", () => {
      expect(filterScryfallItemsByLanguage(printings, "ja")).toEqual([
        { id: "japanese", lang: "ja" },
      ]);
    });

    it("returns every printing for the all-languages filter", () => {
      expect(filterScryfallItemsByLanguage(printings, "all")).toEqual(
        printings,
      );
    });
  });
});
