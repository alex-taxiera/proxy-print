import { PDFDocument, PDFHexString, PDFName, PDFRawStream } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  PDF_MANIFEST_FORMAT,
  PDF_MANIFEST_VERSION,
  PdfManifestSchema,
  type PdfManifest,
} from "@/utils/pdf-manifest/schema";

import {
  applyFleemMetadata,
  readFleemImageMetadata,
  resolveManifestImport,
} from "./read-pdf-metadata";
import type { ExtractedCard, ExtractedPage, PdfExtraction } from "./types";

const card = (hash: string, drawIndex: number): ExtractedCard => ({
  file: new File([hash], `${hash}.jpg`, { type: "image/jpeg" }),
  hash,
  center: { x: 100 * drawIndex, y: 100 },
  availableBleedMm: 3,
  kind: "normalized",
  drawIndex,
});

const page = (draws: (ExtractedCard | null)[]): ExtractedPage => ({
  width: 612,
  height: 792,
  cards: draws.filter((d): d is ExtractedCard => d !== null),
  draws,
});

const extraction = (pages: ExtractedPage[]): PdfExtraction => ({
  fileName: "test.pdf",
  pages,
  warnings: {
    skewedSkipped: 0,
    failed: 0,
    sizeMismatch: 0,
    mismatchSizeMm: null,
  },
  manifest: null,
  producer: null,
  fleemLinked: 0,
});

const manifest = (partial: Partial<PdfManifest>): PdfManifest => ({
  format: PDF_MANIFEST_FORMAT,
  formatVersion: PDF_MANIFEST_VERSION,
  cardSizeMm: { w: 63, h: 88 },
  defaultCardBack: null,
  slots: [],
  pages: [],
  ...partial,
});

