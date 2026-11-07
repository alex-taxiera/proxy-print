// Pulls card images out of a PDF with pdf.js.
//
// We walk each page's operator list ourselves, tracking the transform and clip
// stacks, so we know exactly where every image is drawn and how much of it is
// visible. That's what lets us measure how much bleed each card carries
// (see card-geometry.ts). Approach adapted from FleemProxyCompanion's
// `_page_images` / `read_foreign` (MIT), extended to curve clips, form
// bounding boxes, rotated pages and turned images.
import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from "pdfjs-dist/legacy/build/pdf.mjs";

import type { PdfManifest } from "@/utils/pdf-manifest/schema";

import {
  BARE_CARD_BLEED_PT,
  intersectBoxes,
  measureCard,
  median,
  PT_PER_MM,
  type Box,
  type Size,
} from "./card-geometry";
import {
  boundsOf,
  isAxisAligned,
  multiply,
  normalizeCardImage,
  toSourceImage,
  type ImageDraw,
  type Matrix,
} from "./normalize-card-image";
import {
  applyFleemMetadata,
  readFleemImageMetadata,
  readPdfManifest,
  resolveManifestImport,
} from "./read-pdf-metadata";
import type {
  ExtractedCard,
  ExtractedPage,
  ExtractionWarnings,
  PdfExtraction,
} from "./types";

type Pdfjs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsPromise: Promise<Pdfjs> | null = null;

/** Lazily load pdf.js (and its worker) the first time a PDF is imported. */
export const loadPdfjs = (): Promise<Pdfjs> => {
  pdfjsPromise ??= Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return pdfjsPromise;
};

/** Minimum size (pt, both ways) for an image to be considered at all. */
const MIN_IMAGE_PT = 40;
/** Wait at most this long for pdf.js to decode one image. */
const IMAGE_TIMEOUT_MS = 30_000;

type RawImageData = {
  width: number;
  height: number;
  bitmap?: ImageBitmap;
  data?: Uint8Array | Uint8ClampedArray;
  kind?: number;
};

/** One image paint found while walking a page, in draw order. */
type PaintedImage = ImageDraw & {
  clip: Box | null;
  /** Object id for XObjects; null for inline images (data held directly). */
  objId: string | null;
  inline: RawImageData | null;
  axisAligned: boolean;
};

/** Bounding box of a pdf.js DrawOPS path (used when minMax is missing). */
const pathBounds = (data: unknown): [number, number, number, number] | null => {
  const path: unknown = Array.isArray(data) ? (data as unknown[])[0] : null;
  if (!path || typeof path !== "object" || !("length" in path)) return null;
  const ops = path as ArrayLike<number>;
  const xs: number[] = [];
  const ys: number[] = [];
  const counts: Record<number, number> = { 0: 2, 1: 2, 2: 6, 3: 4, 4: 0 };
  for (let i = 0; i < ops.length; ) {
    const n = counts[ops[i++]];
    if (n === undefined) return null;
    for (let j = 0; j < n; j += 2) {
      xs.push(ops[i + j]);
      ys.push(ops[i + j + 1]);
    }
    i += n;
  }
  if (xs.length === 0) return null;
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/** Walk a page's operator list and list every image it paints. */
const findImagePaints = async (
  pdfjs: Pdfjs,
  page: PDFPageProxy,
  viewportTransform: Matrix,
): Promise<PaintedImage[]> => {
  const { OPS } = pdfjs;
  const opList = await page.getOperatorList({
    annotationMode: pdfjs.AnnotationMode.DISABLE,
  });

  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  let clip: Box | null = null;
  let pendingClip = false;
  const stack: { ctm: Matrix; clip: Box | null }[] = [];
  const paints: PaintedImage[] = [];

  const toPage = (m: Matrix) => multiply(viewportTransform, m);
  const clipTo = (box: Box) => {
    clip = clip ? intersectBoxes(clip, box) : box;
  };
  const addPaint = (
    m: Matrix,
    objId: string | null,
    inline: RawImageData | null,
  ) => {
    const full = toPage(m);
    paints.push({
      toPage: full,
      box: boundsOf(full, 0, 0, 1, 1),
      clip,
      objId,
      inline,
      axisAligned: isAxisAligned(full),
    });
  };

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i] as unknown[];
    switch (fn) {
      case OPS.save:
        stack.push({ ctm, clip });
        break;
      case OPS.restore: {
        const state = stack.pop();
        if (state) ({ ctm, clip } = state);
        break;
      }
      case OPS.transform:
        ctm = multiply(ctm, args as Matrix);
        break;
      case OPS.paintFormXObjectBegin:
      case OPS.beginGroup: {
        stack.push({ ctm, clip });
        const group =
          fn === OPS.beginGroup
            ? (args[0] as { matrix?: Matrix; bbox?: number[] })
            : { matrix: args[0] as Matrix | null, bbox: args[1] as number[] };
        if (group.matrix) ctm = multiply(ctm, group.matrix);
        if (group.bbox) {
          const [x0, y0, x1, y1] = group.bbox;
          clipTo(boundsOf(toPage(ctm), x0, y0, x1, y1));
        }
        break;
      }
      case OPS.paintFormXObjectEnd:
      case OPS.endGroup: {
        const state = stack.pop();
        if (state) ({ ctm, clip } = state);
        break;
      }
      case OPS.clip:
      case OPS.eoClip:
        pendingClip = true;
        break;
      case OPS.constructPath: {
        if (pendingClip) {
          const minMax =
            (args[2] as ArrayLike<number> | null) ?? pathBounds(args[1]);
          if (minMax) {
            clipTo(
              boundsOf(toPage(ctm), minMax[0], minMax[1], minMax[2], minMax[3]),
            );
          }
          pendingClip = false;
        }
        break;
      }
      case OPS.endPath:
        pendingClip = false;
        break;
      case OPS.paintImageXObject:
        addPaint(ctm, args[0] as string, null);
        break;
      case OPS.paintImageXObjectRepeat: {
        const [objId, scaleX, scaleY, positions] = args as [
          string,
          number,
          number,
          ArrayLike<number>,
        ];
        for (let p = 0; p < positions.length; p += 2) {
          addPaint(
            multiply(ctm, [
              scaleX,
              0,
              0,
              scaleY,
              positions[p],
              positions[p + 1],
            ]),
            objId,
            null,
          );
        }
        break;
      }
      case OPS.paintInlineImageXObject:
        addPaint(ctm, null, args[0] as RawImageData);
        break;
    }
  }

  return paints;
};

