import { describe, expect, it } from "vitest";

import { buildCardRenderOps } from "./pdf-spec";
import type { CardData, InitData } from "./pdf-types";
import type { PdfImageOp, PdfLineOp, PdfRenderOp } from "./pdf-types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MM_PTS = 72 / 25.4; // 1 mm in pts ≈ 2.8346
const IN_PTS = 72; // 1 inch in pts

function imageOps(ops: PdfRenderOp[]): PdfImageOp[] {
  return ops.filter((o): o is PdfImageOp => o.op === "image");
}
function lineOps(ops: PdfRenderOp[]): PdfLineOp[] {
  return ops.filter((o): o is PdfLineOp => o.op === "line");
}
function solidLines(ops: PdfRenderOp[]): PdfLineOp[] {
  return lineOps(ops).filter((o) => !o.dashArray);
}
function dashedLines(ops: PdfRenderOp[]): PdfLineOp[] {
  return lineOps(ops).filter((o) => !!o.dashArray);
}

// ---------------------------------------------------------------------------
// Base fixtures — override individual fields in each test as needed
// ---------------------------------------------------------------------------

const A4_MM: InitData = { pageWidth: 210, pageHeight: 297, unit: "mm" };
const LETTER_IN: InitData = { pageWidth: 8.5, pageHeight: 11, unit: "in" };

const NO_GUIDES: CardData["guides"] = null;

const GUIDES_DEFAULT: NonNullable<CardData["guides"]> = {
  enabled: true,
  thickness: 0.1, // page-unit scaled thickness (mm)
  bleedEdgeWidth: 3, // mm
  guideColor: "#000000",
  invertedGuideColor: "#ffffff",
  unit: "mm",
  guidesThickness: 0.5, // raw mm
  guideLength: 0,
  guidesAtBleedEdge: false,
  extendedGuidesOnly: false,
};

const NON_EDGE_CARD: CardData["cardPosition"] = {
  isFirstRow: false,
  isLastRow: false,
  isFirstColumn: false,
  isLastColumn: false,
};

const ALL_EDGE_CARD: CardData["cardPosition"] = {
  isFirstRow: true,
  isLastRow: true,
  isFirstColumn: true,
  isLastColumn: true,
};

