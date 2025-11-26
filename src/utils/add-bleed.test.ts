import { describe, it, expect } from "vitest";

import { needsBleed } from "./add-bleed";

describe("needsBleed", () => {
  describe("Scryfall image case", () => {
    it("should return true for Scryfall image (745x1040) targeting standard card size (63x88mm)", () => {
      const result = needsBleed(745, 1040, 63, 88);
      expect(result).toBe(true);
    });
  });
});
