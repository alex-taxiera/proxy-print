// Pure function that maps CardData + InitData → PdfRenderOp[].
// All output coordinates/dimensions are in PDF points (1 pt = 1/72 inch) using pdf-lib's
// bottom-left origin convention.
//
// This module has zero side-effects and no library dependencies, making it straightforward
// to unit-test and safe to snapshot for regression detection between renderers.
import type { CardData, InitData, PdfLineOp, PdfRenderOp } from "./pdf-types";

function parseHexColor(hex: string): [number, number, number] | null {
  const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!match) return null;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

/**
 * Build the list of render operations for a single card placement.
 *
 * Coordinate conventions in the output:
 * - Origin is bottom-left (pdf-lib / PDF spec standard)
 * - All values are in PDF points
 *
 * This is a faithful translation of the coordinate math in the original jsPDF-based
 * pdf-worker.ts addImage() function. Behavioural quirks (e.g. the 24.5 divisor instead
 * of 25.4 for guidesThickness in "in" mode) are intentionally preserved for parity.
 */
export function buildCardRenderOps(
  cardData: CardData,
  initData: InitData,
): PdfRenderOp[] {
  const { pageWidth, pageHeight, unit } = initData;

  if (
    !isFinite(pageWidth) ||
    !isFinite(pageHeight) ||
    pageWidth <= 0 ||
    pageHeight <= 0 ||
    pageWidth > 10000 ||
    pageHeight > 10000
  ) {
    throw new Error(
      `Invalid page dimensions: width=${pageWidth}, height=${pageHeight}`,
    );
  }

  const ptsPerUnit = unit === "mm" ? 72 / 25.4 : 72;
  const pageHeightPts = pageHeight * ptsPerUnit;
  const pageWidthPts = pageWidth * ptsPerUnit;

  const {
    imageDataUrl,
    mimeType,
    pdfX,
    pdfY,
    containerWidth,
    containerHeight,
    scaleX,
    scaleY,
    cardPosition,
    guides,
  } = cardData;

  if (
    !isFinite(containerWidth) ||
    !isFinite(containerHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    throw new Error(
      `Invalid container dimensions: width=${containerWidth}, height=${containerHeight}`,
    );
  }

  if (
    !isFinite(scaleX) ||
    !isFinite(scaleY) ||
    scaleX <= 0 ||
    scaleY <= 0 ||
    scaleX > 100 ||
    scaleY > 100
  ) {
    throw new Error(`Invalid scale values: scaleX=${scaleX}, scaleY=${scaleY}`);
  }

  const adjustedContainerWidth = containerWidth * scaleX;
  const adjustedContainerHeight = containerHeight * scaleY;

  const toPts = (v: number) => v * ptsPerUnit;
  // Flip a jsPDF y-coordinate (top-left origin, y increasing downward) to a
  // pdf-lib y-coordinate (bottom-left origin, y increasing upward).
  const flipY = (jsPdfY: number) => pageHeightPts - toPts(jsPdfY);

  const ops: PdfRenderOp[] = [];

  // ------------------------------------------------------------------
  // Image operation
  // ------------------------------------------------------------------
  if (imageDataUrl) {
    if (!isFinite(pdfX) || !isFinite(pdfY) || pdfX < 0 || pdfY < 0) {
      throw new Error(`Invalid image position: x=${pdfX}, y=${pdfY}`);
    }

    const widthPts = toPts(adjustedContainerWidth);
    const heightPts = toPts(adjustedContainerHeight);

    if (
      !isFinite(widthPts) ||
      !isFinite(heightPts) ||
      widthPts <= 0 ||
      heightPts <= 0 ||
      widthPts > 10000 * ptsPerUnit ||
      heightPts > 10000 * ptsPerUnit
    ) {
      throw new Error(
        `Invalid image dimensions: width=${adjustedContainerWidth}, height=${adjustedContainerHeight}`,
      );
    }

    const normalised = mimeType?.toLowerCase();
    const detectedMimeType: "image/png" | "image/jpeg" =
      normalised === "image/jpeg" || normalised === "image/jpg"
        ? "image/jpeg"
        : "image/png";

    ops.push({
      op: "image",
      src: imageDataUrl,
      mimeType: detectedMimeType,
      x: toPts(pdfX),
      // pdf-lib y is the bottom-left of the image; jsPDF y is the top-left.
      y: flipY(pdfY) - heightPts,
      width: widthPts,
      height: heightPts,
    });
  }

  // ------------------------------------------------------------------
  // Guide operations
  // ------------------------------------------------------------------
  if (guides && guides.enabled) {
    // bleedEdgeWidthPageUnits: in page units (mm or in).
    // When guidesAtBleedEdge is true the guides sit at the card edge with no inset.
    const bleedEdgeWidthPageUnits = guides.guidesAtBleedEdge
      ? 0
      : guides.unit === "in"
        ? guides.bleedEdgeWidth / 25.4 // mm → in
        : guides.bleedEdgeWidth; // stays mm

    // crosshairSizePageUnits: arm length of the crosshair tick marks.
    const guideLengthRaw: unknown = (guides as Record<string, unknown>)[
      "guideLength"
    ];
    const customGuideLengthPageUnits =
      typeof guideLengthRaw === "number" && guideLengthRaw > 0
        ? guides.unit === "in"
          ? guideLengthRaw / 25.4
          : guideLengthRaw
        : null;
    const crosshairSizePageUnits = guides.extendedGuidesOnly
      ? 0
      : ((customGuideLengthPageUnits ?? bleedEdgeWidthPageUnits) ||
          (guides.unit === "in" ? 1 / 25.4 : 1));

    const bleedPts = toPts(bleedEdgeWidthPageUnits);
    const crosshairPts = toPts(crosshairSizePageUnits);

    // Card edges in pdf-lib coords (y increasing upward).
    const cardLeftX = toPts(pdfX);
    const cardRightX = toPts(pdfX + adjustedContainerWidth);
    const cardTopY = flipY(pdfY); // top edge of card (larger y value)
    const cardBottomY = flipY(pdfY + adjustedContainerHeight); // bottom edge

    // Crosshair anchor points, inset by bleed edge.
    const tl = { x: cardLeftX + bleedPts, y: cardTopY - bleedPts };
    const tr = { x: cardRightX - bleedPts, y: cardTopY - bleedPts };
    const bl = { x: cardLeftX + bleedPts, y: cardBottomY + bleedPts };
    const br = { x: cardRightX - bleedPts, y: cardBottomY + bleedPts };

    if (!guides.extendedGuidesOnly) {
      // Crosshair line thickness in pts.
      // NOTE: The original code uses 24.5 (not 25.4) as the divisor when unit="in".
      // This quirk is preserved intentionally for rendering parity.
      const crosshairThicknessPts = toPts(
        guides.unit === "in"
          ? guides.guidesThickness / 24.5
          : guides.guidesThickness,
      );

      const invertedColor = parseHexColor(guides.invertedGuideColor) ?? [
        0, 0, 0,
      ];
      const guideColor = parseHexColor(guides.guideColor) ?? [0, 0, 0];

      const dashLen = toPts(crosshairSizePageUnits / 5);
      const dashGap = toPts(crosshairSizePageUnits / 4);

      const solidLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: [number, number, number],
      ): PdfLineOp => ({
        op: "line",
        x1,
        y1,
        x2,
        y2,
        color,
        thickness: crosshairThicknessPts,
      });

      const dashedLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
      ): PdfLineOp => ({
        op: "line",
        x1,
        y1,
        x2,
        y2,
        color: guideColor,
        thickness: crosshairThicknessPts,
        dashArray: [dashLen, dashGap],
      });

      // Layer 1: solid crosshairs with inverted guide color (background layer)
      // Layer 2: dashed crosshairs with guide color (foreground layer)
      // Each corner: horizontal line + vertical line
      for (const corner of [tl, tr, bl, br]) {
        const { x, y } = corner;
        // horizontal
        ops.push(
          solidLine(x - crosshairPts, y, x + crosshairPts, y, invertedColor),
        );
        // vertical (y1 > y2 in pdf-lib is fine — direction does not affect rendering)
        ops.push(
          solidLine(x, y + crosshairPts, x, y - crosshairPts, invertedColor),
        );
        // dashed horizontal
        ops.push(dashedLine(x - crosshairPts, y, x + crosshairPts, y));
        // dashed vertical
        ops.push(dashedLine(x, y + crosshairPts, x, y - crosshairPts));
      }
    }

    // Edge guides: extend from the card's crosshair out to the page boundary.
    // Always solid black with guides.thickness (scaled) when extendedGuidesOnly,
    // or with the crosshair thickness when crosshairs are also drawn.
    const edgeThicknessPts = guides.extendedGuidesOnly
      ? toPts(guides.thickness)
      : toPts(
          guides.unit === "in"
            ? guides.guidesThickness / 24.5
            : guides.guidesThickness,
        );

    const edgeLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ): PdfLineOp => ({
      op: "line",
      x1,
      y1,
      x2,
      y2,
      color: [0, 0, 0],
      thickness: edgeThicknessPts,
    });

    // Top edge: from page top (y=pageHeightPts) down to just above the crosshair.
    if (cardPosition.isFirstRow) {
      ops.push(edgeLine(tl.x, pageHeightPts, tl.x, tl.y + crosshairPts));
      ops.push(edgeLine(tr.x, pageHeightPts, tr.x, tr.y + crosshairPts));
    }

    // Bottom edge: from page bottom (y=0) up to just below the crosshair.
    if (cardPosition.isLastRow) {
      ops.push(edgeLine(bl.x, 0, bl.x, bl.y - crosshairPts));
      ops.push(edgeLine(br.x, 0, br.x, br.y - crosshairPts));
    }

    // Left edge: from page left (x=0) to just left of the crosshair.
    if (cardPosition.isFirstColumn) {
      ops.push(edgeLine(0, tl.y, tl.x - crosshairPts, tl.y));
      ops.push(edgeLine(0, bl.y, bl.x - crosshairPts, bl.y));
    }

    // Right edge: from page right (x=pageWidthPts) to just right of the crosshair.
    if (cardPosition.isLastColumn) {
      ops.push(edgeLine(pageWidthPts, tr.y, tr.x + crosshairPts, tr.y));
      ops.push(edgeLine(pageWidthPts, br.y, br.x + crosshairPts, br.y));
    }
  }

  return ops;
}