const getImageData = (
  page: PDFPageProxy,
  objId: string,
): Promise<RawImageData | null> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), IMAGE_TIMEOUT_MS);
    const objs = objId.startsWith("g_") ? page.commonObjs : page.objs;
    objs.get(objId, (data: RawImageData | null) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

/** Sort cards into reading order: rows top to bottom, then left to right. */
const readingOrder = (cards: ExtractedCard[], rowTolerance: number) => {
  const rows: ExtractedCard[][] = [];
  for (const card of [...cards].sort((a, b) => a.center.y - b.center.y)) {
    const row = rows.find(
      (r) => Math.abs(r[0].center.y - card.center.y) < rowTolerance,
    );
    if (row) row.push(card);
    else rows.push([card]);
  }
  return rows.flatMap((row) => row.sort((a, b) => a.center.x - b.center.x));
};

const baseName = (fileName: string) =>
  fileName
    .replace(/\.pdf$/i, "")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 60) || "pdf";

export type ExtractProgress = { page: number; pageCount: number };

/**
 * With a manifest, only the faces it says came from local files need their
 * pixels; MPCFill/Scryfall faces are re-downloaded and a base PDF's own
 * images aren't cards. Returns whether a draw can be skipped.
 */
const manifestSkipper =
  (manifest: PdfManifest) =>
  (pageIndex: number, drawIndex: number, drawCount: number): boolean => {
    const items = manifest.pages[pageIndex]?.items ?? [];
    const item = items[drawIndex - (drawCount - items.length)];
    if (!item) return true;
    const ref = item.defaultBack
      ? manifest.defaultCardBack
      : manifest.slots[item.slot]?.[item.face];
    return ref?.kind !== "local";
  };

/**
 * Extract every card image from a PDF, normalized to card + 3mm bleed.
 * Problems with individual images are counted in `warnings`, never thrown.
 */