/** A single card on an A4 page (mm), at position (10, 15) mm. */
function makeCard(overrides: Partial<CardData> = {}): CardData {
  return {
    imageDataUrl: "data:image/png;base64,abc==",
    mimeType: "image/png",
    pdfX: 10,
    pdfY: 15,
    containerWidth: 500,
    containerHeight: 700,
    scaleX: 0.21, // 500px → 105 mm
    scaleY: 0.21, // 700px → 147 mm
    cardPosition: NON_EDGE_CARD,
    guides: NO_GUIDES,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Unit conversion / coordinate tests
// ---------------------------------------------------------------------------

describe("image op — mm units", () => {
  it("produces exactly one image op", () => {
    const ops = buildCardRenderOps(makeCard(), A4_MM);
    expect(imageOps(ops)).toHaveLength(1);
  });

  it("x is pdfX converted to pts", () => {
    const ops = buildCardRenderOps(makeCard({ pdfX: 10 }), A4_MM);
    expect(imageOps(ops)[0].x).toBeCloseTo(10 * MM_PTS, 3);
  });

  it("image bottom-left y is flipped from jsPDF top-left", () => {
    // jsPDF places image at (pdfX, pdfY); y goes down from top.
    // pdf-lib needs the bottom-left corner; y goes up from bottom.
    // expected: pageHeightPts - (pdfY + containerH_mm) * MM_PTS
    const containerH_mm = 700 * 0.21; // 147 mm
    const pageHeightPts = 297 * MM_PTS;
    const expected = pageHeightPts - (15 + containerH_mm) * MM_PTS;
    const ops = buildCardRenderOps(makeCard(), A4_MM);
    expect(imageOps(ops)[0].y).toBeCloseTo(expected, 3);
  });

  it("width and height are container × scale × ptsPerUnit", () => {
    const ops = buildCardRenderOps(makeCard(), A4_MM);
    const img = imageOps(ops)[0];
    expect(img.width).toBeCloseTo(500 * 0.21 * MM_PTS, 3); // 105 mm → pts
    expect(img.height).toBeCloseTo(700 * 0.21 * MM_PTS, 3); // 147 mm → pts
  });
});

describe("image op — inch units", () => {
  it("x/y/width/height use inch-to-pts conversion", () => {
    const card = makeCard({ pdfX: 1, pdfY: 1, scaleX: 0.008, scaleY: 0.008 });
    // containerWidth=500, scaleX=0.008 → 4 in
    const ops = buildCardRenderOps(card, LETTER_IN);
    const img = imageOps(ops)[0];
    expect(img.x).toBeCloseTo(1 * IN_PTS, 3);
    expect(img.width).toBeCloseTo(4 * IN_PTS, 3);
  });
});

// ---------------------------------------------------------------------------
// mime-type normalisation
// ---------------------------------------------------------------------------

describe("mimeType normalisation", () => {
  it('image/jpeg → "image/jpeg"', () => {
    const ops = buildCardRenderOps(makeCard({ mimeType: "image/jpeg" }), A4_MM);
    expect(imageOps(ops)[0].mimeType).toBe("image/jpeg");
  });

  it('image/jpg → "image/jpeg"', () => {
    const ops = buildCardRenderOps(makeCard({ mimeType: "image/jpg" }), A4_MM);
    expect(imageOps(ops)[0].mimeType).toBe("image/jpeg");
  });

  it('image/webp falls back to "image/png" (caller must convert before embedding)', () => {
    const ops = buildCardRenderOps(makeCard({ mimeType: "image/webp" }), A4_MM);
    expect(imageOps(ops)[0].mimeType).toBe("image/png");
  });

  it('undefined mimeType defaults to "image/png"', () => {
    const ops = buildCardRenderOps(makeCard({ mimeType: undefined }), A4_MM);
    expect(imageOps(ops)[0].mimeType).toBe("image/png");
  });
});

// ---------------------------------------------------------------------------
// Null image
// ---------------------------------------------------------------------------

describe("null imageDataUrl", () => {
  it("produces no image op", () => {
    const ops = buildCardRenderOps(makeCard({ imageDataUrl: null }), A4_MM);
    expect(imageOps(ops)).toHaveLength(0);
  });

  it("still produces guide ops when guides are enabled", () => {
    const ops = buildCardRenderOps(
      makeCard({ imageDataUrl: null, guides: GUIDES_DEFAULT }),
      A4_MM,
    );
    expect(lineOps(ops).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Guides disabled
// ---------------------------------------------------------------------------

describe("guides = null", () => {
  it("produces no line ops", () => {
    const ops = buildCardRenderOps(makeCard({ guides: null }), A4_MM);
    expect(lineOps(ops)).toHaveLength(0);
  });
});

describe("guides.enabled = false", () => {
  it("produces no line ops", () => {
    const ops = buildCardRenderOps(
      makeCard({ guides: { ...GUIDES_DEFAULT, enabled: false } }),
      A4_MM,
    );
    expect(lineOps(ops)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Crosshair structure
// ---------------------------------------------------------------------------

describe("crosshair ops — 4 corners × (solid + dashed) × (horiz + vert)", () => {
  it("produces 16 crosshair lines for a non-edge card", () => {
    const ops = buildCardRenderOps(
      makeCard({ guides: GUIDES_DEFAULT, cardPosition: NON_EDGE_CARD }),
      A4_MM,
    );
    // 4 corners × 2 directions × 2 layers = 16
    expect(lineOps(ops)).toHaveLength(16);
  });

  it("solid lines use invertedGuideColor", () => {
    const guides = {
      ...GUIDES_DEFAULT,
      guideColor: "#ff0000",
      invertedGuideColor: "#00ffff",
    };
    const ops = buildCardRenderOps(
      makeCard({ guides, cardPosition: NON_EDGE_CARD }),
      A4_MM,
    );
    const solids = solidLines(ops);
    expect(solids).toHaveLength(8); // 4 corners × 2 directions
    for (const l of solids) {
      expect(l.color).toEqual([0, 255, 255]);
    }
  });

  it("dashed lines use guideColor with dashArray", () => {
    const guides = {
      ...GUIDES_DEFAULT,
      guideColor: "#ff0000",
      invertedGuideColor: "#00ffff",
    };
    const ops = buildCardRenderOps(
      makeCard({ guides, cardPosition: NON_EDGE_CARD }),
      A4_MM,
    );
    const dashed = dashedLines(ops);
    expect(dashed).toHaveLength(8);
    for (const l of dashed) {
      expect(l.color).toEqual([255, 0, 0]);
      expect(l.dashArray).toBeDefined();
    }
  });

  it("crosshair lines are centred on the corner anchor point", () => {
    const bleed = 3; // mm
    const crosshairSize = 3 * MM_PTS; // same as bleed, so size = bleedPts
    const pageHeightPts = 297 * MM_PTS;

    // pdfX=10, pdfY=15, scaleX/Y=0.21
    // topLeft corner: x=10+3=13mm, y=15+3=18mm (jsPDF), → y_pdf=pageH-18mm (pdf-lib)
    const expectedTlX = 13 * MM_PTS;
    const expectedTlY = pageHeightPts - 18 * MM_PTS;

    const ops = buildCardRenderOps(
      makeCard({ guides: { ...GUIDES_DEFAULT, bleedEdgeWidth: bleed } }),
      A4_MM,
    );

    // Find a horizontal line at tl.y (within 0.01 pts)
    const tlHoriz = lineOps(ops).find(
      (l) =>
        Math.abs(l.y1 - expectedTlY) < 0.01 &&
        Math.abs(l.y2 - expectedTlY) < 0.01,
    );
    expect(tlHoriz).toBeDefined();
    expect(tlHoriz!.x1).toBeCloseTo(expectedTlX - crosshairSize, 2);
    expect(tlHoriz!.x2).toBeCloseTo(expectedTlX + crosshairSize, 2);
  });
});

// ---------------------------------------------------------------------------
// Edge guides
// ---------------------------------------------------------------------------

describe("edge guides", () => {
  it("NO edge guides for a non-edge card", () => {
    const ops = buildCardRenderOps(
      makeCard({ guides: GUIDES_DEFAULT, cardPosition: NON_EDGE_CARD }),
      A4_MM,
    );
    // All 16 lines should be crosshair ops; none should reach page boundary
    const pageHeightPts = 297 * MM_PTS;
    const pageWidthPts = 210 * MM_PTS;
    for (const l of lineOps(ops)) {
      expect(l.y1).not.toBeCloseTo(0, 1);
      expect(l.y1).not.toBeCloseTo(pageHeightPts, 1);
      expect(l.x1).not.toBeCloseTo(0, 1);
      expect(l.x1).not.toBeCloseTo(pageWidthPts, 1);
    }
  });

  it("isFirstRow adds 2 top-edge guide lines from page top", () => {
    const pageHeightPts = 297 * MM_PTS;
    const ops = buildCardRenderOps(
      makeCard({
        guides: GUIDES_DEFAULT,
        cardPosition: { ...NON_EDGE_CARD, isFirstRow: true },
      }),
      A4_MM,
    );
    const fromTop = solidLines(ops).filter(
      (l) =>
        Math.abs(l.y1 - pageHeightPts) < 0.01 ||
        Math.abs(l.y2 - pageHeightPts) < 0.01,
    );
    expect(fromTop).toHaveLength(2);
  });

  it("isLastRow adds 2 bottom-edge guide lines from page bottom (y=0)", () => {
    const ops = buildCardRenderOps(
      makeCard({
        guides: GUIDES_DEFAULT,
        cardPosition: { ...NON_EDGE_CARD, isLastRow: true },
      }),
      A4_MM,
    );
    const fromBottom = solidLines(ops).filter(
      (l) => Math.abs(l.y1) < 0.01 || Math.abs(l.y2) < 0.01,
    );
    expect(fromBottom).toHaveLength(2);
  });

  it("isFirstColumn adds 2 left-edge guide lines from page left (x=0)", () => {
    const ops = buildCardRenderOps(
      makeCard({
        guides: GUIDES_DEFAULT,
        cardPosition: { ...NON_EDGE_CARD, isFirstColumn: true },
      }),
      A4_MM,
    );
    const fromLeft = solidLines(ops).filter(
      (l) => Math.abs(l.x1) < 0.01 || Math.abs(l.x2) < 0.01,
    );
    expect(fromLeft).toHaveLength(2);
  });

  it("isLastColumn adds 2 right-edge guide lines from page right", () => {
    const pageWidthPts = 210 * MM_PTS;
    const ops = buildCardRenderOps(
      makeCard({
        guides: GUIDES_DEFAULT,
        cardPosition: { ...NON_EDGE_CARD, isLastColumn: true },
      }),
      A4_MM,
    );
    const fromRight = solidLines(ops).filter(
      (l) =>
        Math.abs(l.x1 - pageWidthPts) < 0.01 ||
        Math.abs(l.x2 - pageWidthPts) < 0.01,
    );
    expect(fromRight).toHaveLength(2);
  });

  it("all four edge guides appear when card is at all corners", () => {
    const pageHeightPts = 297 * MM_PTS;
    const pageWidthPts = 210 * MM_PTS;
    const ops = buildCardRenderOps(
      makeCard({ guides: GUIDES_DEFAULT, cardPosition: ALL_EDGE_CARD }),
      A4_MM,
    );
    const solids = solidLines(ops);
    const fromTop = solids.filter(
      (l) =>
        Math.abs(l.y1 - pageHeightPts) < 0.01 ||
        Math.abs(l.y2 - pageHeightPts) < 0.01,
    );
    const fromBottom = solids.filter(
      (l) => Math.abs(l.y1) < 0.01 || Math.abs(l.y2) < 0.01,
    );
    const fromLeft = solids.filter(
      (l) => Math.abs(l.x1) < 0.01 || Math.abs(l.x2) < 0.01,
    );
    const fromRight = solids.filter(
      (l) =>
        Math.abs(l.x1 - pageWidthPts) < 0.01 ||
        Math.abs(l.x2 - pageWidthPts) < 0.01,
    );
    expect(fromTop).toHaveLength(2);
    expect(fromBottom).toHaveLength(2);
    expect(fromLeft).toHaveLength(2);
    expect(fromRight).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// extendedGuidesOnly
// ---------------------------------------------------------------------------

describe("extendedGuidesOnly", () => {
  it("produces no dashed lines", () => {
    const ops = buildCardRenderOps(
      makeCard({
        guides: { ...GUIDES_DEFAULT, extendedGuidesOnly: true },
        cardPosition: ALL_EDGE_CARD,
      }),
      A4_MM,
    );
    expect(dashedLines(ops)).toHaveLength(0);
  });

  it("produces no solid crosshair lines (only edge guides)", () => {
    // With ALL_EDGE_CARD there should be exactly 8 edge guide lines
    const ops = buildCardRenderOps(
      makeCard({
        guides: { ...GUIDES_DEFAULT, extendedGuidesOnly: true },
        cardPosition: ALL_EDGE_CARD,
      }),
      A4_MM,
    );
    expect(solidLines(ops)).toHaveLength(8);
  });

  it("non-edge card with extendedGuidesOnly produces zero line ops", () => {
    const ops = buildCardRenderOps(
      makeCard({
        guides: { ...GUIDES_DEFAULT, extendedGuidesOnly: true },
        cardPosition: NON_EDGE_CARD,
      }),
      A4_MM,
    );
    expect(lineOps(ops)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// guidesAtBleedEdge
// ---------------------------------------------------------------------------

describe("guidesAtBleedEdge = true", () => {
  it("places crosshair at card edge (no inset)", () => {
    const ops = buildCardRenderOps(
      makeCard({
        guides: {
          ...GUIDES_DEFAULT,
          guidesAtBleedEdge: true,
          bleedEdgeWidth: 5,
        },
      }),
      A4_MM,
    );
    // tl.x should equal pdfX converted to pts (no bleed inset)
    const expectedTlX = 10 * MM_PTS;
    const tlHoriz = lineOps(ops).find(
      (l) => Math.abs(l.x1 + l.x2 - 2 * expectedTlX) < 0.05,
    );
    expect(tlHoriz).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

describe("validation", () => {
  it("throws on invalid page dimensions", () => {
    expect(() =>
      buildCardRenderOps(makeCard(), {
        pageWidth: -1,
        pageHeight: 297,
        unit: "mm",
      }),
    ).toThrow("Invalid page dimensions");
  });

  it("throws on invalid container dimensions", () => {
    expect(() =>
      buildCardRenderOps(makeCard({ containerWidth: 0 }), A4_MM),
    ).toThrow("Invalid container dimensions");
  });

  it("throws on invalid scale values", () => {
    expect(() => buildCardRenderOps(makeCard({ scaleX: 0 }), A4_MM)).toThrow(
      "Invalid scale values",
    );
  });

  it("throws on negative image position", () => {
    expect(() => buildCardRenderOps(makeCard({ pdfX: -1 }), A4_MM)).toThrow(
      "Invalid image position",
    );
  });
});

// ---------------------------------------------------------------------------
// Snapshot — regression guard for the full output
// Captures the complete PdfRenderOp[] for a representative card with guides,
// on an A4 page with non-trivial bleed settings.
// This snapshot should remain identical before and after swapping renderers.
// ---------------------------------------------------------------------------

describe("snapshot", () => {
  it("full ops snapshot — A4/mm, guides enabled, all edge positions", () => {
    const ops = buildCardRenderOps(
      {
        imageDataUrl: "data:image/jpeg;base64,/9j/abc==",
        mimeType: "image/jpeg",
        pdfX: 5,
        pdfY: 8,
        containerWidth: 600,
        containerHeight: 840,
        scaleX: 0.105, // 600px → 63 mm
        scaleY: 0.10476, // 840px → ~88 mm
        cardPosition: ALL_EDGE_CARD,
        guides: {
          enabled: true,
          thickness: 0.2,
          bleedEdgeWidth: 3,
          guideColor: "#000080",
          invertedGuideColor: "#ffff7f",
          unit: "mm",
          guidesThickness: 0.5,
          guideLength: 0,
          guidesAtBleedEdge: false,
          extendedGuidesOnly: false,
        },
      },
      A4_MM,
    );
    expect(ops).toMatchSnapshot();
  });
});
