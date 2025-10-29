import { jsPDF } from "jspdf";

import type { Settings } from "~/context/SettingsContext";

type InitData = {
  pageHeight: number;
  pageWidth: number;
  unit: Settings["unit"];
};

type CardData = {
  imageDataUrl: string | null;
  mimeType: string | undefined;
  pdfX: number;
  pdfY: number;
  containerWidth: number;
  containerHeight: number;
  scaleX: number;
  scaleY: number;
  cardPosition: {
    isFirstRow: boolean;
    isLastRow: boolean;
    isFirstColumn: boolean;
    isLastColumn: boolean;
  };
  guides: {
    enabled: boolean;
    thickness: number;
    bleedEdgeWidth: number;
    guideColor: string;
    invertedGuideColor: string;
    unit: Settings["unit"];
    guidesThickness: number;
    guidesAtBleedEdge: boolean;
    extendedGuidesOnly: boolean;
  } | null;
};

type MessageEventData =
  | {
      card?: CardData;
      init?: InitData;
    }
  | undefined;

let pdf: jsPDF | undefined;
let pdfOptions:
  | {
      orientation: "l" | "p";
      unit: "mm" | "in";
      format: [number, number];
    }
  | undefined;

function initPdf(data: InitData) {
  const { pageHeight, pageWidth, unit } = data;

  // Validate page dimensions
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

  pdfOptions = {
    orientation: pageWidth > pageHeight ? "l" : "p",
    unit: unit,
    format: [pageWidth, pageHeight],
  };
  pdf = new jsPDF(pdfOptions);
}

