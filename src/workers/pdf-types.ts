// Intermediate representation of PDF render operations.
// All positions and dimensions are in PDF points (1 pt = 1/72 inch).
// Y-axis uses pdf-lib convention: origin at bottom-left.
// This is a pure data structure with no library dependencies, making it fully serializable and testable.

// ---------------------------------------------------------------------------
// Worker input types (shared between pdf-spec.ts and pdf-worker.ts)
// ---------------------------------------------------------------------------

export type InitData = {
  pageWidth: number;
  pageHeight: number;
  unit: "mm" | "in";
  /** Raw bytes of the base PDF. When present, this page is used as the page background. */
  basePdfBytes?: Uint8Array;
  /** 0-based index of which page of the base PDF to use. Cycles if out of range. Defaults to 0. */
  basePdfPageIndex?: number;
  /** Grid offset in mm, positive X = right, positive Y = down. Applied as a PDF CTM. */
  offsetX?: number;
  offsetY?: number;
  /** Clockwise rotation in degrees. Applied as a PDF CTM around the page center. */
  pageRotation?: number;
};

export type CardData = {
  imageDataUrl: string | null;
  mimeType: string | undefined;
  /** Card left edge in page units (mm or in, matching InitData.unit) */
  pdfX: number;
  /** Card top edge in page units (mm or in, matching InitData.unit) */
  pdfY: number;
  /** Container dimensions in screen pixels */
  containerWidth: number;
  containerHeight: number;
  /** Pixels-to-page-units scale factors */
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
    /** Line thickness in page units (already scaled) */
    thickness: number;
    /** Bleed edge width in mm */
    bleedEdgeWidth: number;
    guideColor: string;
    invertedGuideColor: string;
    unit: "mm" | "in";
    /** Raw guides thickness in mm (used for crosshair line width) */
    guidesThickness: number;
    guidesAtBleedEdge: boolean;
    extendedGuidesOnly: boolean;
    /** Custom guide arm length in mm; 0 means derive from bleed edge */
    guideLength: number;
  } | null;
};

export type PdfImageOp = {
  op: "image";
  src: string; // data URL
  mimeType: "image/png" | "image/jpeg";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfLineOp = {
  op: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** RGB components in [0, 255] range */
  color: [number, number, number];
  thickness: number;
  dashArray?: [number, number];
};

export type PdfRectOp = {
  op: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  /** RGB components in [0, 255] range */
  color: [number, number, number];
};

export type PdfRenderOp = PdfImageOp | PdfLineOp | PdfRectOp;

export type PdfPageSpec = {
  widthPts: number;
  heightPts: number;
  /** Ops applied in order — later ops render on top of earlier ops */
  operations: PdfRenderOp[];
};
