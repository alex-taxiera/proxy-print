// Shared pdf-lib drawing helpers for PdfRenderOp values.
// Used by both the live rendering worker (pdf-worker.ts) and one-off
// generators that run on the main thread (e.g. src/utils/generateBasePdf.ts).
import { PDFDocument, PDFPage, rgb } from "pdf-lib";

import type {
  PdfImageOp,
  PdfLineOp,
  PdfRectOp,
  PdfRenderOp,
} from "./pdf-types";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function renderLineOp(page: PDFPage, op: PdfLineOp): void {
  const [r, g, b] = op.color;
  page.drawLine({
    start: { x: op.x1, y: op.y1 },
    end: { x: op.x2, y: op.y2 },
    thickness: op.thickness,
    color: rgb(r / 255, g / 255, b / 255),
    ...(op.dashArray ? { dashArray: op.dashArray, dashPhase: 0 } : undefined),
  });
}

export function renderRectOp(page: PDFPage, op: PdfRectOp): void {
  const [r, g, b] = op.color;
  page.drawRectangle({
    x: op.x,
    y: op.y,
    width: op.width,
    height: op.height,
    color: rgb(r / 255, g / 255, b / 255),
  });
}

export async function renderImageOp(
  pdfDoc: PDFDocument,
  page: PDFPage,
  op: PdfImageOp,
): Promise<void> {
  const bytes = dataUrlToUint8Array(op.src);

  const embedded =
    op.mimeType === "image/jpeg"
      ? await pdfDoc.embedJpg(bytes)
      : await pdfDoc.embedPng(bytes);

  page.drawImage(embedded, {
    x: op.x,
    y: op.y,
    width: op.width,
    height: op.height,
  });
}

export async function renderPdfOp(
  pdfDoc: PDFDocument,
  page: PDFPage,
  op: PdfRenderOp,
): Promise<void> {
  switch (op.op) {
    case "image":
      await renderImageOp(pdfDoc, page, op);
      break;
    case "line":
      renderLineOp(page, op);
      break;
    case "rect":
      renderRectOp(page, op);
      break;
  }
}
