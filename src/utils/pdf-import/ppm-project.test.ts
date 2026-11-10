import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  backsideFileName,
  isPpmBacksideOf,
  ppmCardSizeMm,
  ppmLayout,
  ppmPairing,
  PpmProjectSchema,
  readPpmProject,
  resolvePpmImport,
  type PpmProject,
} from "./ppm-project";
import type { ExtractedCard, ExtractedPage } from "./types";

const BACK = "0aeebaf5.png";

/** A project shaped like a real Proxy PDF Maker export (trimmed). */
const rawProject = (overrides: Record<string, unknown> = {}) => ({
  version: "PPP00009",
  backside_enabled: true,
  backside_default: BACK,
  inline_backsides: false,
  separate_backsides: false,
  card_size: "Standard",
  card_layout_vertical: { width: 3, height: 3 },
  card_layout_horizontal: { width: 0, height: 0 },
  skipped_layout_slots: [],
  cards_order: [],
  cards: [
    { name: BACK, num: 1, hidden: 3, is_backside: 0, backside: "" },
    {
      name: "black lotus.png",
      num: 3,
      hidden: 0,
      is_backside: 0,
      backside: BACK,
      meta: { card_name: "black lotus" },
    },
    {
      name: "mountain .png",
      num: 1,
      hidden: 0,
      is_backside: 0,
      backside: BACK,
    },
  ],
  ...overrides,
});

const project = (overrides: Record<string, unknown> = {}): PpmProject =>
  PpmProjectSchema.parse(rawProject(overrides));

const card = (hash: string, drawIndex: number): ExtractedCard => ({
  file: new File([hash], `x-${drawIndex}.jpg`, { type: "image/jpeg" }),
  hash,
  center: { x: 0, y: 0 },
  availableBleedMm: 3,
  kind: "normalized",
  drawIndex,
});

/** A page painting these images (by hash), in order. */
const page = (...hashes: string[]): ExtractedPage => {
  const draws = hashes.map((hash, i) => card(hash, i));
  return { width: 612, height: 792, cards: draws, draws };
};

describe("readPpmProject", () => {
  const pdfWith = async (setup: (doc: PDFDocument) => void) => {
    const doc = await PDFDocument.create();
    doc.addPage();
    setup(doc);
    return new Uint8Array(await doc.save());
  };

  it("reads the project from the catalog's /Metadata dictionary", async () => {
    const bytes = await pdfWith((doc) => {
      const metadata = doc.context.obj({});
      metadata.set(
        PDFName.of("Project"),
        PDFString.of(JSON.stringify(rawProject())),
      );
      doc.catalog.set(PDFName.of("Metadata"), metadata);
    });
    const info = await readPpmProject(bytes);
    expect(info?.project.cards).toHaveLength(3);
    expect(info?.project.version).toBe("PPP00009");
    expect(JSON.parse(info!.raw)).toEqual(rawProject());
  });

  it("ignores PDFs without a project", async () => {
    expect(await readPpmProject(await pdfWith(() => {}))).toBeNull();
  });

  it("ignores a /Project that isn't a Proxy PDF Maker project", async () => {
    const bytes = await pdfWith((doc) => {
      const metadata = doc.context.obj({});
      metadata.set(PDFName.of("Project"), PDFString.of('{"version":"x"}'));
      doc.catalog.set(PDFName.of("Metadata"), metadata);
    });
    expect(await readPpmProject(bytes)).toBeNull();
  });
});

