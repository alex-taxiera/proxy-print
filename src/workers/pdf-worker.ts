import { PDFDocument, rgb } from "pdf-lib";

import { buildCardRenderOps } from "./pdf-spec";
import type { CardData, InitData } from "./pdf-types";
import type { PdfImageOp, PdfLineOp } from "./pdf-types";

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
// Helpers
// ---------------------------------------------------------------------------

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// PDF init
// ---------------------------------------------------------------------------

async function initPdf(data: InitData): Promise<void> {
  const { pageWidth, pageHeight, unit } = data;

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
  pdfDoc.addPage([pageWidthPts, pageHeightPts]);
  currentInit = data;
}

// ---------------------------------------------------------------------------
// Render a single card's operations onto the current page
// ---------------------------------------------------------------------------

async function renderCard(cardData: CardData): Promise<void> {
  if (!pdfDoc || !currentInit) {
    throw new Error("PDF not yet initialized");
  }

  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1];

  const ops = buildCardRenderOps(cardData, currentInit);

  for (const op of ops) {
    if (op.op === "image") {
      await renderImage(op);
    } else {
      renderLine(op);
    }
  }

  function renderLine(op: PdfLineOp): void {
    const [r, g, b] = op.color;
    page.drawLine({
      start: { x: op.x1, y: op.y1 },
      end: { x: op.x2, y: op.y2 },
      thickness: op.thickness,
      color: rgb(r / 255, g / 255, b / 255),
      ...(op.dashArray
        ? { dashArray: op.dashArray, dashPhase: 0 }
        : undefined),
    });
  }

  async function renderImage(op: PdfImageOp): Promise<void> {
    if (!pdfDoc) return;
    const bytes = dataUrlToUint8Array(op.src);

    console.debug(
      `Adding image: format=${op.mimeType}, pos=(${op.x.toFixed(1)}, ${op.y.toFixed(1)}), size=${op.width.toFixed(1)}x${op.height.toFixed(1)} pts`,
    );

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
          const blob = new Blob([bytes], { type: "application/pdf" });

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
