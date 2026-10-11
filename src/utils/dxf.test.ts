import { describe, expect, it } from "vitest";

import { buildDxfDocument } from "./dxf";
import type { DxfEntity } from "./dxf";

const lines = (doc: string) => doc.split("\r\n");

describe("buildDxfDocument", () => {
  it("declares metric units without a version header", () => {
    const doc = buildDxfDocument([]);
    expect(doc).toContain("$MEASUREMENT\r\n  70\r\n1");
    expect(doc).toContain("$INSUNITS\r\n  70\r\n4");
    expect(doc).not.toContain("$ACADVER");
    expect(doc).toContain("ENTITIES");
    expect(doc.endsWith("  0\r\nEOF")).toBe(true);
  });

  it("uses CRLF line endings and space-padded group codes", () => {
    const doc = buildDxfDocument([]);
    expect(doc).not.toMatch(/[^\r]\n/);
    const codes = lines(doc).filter((_, i) => i % 2 === 0);
    expect(codes.every((code) => /^ {2}\d+$/.test(code))).toBe(true);
  });

  it("emits a closed POLYLINE with one VERTEX per point and a SEQEND", () => {
    const entities: DxfEntity[] = [
      {
        type: "POLYLINE",
        closed: true,
        vertices: [
          { x: 0, y: 0 },
          { x: 1.5, y: 0 },
          { x: 1.5, y: 2.25 },
        ],
      },
    ];
    const doc = buildDxfDocument(entities);
    expect(doc.split("  0\r\nPOLYLINE").length - 1).toBe(1);
    expect(doc).toContain("POLYLINE\r\n  8\r\n0\r\n  66\r\n1\r\n  70\r\n1");
    expect(doc.split("  0\r\nVERTEX").length - 1).toBe(3);
    expect(doc.split("  0\r\nSEQEND").length - 1).toBe(1);
    expect(doc).toContain("  10\r\n1.5\r\n  20\r\n2.25");
  });

  it("flags open polylines with 70 = 0", () => {
    const doc = buildDxfDocument([
      {
        type: "POLYLINE",
        closed: false,
        vertices: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
    ]);
    expect(doc).toContain("  66\r\n1\r\n  70\r\n0");
  });
});
