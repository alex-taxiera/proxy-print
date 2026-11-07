// Metadata some PDFs carry about their cards, which lets an import do better
// than guessing from page geometry:
//
// - PDFs made by this app embed a layout manifest (utils/pdf-manifest) naming
//   the slot and face of every drawn image, plus where remote images came
//   from. With it, re-import is exact and MPCFill/Scryfall cards are
//   re-downloaded at full quality.
// - FleemProxyCompanion writes the MPCFill art id of each card onto its image
//   objects (/FleemArt, /FleemArtName, /FleemArtQuery), so those cards can be
//   linked back to MPCFill too.
import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFString,
  type PDFObject,
} from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

import type { GoogleImageData, SlotInputData } from "@/context/ImagesContext";
import {
  fromManifestRef,
  PDF_MANIFEST_FILENAME,
  PdfManifestSchema,
  type PdfManifest,
} from "@/utils/pdf-manifest/schema";

import type { ImportedImage, PdfExtraction } from "./types";

/** Largest manifest we'll parse (bytes). */
const MAX_MANIFEST_BYTES = 8 * 1024 * 1024;

/** Read and validate this app's layout manifest, if the PDF has one. */
export const readPdfManifest = async (
  doc: PDFDocumentProxy,
): Promise<PdfManifest | null> => {
  try {
    const attachments = await doc.getAttachments();
    if (!attachments) return null;
    for (const [id, attachment] of attachments) {
      if (attachment.filename !== PDF_MANIFEST_FILENAME) continue;
      const content =
        attachment.content ?? (await doc.getAttachmentContent(id));
      if (!content || content.length > MAX_MANIFEST_BYTES) return null;
      const parsed = PdfManifestSchema.safeParse(
        JSON.parse(new TextDecoder().decode(content)),
      );
      return parsed.success ? parsed.data : null;
    }
  } catch (error) {
    console.warn("PDF import: ignoring an unreadable manifest", error);
  }
  return null;
};

export type ManifestImport = {
  slots: SlotInputData[];
  defaultCardBack: ImportedImage | null;
  /** Faces that will be re-downloaded from MPCFill or Scryfall. */
  remoteCount: number;
};

/**
 * Rebuild the project from a manifest plus the images extracted from the
 * same PDF. Returns null when the two don't line up, so the caller can fall
 * back to the geometric import.
 */
export const resolveManifestImport = (
  extraction: PdfExtraction,
  manifest: PdfManifest,
): ManifestImport | null => {
  if (manifest.pages.length !== extraction.pages.length) return null;

  const slots: SlotInputData[] = manifest.slots.map((slot) => ({
    front: slot.front ? fromManifestRef(slot.front) : null,
    back: slot.back ? fromManifestRef(slot.back) : null,
  }));
  let defaultCardBack: ImportedImage | null = manifest.defaultCardBack
    ? fromManifestRef(manifest.defaultCardBack)
    : null;

  for (const [p, page] of manifest.pages.entries()) {
    const { draws } = extraction.pages[p];
    // A base PDF's own images are drawn first; the cards are the last N.
    if (draws.length < page.items.length) return null;
    const cardDraws = draws.slice(draws.length - page.items.length);

    for (const [k, item] of page.items.entries()) {
      const draw = cardDraws[k];
      if (item.defaultBack) {
        if (manifest.defaultCardBack?.kind === "local" && !defaultCardBack) {
          if (!draw) return null;
          defaultCardBack = { file: draw.file, hash: draw.hash };
        }
        continue;
      }
      const ref = manifest.slots[item.slot]?.[item.face];
      if (!ref) return null;
      if (ref.kind !== "local" || slots[item.slot][item.face]) continue;
      if (!draw) return null;
      slots[item.slot][item.face] = { file: draw.file, hash: draw.hash };
    }
  }

  const kept = slots.filter((slot) => slot.front || slot.back);
  const remoteCount = kept.reduce(
    (count, slot) =>
      count +
      [slot.front, slot.back].filter((image) => image && !("hash" in image))
        .length,
    0,
  );
  return { slots: kept, defaultCardBack, remoteCount };
};

