import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, Settings } from "@/context/SettingsContext";

import { generateCutlineDxf } from "./generateCutlineDxf";

type Outline = { x: number; y: number }[];

/** Parses the POLYLINE vertex lists back out of a generated DXF. */
function parseOutlines(dxf: string): Outline[] {
  const lines = dxf.split("\r\n").map((l) => l.trim());
  const outlines: Outline[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const [code, value] = [lines[i], lines[i + 1]];
    if (code === "0" && value === "POLYLINE") outlines.push([]);
    if (code === "10") outlines.at(-1)!.push({ x: Number(value), y: NaN });
    if (code === "20") outlines.at(-1)!.at(-1)!.y = Number(value);
  }
  return outlines;
}

function bounds(vertices: Outline) {
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

const A4_PORTRAIT: Settings = {
  ...DEFAULT_SETTINGS,
  unit: "mm",
  pageWidth: "210",
  pageHeight: "297",
  cardWidth: "63",
  cardHeight: "88",
  rowGap: "0",
  columnGap: "0",
  bleedEdge: "0",
  guidesThickness: "0",
};

describe("generateCutlineDxf", () => {
  it("emits one closed outline per card slot", () => {
    const dxf = generateCutlineDxf({
      settings: A4_PORTRAIT,
      cornerRadiusMm: 2.5,
    });

    // 3 columns x 3 rows fit on A4 with a 63x88mm card, no gaps/bleed
    const outlines = parseOutlines(dxf);
    expect(outlines).toHaveLength(9);
    expect(outlines.every((o) => o.length === 4 * 33)).toBe(true);
  });

  it("emits plain rectangles when corner radius is 0", () => {
    const dxf = generateCutlineDxf({
      settings: A4_PORTRAIT,
      cornerRadiusMm: 0,
    });

    const outlines = parseOutlines(dxf);
    expect(outlines).toHaveLength(9);
    expect(outlines.every((o) => o.length === 4)).toBe(true);
  });

  it("anchors the grid at the origin with bleed-sized gaps (A4 landscape, 1.5mm bleed)", () => {
    const dxf = generateCutlineDxf({
      settings: {
        ...A4_PORTRAIT,
        pageWidth: "297",
        pageHeight: "210",
        bleedEdge: "1.5",
      },
      cornerRadiusMm: 2.5,
    });

    const outlines = parseOutlines(dxf);
    expect(outlines).toHaveLength(8);

    const all = bounds(outlines.flat());
    expect(all.minX).toBeCloseTo(0);
    expect(all.minY).toBeCloseTo(0);
    expect(all.maxX).toBeCloseTo(4 * 63 + 3 * 3);
    expect(all.maxY).toBeCloseTo(2 * 88 + 3);

    const columnStarts = [
      ...new Set(outlines.map((o) => bounds(o).minX.toFixed(3))),
    ].map(Number);
    expect(columnStarts).toEqual([0, 66, 132, 198]);
  });

  it("uses the even side-by-side column count", () => {
    const dxf = generateCutlineDxf({
      settings: { ...A4_PORTRAIT, printMode: "side-by-side" },
      cornerRadiusMm: 2.5,
    });

    // 3 columns fit, but side-by-side pairs only use 2 per row
    const outlines = parseOutlines(dxf);
    expect(outlines).toHaveLength(6);
    expect(bounds(outlines.flat()).maxX).toBeCloseTo(2 * 63);
  });
});
