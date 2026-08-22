import { describe, expect, it } from "vitest";

import { buildDxfDocument } from "./dxf";
import type { DxfEntity } from "./dxf";

describe("buildDxfDocument", () => {
  it("wraps entities in a valid minimal DXF R12 structure", () => {
    const doc = buildDxfDocument([]);
    expect(doc).toContain("SECTION");
    expect(doc).toContain("HEADER");
    expect(doc).toContain("$INSUNITS");
    expect(doc).toContain("ENTITIES");
    expect(doc).toContain("ENDSEC");
    expect(doc.trim().endsWith("0\nEOF")).toBe(true);
  });

  it("emits one LINE block per line entity with correct coordinates", () => {
    const entities: DxfEntity[] = [
      { type: "LINE", x1: 1, y1: 2, x2: 3, y2: 4, color: 1 },
    ];
    const doc = buildDxfDocument(entities);
    const lineBlocks = doc.split("0\nLINE").length - 1;
    expect(lineBlocks).toBe(1);
    expect(doc).toContain("10\n1");
    expect(doc).toContain("20\n2");
    expect(doc).toContain("11\n3");
    expect(doc).toContain("21\n4");
    expect(doc).toContain("62\n1");
  });

  it("emits one ARC block per arc entity with correct radius/angles", () => {
    const entities: DxfEntity[] = [
      {
        type: "ARC",
        cx: 5,
        cy: 6,
        radius: 2.5,
        startAngle: 0,
        endAngle: 90,
        color: 1,
      },
    ];
    const doc = buildDxfDocument(entities);
    const arcBlocks = doc.split("0\nARC").length - 1;
    expect(arcBlocks).toBe(1);
    expect(doc).toContain("40\n2.5");
    expect(doc).toContain("50\n0");
    expect(doc).toContain("51\n90");
  });

  it("counts the correct number of entity blocks for a mix of lines and arcs", () => {
    const entities: DxfEntity[] = [
      { type: "LINE", x1: 0, y1: 0, x2: 1, y2: 1 },
      { type: "LINE", x1: 1, y1: 1, x2: 2, y2: 2 },
      { type: "ARC", cx: 0, cy: 0, radius: 1, startAngle: 0, endAngle: 90 },
    ];
    const doc = buildDxfDocument(entities);
    expect(doc.split("0\nLINE").length - 1).toBe(2);
    expect(doc.split("0\nARC").length - 1).toBe(1);
  });
});
