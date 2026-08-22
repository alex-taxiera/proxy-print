import {
  PDFDocument,
  pushGraphicsState,
  concatTransformationMatrix,
} from "pdf-lib";

import { renderPdfOp } from "./pdf-render";
import { buildCardRenderOps } from "./pdf-spec";
import type { CardData, InitData } from "./pdf-types";

declare const self: DedicatedWorkerGlobalScope;

type MessageEventData =
  | {
      card?: CardData;
      init?: InitData;
    }
  | undefined;

// ---------------------------------------------------------------------------
// Worker state
// ---------------------------------------------------------------------------

let pdfDoc: PDFDocument | undefined;
let currentInit: InitData | undefined;

// ---------------------------------------------------------------------------
// PDF init
// ---------------------------------------------------------------------------

async function initPdf(data: InitData): Promise<void> {
  const {
    pageWidth,
    pageHeight,
    unit,
    basePdfBytes,
    basePdfPageIndex = 0,
  } = data;

  // Validation is also performed inside buildCardRenderOps; duplicate here so
  // the error surfaces at init time rather than on the first card.
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
  const pageWidthPts = pageWidth * ptsPerUnit;
  const pageHeightPts = pageHeight * ptsPerUnit;

  pdfDoc = await PDFDocument.create();

  if (basePdfBytes) {
    const basePdf = await PDFDocument.load(basePdfBytes);
    const pageIndex = basePdfPageIndex % basePdf.getPageCount();
    const [copiedPage] = await pdfDoc.copyPages(basePdf, [pageIndex]);
    pdfDoc.addPage(copiedPage);
  } else {
    pdfDoc.addPage([pageWidthPts, pageHeightPts]);
  }

  currentInit = data;
}

// ---------------------------------------------------------------------------
// Apply page-level transform (offset + rotation) as a PDF content CTM.
// Called once per page, after initPdf() and before any renderCard() calls.
// ---------------------------------------------------------------------------

function applyPageTransform(data: InitData): void {
  if (!pdfDoc) return;
  const { offsetX = 0, offsetY = 0, pageRotation = 0 } = data;
  if (offsetX === 0 && offsetY === 0 && pageRotation === 0) return;

  const ptsPerUnit = data.unit === "mm" ? 72 / 25.4 : 72;
  const pageWidthPts = data.pageWidth * ptsPerUnit;
  const pageHeightPts = data.pageHeight * ptsPerUnit;

  const page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

  // Convert clockwise-visual rotation to radians.
  // In pdf-lib's y-up coordinate system, a clockwise visual rotation corresponds
  // to a negative mathematical angle.
  const theta = -(pageRotation * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Page center (rotation pivot)
  const cx = pageWidthPts / 2;
  const cy = pageHeightPts / 2;

  // Offset in PDF points. Positive offsetY is visually downward → negative y-up.
  const tx = offsetX * (72 / 25.4);
  const ty = -offsetY * (72 / 25.4);

  // Combined CTM: rotate around page center, then translate.
  // [ a  b  0 ]   [ cosT -sinT 0 ]   translation applied in e/f
  // [ c  d  0 ] = [ sinT  cosT 0 ]
  // [ e  f  1 ]   [ e     f    1 ]
  const a = cosT;
  const b = sinT;
  const c = -sinT;
  const d = cosT;
  const e = cx * (1 - cosT) + cy * sinT + tx;
  const f = cy * (1 - cosT) - cx * sinT + ty;

  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(a, b, c, d, e, f),
  );
}

async function renderCard(cardData: CardData): Promise<void> {
  if (!pdfDoc || !currentInit) {
    throw new Error("PDF not yet initialized");
  }

  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1];

  const ops = buildCardRenderOps(cardData, currentInit);

  for (const op of ops) {
    await renderPdfOp(pdfDoc, page, op);
  }

  // Report progress (same protocol as before)
  self.postMessage({
    type: "cardProcessed",
    card: cardData,
  });
}

// ---------------------------------------------------------------------------
// Serial message queue
// pdf-lib operations are async; we must process messages in order.
// ---------------------------------------------------------------------------

let queue: Promise<void> = Promise.resolve();

function enqueue(fn: () => Promise<void>): void {
  queue = queue.then(fn);
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

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

      const card = data.card;
      const init = data.init;

      enqueue(async () => {
        try {
          if (init && !pdfDoc) {
            await initPdf(init);
            applyPageTransform(init);
          }

          await renderCard(card);

          self.postMessage({ type: "addImage", success: true });
        } catch (error) {
          self.postMessage({
            type: "error",
            event: "addImage",
            error: error instanceof Error ? error.message : "Unknown Error",
            errorStack: error instanceof Error ? error.stack : undefined,
          });
        }
      });
      break;
    }

    case "save": {
      if (!pdfDoc) {
        self.postMessage({
          type: "error",
          event: "save",
          error: "PDF not yet initialized",
        });
        return;
      }

      const docToSave = pdfDoc;

      enqueue(async () => {
        try {
          const bytes = await docToSave.save();
          const blob = new Blob([new Uint8Array(bytes)], {
            type: "application/pdf",
          });

          self.postMessage({
            type: "save",
            success: true,
            blob,
          });
        } catch (error) {
          self.postMessage({
            type: "error",
            event: "save",
            error: error instanceof Error ? error.message : "Unknown Error",
            errorStack: error instanceof Error ? error.stack : undefined,
          });
        }
      });
      break;
    }
  }
};
