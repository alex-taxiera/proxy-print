import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, Settings } from "@/context/SettingsContext";

import { generateCutlineDxf } from "./generateCutlineDxf";

describe("generateCutlineDxf", () => {
  it("emits one rounded-rect (4 lines + 4 arcs) per card slot", () => {
    const settings: Settings = {
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

    const dxf = generateCutlineDxf({ settings, cornerRadiusMm: 2.5 });

    // 3 columns x 3 rows fit on A4 with a 63x88mm card, no gaps/bleed
    const lineCount = dxf.split("0\nLINE").length - 1;
    const arcCount = dxf.split("0\nARC").length - 1;
    expect(lineCount).toBe(9 * 4);
    expect(arcCount).toBe(9 * 4);
  });

  it("emits only lines (no arcs) when corner radius is 0", () => {
    const settings: Settings = {
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

    const dxf = generateCutlineDxf({ settings, cornerRadiusMm: 0 });

    expect(dxf.split("0\nARC").length - 1).toBe(0);
    expect(dxf.split("0\nLINE").length - 1).toBe(9 * 4);
  });
});