function addImage(cardData: CardData) {
  if (!pdfOptions || !pdf) {
    throw new Error("PDF not yet initialized");
  }

  const [pageWidth, pageHeight] = pdfOptions.format;
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

  // Validate input data
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

  // Add image to PDF
  if (imageDataUrl) {
    let detectedPdfFormat = "PNG"; // default
    if (mimeType) {
      switch (mimeType.toLowerCase()) {
        case "image/jpeg":
        case "image/jpg":
          detectedPdfFormat = "JPEG";
          break;
        case "image/png":
          detectedPdfFormat = "PNG";
          break;
        case "image/webp":
          detectedPdfFormat = "WEBP";
          break;
        default:
          detectedPdfFormat = "PNG";
      }
    }

    // Validate dimensions before adding image
    if (
      !isFinite(adjustedContainerWidth) ||
      !isFinite(adjustedContainerHeight) ||
      adjustedContainerWidth <= 0 ||
      adjustedContainerHeight <= 0 ||
      adjustedContainerWidth > 10000 ||
      adjustedContainerHeight > 10000
    ) {
      throw new Error(
        `Invalid image dimensions: width=${adjustedContainerWidth}, height=${adjustedContainerHeight}`,
      );
    }

    if (!isFinite(pdfX) || !isFinite(pdfY) || pdfX < 0 || pdfY < 0) {
      throw new Error(`Invalid image position: x=${pdfX}, y=${pdfY}`);
    }

    // Log dimensions for debugging
    console.debug(
      `Adding image: format=${detectedPdfFormat}, pos=(${pdfX}, ${pdfY}), size=${adjustedContainerWidth}x${adjustedContainerHeight}`,
    );

    pdf.addImage(
      imageDataUrl,
      detectedPdfFormat,
      pdfX,
      pdfY,
      adjustedContainerWidth,
      adjustedContainerHeight,
      undefined,
      "FAST",
    );
  }

  // Add guides if needed
  if (guides && guides.enabled) {
    const pdfContainerWidth = adjustedContainerWidth;
    const pdfContainerHeight = adjustedContainerHeight;

    // Set line color and style
    pdf.setDrawColor(0, 0, 0); // Black for guides
    pdf.setLineWidth(guides.thickness);

    // Edge guides
    // Convert mm to PDF units (assuming PDF unit is inches, 1 inch = 25.4 mm)
    const bleedEdgeWidthPdf = guides.guidesAtBleedEdge
      ? 0
      : guides.unit === "in"
        ? guides.bleedEdgeWidth / 25.4
        : guides.bleedEdgeWidth;

    const crosshairSize = guides.extendedGuidesOnly
      ? 0
      : bleedEdgeWidthPdf || (guides.unit === "in" ? 1 / 25.4 : 1);

    // Calculate crosshair positions (at the edges of the card area - 63mm x 88mm)
    const topLeft = {
      x: pdfX + bleedEdgeWidthPdf,
      y: pdfY + bleedEdgeWidthPdf,
    };
    const topRight = {
      x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
      y: pdfY + bleedEdgeWidthPdf,
    };
    const bottomLeft = {
      x: pdfX + bleedEdgeWidthPdf,
      y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf,
    };
    const bottomRight = {
      x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
      y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf,
    };

    if (!guides.extendedGuidesOnly) {
      // Parse inverted guide color
      const invertedColorMatch = guides.invertedGuideColor.match(
        /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
      );
      if (invertedColorMatch) {
        const r = parseInt(invertedColorMatch[1], 16);
        const g = parseInt(invertedColorMatch[2], 16);
        const b = parseInt(invertedColorMatch[3], 16);
        pdf.setDrawColor(r, g, b);
      }

      // draw base crosshair with inverted color
      pdf.setLineWidth(
        guides.unit === "in"
          ? guides.guidesThickness / 24.5
          : guides.guidesThickness,
      );

      // top left
      pdf.line(
        topLeft.x - crosshairSize,
        topLeft.y,
        topLeft.x + crosshairSize,
        topLeft.y,
      );
      pdf.line(
        topLeft.x,
        topLeft.y - crosshairSize,
        topLeft.x,
        topLeft.y + crosshairSize,
      );

      // top right
      pdf.line(
        topRight.x - crosshairSize,
        topRight.y,
        topRight.x + crosshairSize,
        topRight.y,
      );
      pdf.line(
        topRight.x,
        topRight.y - crosshairSize,
        topRight.x,
        topRight.y + crosshairSize,
      );

      // bottom left
      pdf.line(
        bottomLeft.x - crosshairSize,
        bottomLeft.y,
        bottomLeft.x + crosshairSize,
        bottomLeft.y,
      );
      pdf.line(
        bottomLeft.x,
        bottomLeft.y - crosshairSize,
        bottomLeft.x,
        bottomLeft.y + crosshairSize,
      );

      // bottom right
      pdf.line(
        bottomRight.x - crosshairSize,
        bottomRight.y,
        bottomRight.x + crosshairSize,
        bottomRight.y,
      );
      pdf.line(
        bottomRight.x,
        bottomRight.y - crosshairSize,
        bottomRight.x,
        bottomRight.y + crosshairSize,
      );

      // Parse guide color
      const guideColorMatch = guides.guideColor.match(
        /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
      );
      if (guideColorMatch) {
        const r = parseInt(guideColorMatch[1], 16);
        const g = parseInt(guideColorMatch[2], 16);
        const b = parseInt(guideColorMatch[3], 16);
        pdf.setDrawColor(r, g, b);
      }

      // Draw crosshairs with guide color centered on the crosshair
      pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
      pdf.line(
        topLeft.x - crosshairSize,
        topLeft.y,
        topLeft.x + crosshairSize,
        topLeft.y,
      );
      pdf.line(
        topLeft.x,
        topLeft.y - crosshairSize,
        topLeft.x,
        topLeft.y + crosshairSize,
      );

      // Draw crosshair at top-right corner
      pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
      pdf.line(
        topRight.x - crosshairSize,
        topRight.y,
        topRight.x + crosshairSize,
        topRight.y,
      );
      pdf.line(
        topRight.x,
        topRight.y - crosshairSize,
        topRight.x,
        topRight.y + crosshairSize,
      );

      // Draw crosshair at bottom-left corner
      pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
      pdf.line(
        bottomLeft.x - crosshairSize,
        bottomLeft.y,
        bottomLeft.x + crosshairSize,
        bottomLeft.y,
      );
      pdf.line(
        bottomLeft.x,
        bottomLeft.y - crosshairSize,
        bottomLeft.x,
        bottomLeft.y + crosshairSize,
      );

      // Draw crosshair at bottom-right corner
      pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
      pdf.line(
        bottomRight.x - crosshairSize,
        bottomRight.y,
        bottomRight.x + crosshairSize,
        bottomRight.y,
      );
      pdf.line(
        bottomRight.x,
        bottomRight.y - crosshairSize,
        bottomRight.x,
        bottomRight.y + crosshairSize,
      );
    }

    pdf.setLineDashPattern([], 0); // reset line dash pattern
    pdf.setDrawColor(0, 0, 0); // Reset line color to black for subsequent lines

    // Draw edge guides that extend to page boundaries

    // Top edge guide (if first row)
    if (cardPosition.isFirstRow) {
      pdf.line(topLeft.x, 0, topLeft.x, topLeft.y - crosshairSize);
      pdf.line(topRight.x, 0, topRight.x, topRight.y - crosshairSize);
    }

    // Bottom edge guide (if last row)
    if (cardPosition.isLastRow) {
      pdf.line(
        bottomLeft.x,
        pageHeight,
        bottomLeft.x,
        bottomLeft.y + crosshairSize,
      );
      pdf.line(
        bottomRight.x,
        pageHeight,
        bottomRight.x,
        bottomRight.y + crosshairSize,
      );
    }

    // Left edge guide (if first column)
    if (cardPosition.isFirstColumn) {
      pdf.line(0, topLeft.y, topLeft.x - crosshairSize, topLeft.y);
      pdf.line(0, bottomLeft.y, bottomLeft.x - crosshairSize, bottomLeft.y);
    }

    // Right edge guide (if last column)
    if (cardPosition.isLastColumn) {
      pdf.line(pageWidth, topRight.y, topRight.x + crosshairSize, topRight.y);
      pdf.line(
        pageWidth,
        bottomRight.y,
        bottomRight.x + crosshairSize,
        bottomRight.y,
      );
    }
  }

  // Report progress for each card
  self.postMessage({
    type: "cardProcessed",
    card: cardData,
  });
}

// PDF generation worker
self.onmessage = function (
  e: MessageEvent<{ type: string; data: MessageEventData }>,
) {
  const { type, data } = e.data;

  switch (type) {
    case "addImage": {
      if (!data?.card) {
        self.postMessage({
          type: "error",
          event: "addImage",
          error: "No CardData send",
        });

        return;
      }

      try {
        if (data?.init && !pdf) {
          initPdf(data.init);
        }

        addImage(data.card);

        self.postMessage({
          type: "addImage",
          success: true,
        });
      } catch (error) {
        self.postMessage({
          type: "error",
          event: "addImage",
          error: error instanceof Error ? error.message : "Unknown Error",
          errorStack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;
    }
    case "save": {
      if (!pdf) {
        self.postMessage({
          type: "error",
          event: "save",
          error: "PDF not yet initialized",
        });
        return;
      }
      try {
        const pdfBlob = pdf.output("blob");

        // Send result back
        self.postMessage({
          type: "save",
          success: true,
          blob: pdfBlob,
        });
      } catch (error) {
        self.postMessage({
          type: "error",
          event: "save",
          error: error instanceof Error ? error.message : "Unknown Error",
          errorStack: error instanceof Error ? error.stack : undefined,
        });
      }
      break;
    }
  }
};