export const extractPdfImages = async (
  file: File,
  cardSizeMm: Size,
  onProgress?: (progress: ExtractProgress) => void,
  { ignoreManifest = false }: { ignoreManifest?: boolean } = {},
): Promise<PdfExtraction> => {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc: PDFDocumentProxy = await loadingTask.promise.catch(
    async (error: unknown) => {
      await loadingTask.destroy();
      throw error;
    },
  );

  const embedded = ignoreManifest ? null : await readPdfManifest(doc);
  const manifest = embedded?.pages.length === doc.numPages ? embedded : null;
  const skipDraw = manifest ? manifestSkipper(manifest) : null;
  const producer = await doc
    .getMetadata()
    .then(({ info }) => {
      const value = (info as { Producer?: unknown } | null)?.Producer;
      return typeof value === "string" ? value : null;
    })
    .catch(() => null);

  // A PDF made by this app knows its own card size; trust it over settings.
  const cardMm = manifest?.cardSizeMm ?? cardSizeMm;
  const cardPt = { w: cardMm.w * PT_PER_MM, h: cardMm.h * PT_PER_MM };
  const bleedPt = 3 * PT_PER_MM;
  const prefix = baseName(file.name);
  const warnings: ExtractionWarnings = {
    skewedSkipped: 0,
    failed: 0,
    sizeMismatch: 0,
    mismatchSizeMm: null,
  };
  const mismatchSizes: Size[] = [];
  const pages: ExtractedPage[] = [];
  // Identical paints (same object, same crop) are encoded once.
  const encoded = new Map<string, { file: File; hash: string }>();

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      onProgress?.({ page: p, pageCount: doc.numPages });
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const draws: (ExtractedCard | null)[] = [];

      try {
        const paints = await findImagePaints(
          pdfjs,
          page,
          viewport.transform as Matrix,
        );

        for (const [drawIndex, paint] of paints.entries()) {
          draws.push(null);
          if (skipDraw?.(p - 1, drawIndex, paints.length)) continue;
          if (paint.box.w < MIN_IMAGE_PT && paint.box.h < MIN_IMAGE_PT) {
            continue;
          }
          if (!paint.axisAligned) {
            warnings.skewedSkipped++;
            continue;
          }

          let measurement = measureCard(paint.box, paint.clip, cardPt);
          // A card placed sideways (or on a /Rotate page) is landscape on
          // the page; measure it against the turned card size. The image is
          // turned back upright when it's normalized.
          let pageCardPt = cardPt;
          if (measurement.kind === "mismatch") {
            const turnedPt = { w: cardPt.h, h: cardPt.w };
            const turned = measureCard(paint.box, paint.clip, turnedPt);
            if (turned.kind === "card") {
              measurement = turned;
              pageCardPt = turnedPt;
            }
          }
          if (measurement.kind === "ignore") continue;
          if (measurement.kind === "mismatch") {
            warnings.sizeMismatch++;
            mismatchSizes.push(measurement.visibleSize);
          }

          try {
            const raw =
              paint.inline ?? (await getImageData(page, paint.objId!));
            if (!raw) throw new Error("Image couldn't be decoded");
            const source = toSourceImage(raw);

            const target =
              measurement.kind === "mismatch"
                ? ({ kind: "asIs" } as const)
                : ({
                    kind: "crop",
                    center: measurement.center,
                    cardPt: pageCardPt,
                    bleedPt:
                      measurement.availableBleedPt < BARE_CARD_BLEED_PT
                        ? 0
                        : bleedPt,
                  } as const);
            const cardKind =
              target.kind === "asIs"
                ? "asIs"
                : target.bleedPt === 0
                  ? "bare"
                  : "normalized";

            const name = `${prefix}-p${p}-${drawIndex + 1}.jpg`;
            // The crop depends on the object, its scale/orientation and the
            // clip relative to the image, not on where it sits on the page,
            // so a back drawn in every grid cell is only encoded once.
            const visible = intersectBoxes(paint.box, paint.clip);
            const cacheKey = paint.objId
              ? [
                  paint.objId,
                  cardKind,
                  ...paint.toPage.slice(0, 4),
                  visible.x - paint.box.x,
                  visible.y - paint.box.y,
                  visible.w,
                  visible.h,
                ]
                  .map((v) => (typeof v === "number" ? v.toFixed(2) : v))
                  .join("|")
              : null;

            let image = cacheKey ? encoded.get(cacheKey) : undefined;
            if (!image) {
              image = await normalizeCardImage(source, paint, target, name);
              if (cacheKey) encoded.set(cacheKey, image);
            }

            draws[drawIndex] = {
              ...image,
              center: measurement.center,
              availableBleedMm:
                measurement.kind === "card"
                  ? measurement.availableBleedPt / PT_PER_MM
                  : 0,
              kind: cardKind,
              drawIndex,
            };
          } catch (error) {
            console.warn(`PDF import: skipped an image on page ${p}`, error);
            warnings.failed++;
          }
        }
      } finally {
        page.cleanup();
      }

      const cards = draws.filter((d): d is ExtractedCard => d !== null);
      pages.push({
        width: viewport.width,
        height: viewport.height,
        cards: readingOrder(cards, cardPt.h / 4),
        draws,
      });
    }
  } finally {
    await loadingTask.destroy();
  }

  if (mismatchSizes.length > 0) {
    warnings.mismatchSizeMm = {
      w: median(mismatchSizes.map((s) => s.w)) / PT_PER_MM,
      h: median(mismatchSizes.map((s) => s.h)) / PT_PER_MM,
    };
  }

  const extraction: PdfExtraction = {
    fileName: file.name,
    pages,
    warnings,
    manifest,
    producer,
    fleemLinked: 0,
  };

  // We skipped the faces the manifest didn't need. If it turns out not to
  // match the PDF after all, read every image the ordinary way instead.
  if (manifest && !resolveManifestImport(extraction, manifest)) {
    return extractPdfImages(file, cardSizeMm, onProgress, {
      ignoreManifest: true,
    });
  }

  if (!manifest && producer?.includes("Fleem")) {
    try {
      const metadata = await readFleemImageMetadata(
        new Uint8Array(await file.arrayBuffer()),
      );
      if (metadata) {
        extraction.fleemLinked = applyFleemMetadata(extraction, metadata);
      }
    } catch (error) {
      console.warn("PDF import: couldn't read Fleem metadata", error);
    }
  }

  return extraction;
};
