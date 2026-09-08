import { describe, expect, it } from "vitest";

import { computeCardSlotCenters, computeGridLimits } from "./gridLayout";

const baseSettings = {
  guidesThickness: "0",
  bleedEdge: "0",
  cardHeight: "88",
  cardWidth: "63",
  pageHeight: "297",
  pageWidth: "210",
  unit: "mm" as const,
  rowGap: "0",
  columnGap: "0",
};

describe("computeGridLimits", () => {
  it("fits cards without gaps (A4, standard card, no bleed/guides)", () => {
    const limits = computeGridLimits(baseSettings);
    // 210 / 63 = 3.33 -> 3 columns; 297 / 88 = 3.375 -> 3 rows
    expect(limits.columnsPerPage).toBe(3);
    expect(limits.rowsPerPage).toBe(3);
    expect(limits.cardsPerPage).toBe(9);
    expect(limits.itemWidthMm).toBe(63);
    expect(limits.itemHeightMm).toBe(88);
    expect(limits.pageWidthMm).toBe(210);
    expect(limits.pageHeightMm).toBe(297);
  });

  it("converts page dimensions from inches to mm", () => {
    const limits = computeGridLimits({
      ...baseSettings,
      unit: "in",
      pageWidth: "8.5",
      pageHeight: "11",
    });
    expect(limits.pageWidthMm).toBeCloseTo(8.5 * 25.4, 5);
    expect(limits.pageHeightMm).toBeCloseTo(11 * 25.4, 5);
  });

  it("adds bleed edge and guides thickness to the item pitch", () => {
    const limits = computeGridLimits({
      ...baseSettings,
      bleedEdge: "2",
      guidesThickness: "0.5",
    });
    expect(limits.itemWidthMm).toBeCloseTo(63 + 2 * 2 + 0.5, 5);
    expect(limits.itemHeightMm).toBeCloseTo(88 + 2 * 2 + 0.5, 5);
  });

  it("accounts for gaps reducing the number of columns/rows that fit", () => {
    // 3 columns of 63mm + 2 gaps of 10mm = 209mm, fits in 210mm.
    // A 4th column would need 63 more mm plus a gap -> doesn't fit.
    const limits = computeGridLimits({
      ...baseSettings,
      columnGap: "10",
      rowGap: "10",
    });
    expect(limits.columnsPerPage).toBe(3);
  });
});

describe("computeCardSlotCenters", () => {
  it("centers a single card exactly on the page", () => {
    const centers = computeCardSlotCenters({
      pageWidthMm: 100,
      pageHeightMm: 200,
      rowsPerPage: 1,
      columnsPerPage: 1,
      itemWidthMm: 40,
      itemHeightMm: 60,
      rowGapMm: 0,
      columnGapMm: 0,
    });
    expect(centers).toEqual([{ cx: 50, cy: 100 }]);
  });

  it("lays out a 2x2 grid symmetrically with zero gap", () => {
    const centers = computeCardSlotCenters({
      pageWidthMm: 100,
      pageHeightMm: 100,
      rowsPerPage: 2,
      columnsPerPage: 2,
      itemWidthMm: 40,
      itemHeightMm: 40,
      rowGapMm: 0,
      columnGapMm: 0,
    });
    // grid is 80x80, centered -> margin 10 on each side
    expect(centers).toHaveLength(4);
    const xs = centers.map((c) => c.cx).sort((a, b) => a - b);
    const ys = centers.map((c) => c.cy).sort((a, b) => a - b);
    expect(new Set(xs)).toEqual(new Set([30, 70]));
    expect(new Set(ys)).toEqual(new Set([30, 70]));
  });

  it("accounts for gaps when centering the grid block", () => {
    const centers = computeCardSlotCenters({
      pageWidthMm: 100,
      pageHeightMm: 100,
      rowsPerPage: 1,
      columnsPerPage: 2,
      itemWidthMm: 40,
      itemHeightMm: 40,
      rowGapMm: 0,
      columnGapMm: 10,
    });
    // grid width = 40+10+40 = 90, margin = 5 each side
    // first center = 5 + 20 = 25, second = 5 + 40 + 10 + 20 = 75
    expect(centers).toEqual([
      { cx: 25, cy: 50 },
      { cx: 75, cy: 50 },
    ]);
  });

  it("returns an empty array when nothing fits", () => {
    expect(
      computeCardSlotCenters({
        pageWidthMm: 100,
        pageHeightMm: 100,
        rowsPerPage: 0,
        columnsPerPage: 0,
        itemWidthMm: 40,
        itemHeightMm: 40,
        rowGapMm: 0,
        columnGapMm: 0,
      }),
    ).toEqual([]);
  });
});