// ---------------------------------------------------------------------------
// FleemProxyCompanion metadata
// ---------------------------------------------------------------------------

const MPC_ID = /^[\w-]{1,128}$/;
const MAX_TEXT = 512;

const textOf = (value: PDFObject | undefined): string | undefined => {
  if (value instanceof PDFHexString || value instanceof PDFString) {
    return value.decodeText().slice(0, MAX_TEXT);
  }
  return undefined;
};

/** Decode #xx escapes in a PDF name token. */
const decodeName = (token: string) =>
  token.replace(/#([0-9a-f]{2})/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

const contentText = (doc: PDFDocument, contents: PDFObject | undefined) => {
  const streams: PDFObject[] =
    contents instanceof PDFArray
      ? contents.asArray()
      : contents
        ? [contents]
        : [];
  let text = "";
  for (const entry of streams) {
    const stream = entry instanceof PDFRef ? doc.context.lookup(entry) : entry;
    if (!(stream instanceof PDFRawStream)) continue;
    const bytes = decodePDFRawStream(stream).decode();
    for (let i = 0; i < bytes.length; i++)
      text += String.fromCharCode(bytes[i]);
    text += "\n";
  }
  return text;
};

/**
 * MPCFill art for each image Fleem drew, per page, in draw order (null for
 * images without art). A page is null when its images can't be listed
 * reliably. Returns null for PDFs without Fleem metadata.
 */
export const readFleemImageMetadata = async (
  bytes: Uint8Array,
): Promise<((GoogleImageData | null)[] | null)[] | null> => {
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  let found = false;

  const pages = doc.getPages().map((page) => {
    const node = page.node;
    const resources =
      node.Resources() ??
      doc.context.lookupMaybe(
        node.getInheritableAttribute(PDFName.of("Resources")),
        PDFDict,
      );
    const xobjects = resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
    if (!xobjects) return [];

    const images: (GoogleImageData | null)[] = [];
    const text = contentText(doc, node.Contents());
    for (const match of text.matchAll(/\/([^\s/[\]()<>{}%]+)\s+Do\b/g)) {
      const xobject = xobjects.lookup(PDFName.of(decodeName(match[1])));
      if (!(xobject instanceof PDFRawStream)) return null;
      const subtype = xobject.dict.get(PDFName.of("Subtype"));
      if (subtype !== PDFName.of("Image")) {
        // Forms can draw images of their own; we can't line those up.
        if (subtype === PDFName.of("Form")) return null;
        continue;
      }
      const id = textOf(xobject.dict.get(PDFName.of("FleemArt")));
      if (!id || !MPC_ID.test(id)) {
        images.push(null);
        continue;
      }
      found = true;
      const name =
        textOf(xobject.dict.get(PDFName.of("FleemArtName"))) ||
        textOf(xobject.dict.get(PDFName.of("FleemName"))) ||
        `${id}.png`;
      const query = textOf(xobject.dict.get(PDFName.of("FleemArtQuery")));
      images.push(query ? { id, name, query } : { id, name });
    }
    return images;
  });

  return found ? pages : null;
};

/**
 * Link extracted cards to Fleem's MPCFill art where the draw order lines up.
 * Returns how many cards were linked.
 */
export const applyFleemMetadata = (
  extraction: PdfExtraction,
  metadata: ((GoogleImageData | null)[] | null)[],
): number => {
  let linked = 0;
  extraction.pages.forEach((page, p) => {
    const images = metadata[p];
    if (!images || images.length !== page.draws.length) return;
    page.draws.forEach((draw, i) => {
      const art = images[i];
      if (draw && art) {
        draw.remote = art;
        linked++;
      }
    });
  });
  return linked;
};
