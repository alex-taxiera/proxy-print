// One-off base PDF generator — runs on the main thread. Unlike pdf-worker.ts
// (which streams many cards over a long-lived session), this produces a
// single blank page with registration marks, so a dedicated worker isn't
// worth the overhead.
import { PDFDocument } from "pdf-lib";

import { Unit } from "@/context/SettingsContext";
import { renderPdfOp } from "@/workers/pdf-render";
import { buildSilhouetteMarkOps } from "@/workers/silhouette-spec";

export async function generateSilhouetteBasePdf(config: {
  pageWidth: number;
  pageHeight: number;
  unit: Unit;
  length: number;
  thickness: number;
  borderless?: boolean;
}): Promise<Uint8Array> {
  const { pageWidth, pageHeight, unit, length, thickness, borderless } =
    config;

  const ptsPerUnit = unit === "mm" ? 72 / 25.4 : 72;
  const pageWidthPts = pageWidth * ptsPerUnit;
  const pageHeightPts = pageHeight * ptsPerUnit;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidthPts, pageHeightPts]);

  const ops = buildSilhouetteMarkOps({
    pageWidth,
    pageHeight,
    unit,
    length,
    thickness,
    borderless,
  });

  for (const op of ops) {
    await renderPdfOp(pdfDoc, page, op);
  }

  return pdfDoc.save();
}
