import { describe, expect, it } from "vitest";

import { formatCount, formatSelectionCount, pluralize } from "./pluralize";

describe("pluralize utilities", () => {
  describe("formatCount", () => {
    it("should format singular correctly", () => {
      expect(formatCount(1, "card")).toBe("1 card");
      expect(formatCount(1, "image")).toBe("1 image");
    });

    it("should format plural correctly with default pluralization", () => {
      expect(formatCount(0, "card")).toBe("0 cards");
      expect(formatCount(2, "card")).toBe("2 cards");
      expect(formatCount(5, "image")).toBe("5 images");
    });

    it("should format plural correctly with custom plural form", () => {
      expect(formatCount(1, "category", "categories")).toBe("1 category");
      expect(formatCount(3, "category", "categories")).toBe("3 categories");
    });
  });

  describe("pluralize", () => {
    it("should return singular form for count of 1", () => {
      expect(pluralize(1, "card")).toBe("card");
      expect(pluralize(1, "category", "categories")).toBe("category");
    });

    it("should return plural form for other counts", () => {
      expect(pluralize(0, "card")).toBe("cards");
      expect(pluralize(2, "card")).toBe("cards");
      expect(pluralize(5, "card")).toBe("cards");
      expect(pluralize(3, "category", "categories")).toBe("categories");
    });
  });

  describe("formatSelectionCount", () => {
    it("should format selection count correctly", () => {
      expect(formatSelectionCount(1, "card")).toBe("1 selected card");
      expect(formatSelectionCount(5, "card")).toBe("5 selected cards");
      expect(formatSelectionCount(1, "image")).toBe("1 selected image");
      expect(formatSelectionCount(3, "image")).toBe("3 selected images");
    });
  });
});