describe("PdfManifestSchema", () => {
  it("rejects remote refs outside the known hosts", () => {
    const bad = manifest({
      slots: [
        {
          front: {
            kind: "scryfall",
            uri: "https://evil.example/x.png",
            name: "x",
          },
          back: null,
        },
      ],
    });
    expect(PdfManifestSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects malformed MPCFill ids", () => {
    const bad = manifest({
      slots: [
        { front: { kind: "google", id: "../../etc", name: "x" }, back: null },
      ],
    });
    expect(PdfManifestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("resolveManifestImport", () => {
  it("restores remote and local faces in slot order", () => {
    const m = manifest({
      slots: [
        {
          front: { kind: "google", id: "abc", name: "A.png", query: "a" },
          back: { kind: "local", name: "back.png" },
        },
        {
          front: { kind: "local", name: "mine.png" },
          back: null,
        },
      ],
      pages: [
        {
          pageType: "front",
          items: [
            { slot: 0, face: "front" },
            { slot: 1, face: "front" },
          ],
        },
        { pageType: "back", items: [{ slot: 0, face: "back" }] },
      ],
    });
    const result = resolveManifestImport(
      extraction([page([card("f0", 0), card("f1", 1)]), page([card("b0", 0)])]),
      m,
    );
    expect(result).not.toBeNull();
    expect(result!.slots[0].front).toEqual({
      id: "abc",
      name: "A.png",
      query: "a",
    });
    expect(result!.slots[0].back).toMatchObject({ hash: "b0" });
    expect(result!.slots[1].front).toMatchObject({ hash: "f1" });
    expect(result!.remoteCount).toBe(1);
  });

  it("skips base-PDF images drawn before the cards", () => {
    const m = manifest({
      slots: [{ front: { kind: "local", name: "a.png" }, back: null }],
      pages: [{ pageType: "front", items: [{ slot: 0, face: "front" }] }],
    });
    const result = resolveManifestImport(
      extraction([page([null, card("template", 1), card("a", 2)])]),
      m,
    );
    expect(result!.slots[0].front).toMatchObject({ hash: "a" });
  });

  it("restores a local default card back", () => {
    const m = manifest({
      defaultCardBack: { kind: "local", name: "cb.png" },
      slots: [{ front: { kind: "local", name: "a.png" }, back: null }],
      pages: [
        { pageType: "front", items: [{ slot: 0, face: "front" }] },
        {
          pageType: "back",
          items: [{ slot: 0, face: "back", defaultBack: true }],
        },
      ],
    });
    const result = resolveManifestImport(
      extraction([page([card("a", 0)]), page([card("cb", 0)])]),
      m,
    );
    expect(result!.defaultCardBack).toMatchObject({ hash: "cb" });
    expect(result!.slots[0].back).toBeNull();
  });

  it("gives up when the pages don't line up", () => {
    const m = manifest({
      slots: [{ front: { kind: "local", name: "a.png" }, back: null }],
      pages: [
        {
          pageType: "front",
          items: [
            { slot: 0, face: "front" },
            { slot: 0, face: "front" },
          ],
        },
      ],
    });
    expect(
      resolveManifestImport(extraction([page([card("a", 0)])]), m),
    ).toBeNull();
    expect(
      resolveManifestImport(extraction([page([]), page([])]), m),
    ).toBeNull();
  });

  it("gives up when a local face wasn't extracted", () => {
    const m = manifest({
      slots: [{ front: { kind: "local", name: "a.png" }, back: null }],
      pages: [{ pageType: "front", items: [{ slot: 0, face: "front" }] }],
    });
    expect(resolveManifestImport(extraction([page([null])]), m)).toBeNull();
  });
});

// A 1x1 white PNG.
const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  ),
  (c) => c.charCodeAt(0),
);

describe("Fleem metadata", () => {
  const fleemPdf = async () => {
    const doc = await PDFDocument.create();
    doc.setProducer("Fleem Proxy Companion");
    const withArt = await doc.embedPng(PNG);
    const withoutArt = await doc.embedPng(PNG);
    // pdf-lib writes image objects lazily; force it so we can tag the dict.
    await withArt.embed();
    const dict = (doc.context.lookup(withArt.ref) as PDFRawStream).dict;
    dict.set(PDFName.of("FleemArt"), PDFHexString.fromText("1AbC-d_e"));
    dict.set(PDFName.of("FleemArtName"), PDFHexString.fromText("Island.png"));
    dict.set(PDFName.of("FleemArtQuery"), PDFHexString.fromText("island"));

    const page = doc.addPage([612, 792]);
    page.drawImage(withArt, { x: 10, y: 10, width: 180, height: 250 });
    page.drawImage(withoutArt, { x: 200, y: 10, width: 180, height: 250 });
    page.drawImage(withArt, { x: 400, y: 10, width: 180, height: 250 });
    return new Uint8Array(await doc.save({ useObjectStreams: false }));
  };

  it("reads MPCFill art per image in draw order", async () => {
    const metadata = await readFleemImageMetadata(await fleemPdf());
    expect(metadata).toEqual([
      [
        { id: "1AbC-d_e", name: "Island.png", query: "island" },
        null,
        { id: "1AbC-d_e", name: "Island.png", query: "island" },
      ],
    ]);
  });

  it("returns null for PDFs without Fleem art", async () => {
    const doc = await PDFDocument.create();
    const image = await doc.embedPng(PNG);
    doc.addPage().drawImage(image, { x: 0, y: 0, width: 10, height: 10 });
    expect(await readFleemImageMetadata(await doc.save())).toBeNull();
  });

  it("links extracted cards when the draw counts match", () => {
    const ex = extraction([page([card("a", 0), card("b", 1)])]);
    const art = { id: "x", name: "X.png" };
    expect(applyFleemMetadata(ex, [[art, null]])).toBe(1);
    expect(ex.pages[0].draws[0]?.remote).toEqual(art);
    expect(ex.pages[0].draws[1]?.remote).toBeUndefined();
  });

  it("links nothing on a page whose counts differ", () => {
    const ex = extraction([page([card("a", 0)])]);
    expect(applyFleemMetadata(ex, [[{ id: "x", name: "X" }, null]])).toBe(0);
  });
});
