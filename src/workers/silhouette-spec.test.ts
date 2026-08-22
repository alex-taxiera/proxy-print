import { describe, expect, it } from "vitest";

import type { PdfLineOp, PdfRectOp, PdfRenderOp } from "./pdf-types";
import {
  buildSilhouetteMarkOps,
  SILHOUETTE_INSET_MM,
  SILHOUETTE_SQUARE_SIZE_MM,
} from "./silhouette-spec";

const MM_PTS = 72 / 25.4;

function lineOps(ops: PdfRenderOp[]): PdfLineOp[] {
  return ops.filter((o): o is PdfLineOp => o.op === "line");
}
function rectOps(ops: PdfRenderOp[]): PdfRectOp[] {
  return ops.filter((o): o is PdfRectOp => o.op === "rect");
}

describe("buildSilhouetteMarkOps — A4 (mm)", () => {
  const pageWidth = 210;
  const pageHeight = 297;
  const length = 20;
  const thickness = 1;
  const ops = buildSilhouetteMarkOps({
    pageWidth,
    pageHeight,
    unit: "mm",
    length,
    thickness,
  });

  const pageWidthPts = pageWidth * MM_PTS;
  const pageHeightPts = pageHeight * MM_PTS;
  const insetPts = SILHOUETTE_INSET_MM * MM_PTS;
  const lengthPts = length * MM_PTS;
  const thicknessPts = thickness * MM_PTS;
  const halfThicknessPts = thicknessPts / 2;

  it("produces 4 lines and 1 rect", () => {
    expect(lineOps(ops)).toHaveLength(4);
    expect(rectOps(ops)).toHaveLength(1);
  });

  it("top-right L-bracket arms anchor 10mm from top/right and point inward", () => {
    const trX = pageWidthPts - insetPts;
    const trY = pageHeightPts - insetPts;
    const [horiz, vert] = lineOps(ops);

    // Centerlines are shifted inward by half the stroke thickness so the
    // outer edge of each stroke — not its center — lands on the inset line.
    expect(horiz.x1).toBeCloseTo(trX, 3);
    expect(horiz.y1).toBeCloseTo(trY - halfThicknessPts, 3);
    expect(horiz.x2).toBeCloseTo(trX - lengthPts, 3);
    expect(horiz.y2).toBeCloseTo(trY - halfThicknessPts, 3);

    expect(vert.x1).toBeCloseTo(trX - halfThicknessPts, 3);
    expect(vert.y1).toBeCloseTo(trY, 3);
    expect(vert.x2).toBeCloseTo(trX - halfThicknessPts, 3);
    expect(vert.y2).toBeCloseTo(trY - lengthPts, 3);

    // Outer edges (stroke centerline ± half thickness) meet flush at the
    // inset corner point.
    expect(horiz.y1 + halfThicknessPts).toBeCloseTo(trY, 3);
    expect(vert.x1 + halfThicknessPts).toBeCloseTo(trX, 3);
  });

  it("bottom-left L-bracket arms anchor 10mm from bottom/left and point inward", () => {
    const [, , horiz, vert] = lineOps(ops);

    expect(horiz.x1).toBeCloseTo(insetPts, 3);
    expect(horiz.y1).toBeCloseTo(insetPts + halfThicknessPts, 3);
    expect(horiz.x2).toBeCloseTo(insetPts + lengthPts, 3);
    expect(horiz.y2).toBeCloseTo(insetPts + halfThicknessPts, 3);

    expect(vert.x1).toBeCloseTo(insetPts + halfThicknessPts, 3);
    expect(vert.y1).toBeCloseTo(insetPts, 3);
    expect(vert.x2).toBeCloseTo(insetPts + halfThicknessPts, 3);
    expect(vert.y2).toBeCloseTo(insetPts + lengthPts, 3);

    // Outer edges meet flush at the inset corner point.
    expect(horiz.y1 - halfThicknessPts).toBeCloseTo(insetPts, 3);
    expect(vert.x1 - halfThicknessPts).toBeCloseTo(insetPts, 3);
  });

  it("top-left square is anchored 10mm from top/left, extends inward, sized 6mm", () => {
    const squarePts = SILHOUETTE_SQUARE_SIZE_MM * MM_PTS;
    const rect = rectOps(ops)[0];
    expect(rect.x).toBeCloseTo(insetPts, 3);
    expect(rect.y).toBeCloseTo(pageHeightPts - insetPts - squarePts, 3);
    expect(rect.width).toBeCloseTo(squarePts, 3);
    expect(rect.height).toBeCloseTo(squarePts, 3);
  });

  it("all ops are pure black", () => {
    for (const op of [...lineOps(ops), ...rectOps(ops)]) {
      expect(op.color).toEqual([0, 0, 0]);
    }
  });

  it("line thickness converts mm to pts", () => {
    for (const line of lineOps(ops)) {
      expect(line.thickness).toBeCloseTo(thickness * MM_PTS, 3);
    }
  });
});

describe("buildSilhouetteMarkOps — Letter (in)", () => {
  const pageWidth = 8.5;
  const pageHeight = 11;
  const ops = buildSilhouetteMarkOps({
    pageWidth,
    pageHeight,
    unit: "in",
    length: 20,
    thickness: 1,
  });

  it("page dimensions are converted using inch-to-pts, marks still inset by 10mm", () => {
    const IN_PTS = 72;
    const pageWidthPts = pageWidth * IN_PTS;
    const insetPts = SILHOUETTE_INSET_MM * MM_PTS;

    const rect = rectOps(ops)[0];
    expect(rect.x).toBeCloseTo(insetPts, 3);

    const [horiz] = lineOps(ops);
    expect(horiz.x1).toBeCloseTo(pageWidthPts - insetPts, 3);
  });
});