describe("ppmLayout", () => {
  it("expands copies in card-list order and skips hidden cards", () => {
    const { entries } = ppmLayout(project());
    expect(entries.map((e) => e.name)).toEqual([
      "black lotus.png",
      "black lotus.png",
      "black lotus.png",
      "mountain .png",
    ]);
  });

  it("resolves backs: own, default, and none", () => {
    const { backOf } = ppmLayout(
      project({
        cards: [
          { name: "a.png", num: 1, hidden: 0, backside: "b.png" },
          { name: "c.png", num: 1, hidden: 0, backside: "" },
          { name: "d.png", num: 1, hidden: 0 },
        ],
      }),
    );
    expect(backOf("a.png")).toBe("b.png");
    expect(backOf("c.png")).toBe(BACK);
    expect(backOf("d.png")).toBeNull();
  });

  it("follows a manual card order", () => {
    const { entries } = ppmLayout(project({ cards_order: [2, 1, 2] }));
    expect(entries.map((e) => e.name)).toEqual([
      "mountain .png",
      "black lotus.png",
      "mountain .png",
    ]);
  });

  it("places inline backs right after cards with their own back", () => {
    const { entries, hasBackPages } = ppmLayout(
      project({
        inline_backsides: true,
        cards: [
          { name: "a.png", num: 2, hidden: 0, backside: "a-back.png" },
          { name: "a-back.png", num: 1, hidden: 1, is_backside: 1 },
          { name: "b.png", num: 1, hidden: 0, backside: "" },
        ],
      }),
    );
    expect(hasBackPages).toBe(false);
    expect(entries).toEqual([
      { name: "a.png", inlineBack: false },
      { name: "a-back.png", inlineBack: true },
      { name: "a.png", inlineBack: false },
      { name: "a-back.png", inlineBack: true },
      { name: "b.png", inlineBack: false },
    ]);
  });

  it("names cards by their card name, else the file name", () => {
    const { displayName } = ppmLayout(project());
    expect(displayName("black lotus.png")).toBe("black lotus");
    expect(displayName("mountain .png")).toBe("mountain");
    expect(displayName("dir/Island (1).jpg")).toBe("Island (1)");
  });

  it("counts slots per page minus skipped ones", () => {
    expect(ppmLayout(project()).imagesPerPage).toBe(9);
    expect(
      ppmLayout(project({ skipped_layout_slots: [4] })).imagesPerPage,
    ).toBe(8);
  });
});

describe("ppmCardSizeMm", () => {
  it("maps built-in sizes and leaves custom ones to the settings", () => {
    expect(ppmCardSizeMm(project())?.w).toBeCloseTo(63, 0);
    expect(ppmCardSizeMm(project({ card_size: "Poker" }))?.h).toBeCloseTo(
      88.9,
      1,
    );
    expect(ppmCardSizeMm(project({ card_size: "Japanese" }))).toEqual({
      w: 59,
      h: 86,
    });
    expect(ppmCardSizeMm(project({ card_size: "My Custom" }))).toBeNull();
  });
});

