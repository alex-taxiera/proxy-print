// Pure function that builds registration marks for a Silhouette-cutter base PDF.
// All output coordinates/dimensions are in PDF points (1 pt = 1/72 inch) using pdf-lib's
// bottom-left origin convention — same convention as pdf-spec.ts.
import type { PdfRenderOp } from "./pdf-types";

export const SILHOUETTE_INSET_MM = 10;
export const SILHOUETTE_SQUARE_SIZE_MM = 6;
export const SILHOUETTE_MAX_LENGTH_MM = 20;
export const SILHOUETTE_DEFAULT_LENGTH_MM = 20;
export const SILHOUETTE_MIN_LENGTH_MM = 1;
export const SILHOUETTE_MAX_THICKNESS_MM = 1;
export const SILHOUETTE_DEFAULT_THICKNESS_MM = 1;
export const SILHOUETTE_MIN_THICKNESS_MM = 0.1;

const BLACK: [number, number, number] = [0, 0, 0];

export function buildSilhouetteMarkOps({
  pageWidth,
  pageHeight,
  unit,
  length,
  thickness,
}: {
  pageWidth: number;
  pageHeight: number;
  unit: "mm" | "in";
  length: number;
  thickness: number;
}): PdfRenderOp[] {
  const ptsPerUnit = unit === "mm" ? 72 / 25.4 : 72;
  const mmToPts = 72 / 25.4;

  const pageWidthPts = pageWidth * ptsPerUnit;
  const pageHeightPts = pageHeight * ptsPerUnit;

  const insetPts = SILHOUETTE_INSET_MM * mmToPts;
  const lengthPts = length * mmToPts;
  const thicknessPts = thickness * mmToPts;
  const squarePts = SILHOUETTE_SQUARE_SIZE_MM * mmToPts;

  const ops: PdfRenderOp[] = [];

  // Lines are stroked centered on their path, so a naive line anchored at the
  // inset point would bleed thickness/2 past the inset boundary. Each arm's
  // constant coordinate is shifted inward by half the thickness so the
  // *outer* edge of the stroke lands exactly on the inset line, and the two
  // arms' outer corners meet flush at the inset corner point.
  const halfThicknessPts = thicknessPts / 2;

  // Top-right corner: L-bracket anchored 10mm from top/right, arms extend
  // inward (left and down).
  const trX = pageWidthPts - insetPts;
  const trY = pageHeightPts - insetPts;
  ops.push({
    op: "line",
    x1: trX,
    y1: trY - halfThicknessPts,
    x2: trX - lengthPts,
    y2: trY - halfThicknessPts,
    color: BLACK,
    thickness: thicknessPts,
  });
  ops.push({
    op: "line",
    x1: trX - halfThicknessPts,
    y1: trY,
    x2: trX - halfThicknessPts,
    y2: trY - lengthPts,
    color: BLACK,
    thickness: thicknessPts,
  });

  // Bottom-left corner: L-bracket anchored 10mm from bottom/left, arms
  // extend inward (right and up).
  const blX = insetPts;
  const blY = insetPts;
  ops.push({
    op: "line",
    x1: blX,
    y1: blY + halfThicknessPts,
    x2: blX + lengthPts,
    y2: blY + halfThicknessPts,
    color: BLACK,
    thickness: thicknessPts,
  });
  ops.push({
    op: "line",
    x1: blX + halfThicknessPts,
    y1: blY,
    x2: blX + halfThicknessPts,
    y2: blY + lengthPts,
    color: BLACK,
    thickness: thicknessPts,
  });

  // Top-left corner: filled solid black square, outer corner anchored 10mm
  // from top/left, extending inward (right and down).
  const tlOuterX = insetPts;
  const tlOuterY = pageHeightPts - insetPts;
  ops.push({
    op: "rect",
    x: tlOuterX,
    y: tlOuterY - squarePts,
    width: squarePts,
    height: squarePts,
    color: BLACK,
  });

  return ops;
}