describe("resolvePpmImport", () => {
  it("pairs fronts with the back page that follows", () => {
    const result = resolvePpmImport(project(), [
      page("lotus", "lotus", "lotus", "mountain"),
      page("back", "back", "back", "back"),
    ]);
    expect(result?.backsMissing).toBe(false);
    expect(result?.pairs.map((p) => [p.frontName, p.backName])).toEqual([
      ["black lotus.png", BACK],
      ["black lotus.png", BACK],
      ["black lotus.png", BACK],
      ["mountain .png", BACK],
    ]);
    expect(result?.pairs[3].front.hash).toBe("mountain");
  });

  it("splits cards across pages by the layout", () => {
    const result = resolvePpmImport(
      project({
        card_layout_vertical: { width: 2, height: 1 },
        backside_enabled: false,
      }),
      [page("lotus", "lotus"), page("lotus", "mountain")],
    );
    expect(result?.pairs).toHaveLength(4);
    expect(result?.pairs.every((p) => p.back === null)).toBe(true);
  });

  it("copes with a back page left out because it was empty", () => {
    const p = project({
      card_layout_vertical: { width: 2, height: 1 },
      cards: [
        { name: "a.png", num: 2, hidden: 0, backside: "b.png" },
        { name: "b.png", num: 1, hidden: 1 },
        { name: "c.png", num: 2, hidden: 0 },
      ],
    });
    // Page 2 (two c.png, which have no back) has no back page.
    const result = resolvePpmImport(p, [
      page("a", "a"),
      page("b", "b"),
      page("c", "c"),
    ]);
    expect(result?.pairs.map((pair) => pair.back?.hash ?? null)).toEqual([
      "b",
      "b",
      null,
      null,
    ]);
  });

  it("skips over gaps in a partly empty back page", () => {
    const p = project({
      cards: [
        { name: "a.png", num: 1, hidden: 0, backside: "b.png" },
        { name: "b.png", num: 1, hidden: 1 },
        { name: "c.png", num: 1, hidden: 0 },
      ],
    });
    const result = resolvePpmImport(p, [page("a", "c"), page("b")]);
    expect(result?.pairs.map((pair) => pair.back?.hash ?? null)).toEqual([
      "b",
      null,
    ]);
  });

  it("reads backs from a separate backside PDF", () => {
    const p = project({ separate_backsides: true });
    const fronts = [page("lotus", "lotus", "lotus", "mountain")];
    const backs = [page("back", "back", "back", "back")];

    const missing = resolvePpmImport(p, fronts);
    expect(missing?.backsMissing).toBe(true);
    expect(missing?.pairs.every((pair) => pair.back === null)).toBe(true);

    const paired = resolvePpmImport(p, fronts, backs);
    expect(paired?.backsMissing).toBe(false);
    expect(paired?.pairs.every((pair) => pair.back?.hash === "back")).toBe(
      true,
    );
  });

  it("pairs inline backs with the card before them", () => {
    const p = project({
      inline_backsides: true,
      cards: [
        { name: "a.png", num: 2, hidden: 0, backside: "a-back.png" },
        { name: "a-back.png", num: 1, hidden: 1, is_backside: 1 },
        { name: "b.png", num: 1, hidden: 0, backside: "" },
      ],
    });
    const result = resolvePpmImport(p, [page("a", "ab", "a", "ab", "b")]);
    expect(
      result?.pairs.map((pair) => [pair.front.hash, pair.back?.hash ?? null]),
    ).toEqual([
      ["a", "ab"],
      ["a", "ab"],
      ["b", null],
    ]);
  });

  it("gives up when the PDF doesn't match the project", () => {
    expect(resolvePpmImport(project(), [page("x", "y")])).toBeNull();
    expect(
      resolvePpmImport(project(), [
        page("lotus", "lotus", "lotus", "mountain"),
        page("back", "back"),
      ]),
    ).toBeNull();
    expect(
      resolvePpmImport(project(), [
        page("lotus", "lotus", "lotus", "mountain"),
        page("back", "back", "back", "back"),
        page("extra"),
      ]),
    ).toBeNull();
  });
});

describe("ppmPairing", () => {
  it("names images after their cards and spots the shared back", () => {
    const p = project();
    const resolution = resolvePpmImport(p, [
      page("lotus", "lotus", "lotus", "mountain"),
      page("back", "back", "back", "back"),
    ])!;
    const pairing = ppmPairing(p, resolution);
    expect(pairing.slots).toHaveLength(4);
    expect(pairing.previews.map((preview) => preview.front.name)).toEqual([
      "black lotus.jpg",
      "black lotus.jpg",
      "black lotus.jpg",
      "mountain.jpg",
    ]);
    expect(pairing.sharedBack).toMatchObject({ hash: "back" });
    expect(pairing.withBacks).toBe(4);
  });
});

describe("isPpmBacksideOf", () => {
  const info = (overrides: Record<string, unknown> = {}) => {
    const raw = JSON.stringify(rawProject(overrides));
    return { project: PpmProjectSchema.parse(JSON.parse(raw)), raw };
  };

  it("recognises the separate backs PDF of the same export", () => {
    const ppm = info({ separate_backsides: true });
    expect(backsideFileName("_printme.pdf")).toBe("_printme_backside.pdf");
    expect(
      isPpmBacksideOf(
        { fileName: "_printme.pdf", ppm },
        { fileName: "_printme_backside.pdf", ppm },
      ),
    ).toBe(true);
  });

  it("rejects files from another export or without separate backs", () => {
    const separate = info({ separate_backsides: true });
    const other = info({ separate_backsides: true, card_size: "Poker" });
    expect(
      isPpmBacksideOf(
        { fileName: "a.pdf", ppm: separate },
        { fileName: "a_backside.pdf", ppm: other },
      ),
    ).toBe(false);
    expect(
      isPpmBacksideOf(
        { fileName: "a.pdf", ppm: separate },
        { fileName: "b_backside.pdf", ppm: separate },
      ),
    ).toBe(false);
    const together = info();
    expect(
      isPpmBacksideOf(
        { fileName: "a.pdf", ppm: together },
        { fileName: "a_backside.pdf", ppm: together },
      ),
    ).toBe(false);
  });
});
