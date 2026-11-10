// Proxy PDF Maker (github.com/Malacath-92/Proxy-PDF-Maker) writes its whole
// project into every PDF it generates: the catalog's /Metadata entry is a
// dictionary with a /Project string holding the project JSON (format
// "PPP000xx"). From it we can rebuild the exact card sequence that was laid
// out, pair every front with its back without guessing from geometry, name
// the cards, and use the project's card size.
//
// How Proxy PDF Maker lays out cards (source/lib/source/ppp/pdf/util.cpp):
// - Cards are taken in the order of the project's card list (which is
//   written in the same order it was laid out in), skipping hidden ones and
//   repeating each `num` times. A manual `cards_order` (indices into the card
//   list, already expanded) replaces that.
// - With `inline_backsides`, a card with its own back is followed by that
//   back in the next slot on the same page.
// - Otherwise, when backs are enabled, every front page gets a back page with
//   each slot's back (the card's own, or the default back). Back pages come
//   right after their front page, or in a separate "<name>_backside.pdf" when
//   `separate_backsides` is set. A back page with no backs at all may be left
//   out entirely.
// - Images are drawn in slot order, so the k-th image painted on a page is
//   the k-th card of that page.
import {
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFString,
} from "pdf-lib";
import * as zod from "zod";

import { summarizePairs, type PairingResult } from "./pair-pdf-cards";
import type { ExtractedCard, ExtractedPage } from "./types";

/** Largest project JSON we'll parse (characters). */
const MAX_PROJECT_JSON = 4 * 1024 * 1024;

const LayoutSchema = zod
  .object({
    width: zod.number().int().nonnegative().max(100),
    height: zod.number().int().nonnegative().max(100),
  })
  .catch({ width: 0, height: 0 });

export const PpmProjectSchema = zod.object({
  version: zod.string().regex(/^PPP\d{5}$/),
  cards: zod
    .array(
      zod.object({
        name: zod.string().min(1).max(1024),
        num: zod.number().int().nonnegative().max(10_000).catch(1),
        hidden: zod.number().int().catch(0),
        /** How many cards use this one as their back. */
        is_backside: zod.number().int().catch(0),
        /** Absent: no back. Empty: the default back. Otherwise a card name. */
        backside: zod.string().max(1024).optional(),
        meta: zod
          .object({ card_name: zod.string().max(512).optional() })
          .optional()
          .catch(undefined),
      }),
    )
    .max(10_000),
  cards_order: zod.array(zod.number().int().nonnegative()).catch([]),
  backside_enabled: zod.boolean().catch(false),
  backside_default: zod.string().max(1024).optional().catch(undefined),
  inline_backsides: zod.boolean().catch(false),
  separate_backsides: zod.boolean().catch(false),
  card_size: zod.string().max(256).optional().catch(undefined),
  card_layout_vertical: LayoutSchema,
  card_layout_horizontal: LayoutSchema,
  skipped_layout_slots: zod.array(zod.number().int()).catch([]),
});

export type PpmProject = zod.infer<typeof PpmProjectSchema>;

export type PpmProjectInfo = {
  project: PpmProject;
  /** The raw JSON, to recognise the front and backside PDFs of one export. */
  raw: string;
};

const textOf = (value: unknown): string | null =>
  value instanceof PDFString || value instanceof PDFHexString
    ? value.decodeText()
    : null;

/** Read the project Proxy PDF Maker embedded in a PDF, if any. */
export const readPpmProject = async (
  bytes: Uint8Array,
): Promise<PpmProjectInfo | null> => {
  try {
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    const metadata = doc.catalog.lookup(PDFName.of("Metadata"));
    if (!(metadata instanceof PDFDict)) return null;
    const raw = textOf(metadata.get(PDFName.of("Project")));
    if (!raw || raw.length > MAX_PROJECT_JSON) return null;
    const parsed = PpmProjectSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { project: parsed.data, raw } : null;
  } catch (error) {
    console.warn(
      "PDF import: couldn't read the Proxy PDF Maker project",
      error,
    );
    return null;
  }
};

const IN = 25.4;

/** Proxy PDF Maker's built-in card sizes (config.hpp), in mm. */
const CARD_SIZES_MM: Record<string, { w: number; h: number }> = {
  Standard: { w: 2.48 * IN, h: 3.46 * IN },
  Oversized: { w: 3.46 * IN, h: 4.96 * IN },
  // Novelty is a Standard card printed at half scale.
  Novelty: { w: 1.24 * IN, h: 1.73 * IN },
  Japanese: { w: 59, h: 86 },
  Poker: { w: 2.5 * IN, h: 3.5 * IN },
};

/** The project's card size in mm, when it's one of the built-in sizes. */
export const ppmCardSizeMm = (
  project: PpmProject,
): { w: number; h: number } | null =>
  (project.card_size && CARD_SIZES_MM[project.card_size]) || null;

type Card = PpmProject["cards"][number];

/** One image Proxy PDF Maker placed on a front page, in layout order. */
export type PpmEntry = {
  name: string;
  /** Set for a back placed inline right after its front. */
  inlineBack: boolean;
};

export type PpmLayout = {
  entries: PpmEntry[];
  imagesPerPage: number;
  /** The back printed behind a card, or null for none. */
  backOf: (name: string) => string | null;
  /** Whether back pages exist (in this PDF or a separate one). */
  hasBackPages: boolean;
  /** A display name for a card image. */
  displayName: (name: string) => string;
};

/** Rebuild the order Proxy PDF Maker laid cards out in. */
export const ppmLayout = (project: PpmProject): PpmLayout => {
  const byName = new Map<string, Card>(
    project.cards.map((card) => [card.name, card]),
  );
  const defaultBack = project.inline_backsides
    ? null
    : project.backside_default || null;
  const isHidden = (card: Card | undefined) => !card || card.hidden > 0;

  const backOf = (name: string): string | null => {
    const card = byName.get(name);
    if (card && card.backside === undefined) return null;
    if (card?.backside) return card.backside;
    return defaultBack;
  };

  const entries: PpmEntry[] = [];
  const push = (name: string, allowInlineBack: boolean) => {
    entries.push({ name, inlineBack: false });
    const card = byName.get(name);
    // Inline backs: only cards with a back of their own (not the default).
    if (
      allowInlineBack &&
      project.inline_backsides &&
      card?.backside &&
      byName.has(card.backside)
    ) {
      entries.push({ name: card.backside, inlineBack: true });
    }
  };

  if (project.cards_order.length > 0) {
    // Manually sorted: already expanded, with inline backs placed as their
    // own entries. Hidden cards are skipped unless they're an inline back.
    for (const index of project.cards_order) {
      const card = project.cards[index];
      if (!card) continue;
      const inlinedBack = project.inline_backsides && card.is_backside > 0;
      if (isHidden(card) && !inlinedBack) continue;
      const previous = entries[entries.length - 1];
      const isBackOfPrevious =
        inlinedBack &&
        previous !== undefined &&
        !previous.inlineBack &&
        byName.get(previous.name)?.backside === card.name;
      entries.push({ name: card.name, inlineBack: isBackOfPrevious });
    }
  } else {
    for (const card of project.cards) {
      if (isHidden(card)) continue;
      for (let i = 0; i < card.num; i++) push(card.name, true);
    }
  }

  const perPage =
    project.card_layout_vertical.width * project.card_layout_vertical.height +
    project.card_layout_horizontal.width *
      project.card_layout_horizontal.height -
    project.skipped_layout_slots.length;

  const displayName = (name: string) => {
    const cardName = byName.get(name)?.meta?.card_name?.trim();
    if (cardName) return cardName;
    const base = name.split("/").pop() ?? name;
    return base.replace(/\.[a-z0-9]+$/i, "").trim() || base;
  };

  return {
    entries,
    imagesPerPage: Math.max(0, perPage),
    backOf,
    hasBackPages: project.backside_enabled && !project.inline_backsides,
    displayName,
  };
};

export type PpmPair = {
  front: ExtractedCard;
  back: ExtractedCard | null;
  frontName: string;
  backName: string | null;
};

export type PpmResolution = {
  pairs: PpmPair[];
  /** Backs live in a separate "_backside" PDF that wasn't provided. */
  backsMissing: boolean;
};

/**
 * Match the images painted in a Proxy PDF Maker PDF to its project. `pages`
 * is the PDF's pages in order; `backPages` the pages of its separate
 * "_backside" PDF, when the project uses one and it was provided. Returns
 * null when the PDF doesn't line up with the project, so the caller can fall
 * back to the geometric import.
 */
export const resolvePpmImport = (
  project: PpmProject,
  pages: ExtractedPage[],
  backPages: ExtractedPage[] | null = null,
): PpmResolution | null => {
  const layout = ppmLayout(project);
  const { entries, imagesPerPage } = layout;
  if (entries.length === 0 || imagesPerPage === 0) return null;

  const separate = layout.hasBackPages && project.separate_backsides;
  const backsMissing = separate && backPages === null;
  const backSource = separate ? backPages : pages;

  let pageIndex = 0;
  let backIndex = 0;
  const pairs: PpmPair[] = [];
  let lastFront: PpmPair | null = null;

  for (let start = 0; start < entries.length; start += imagesPerPage) {
    const chunk = entries.slice(start, start + imagesPerPage);
    const front = pages[pageIndex++];
    // Proxy PDF Maker only paints card images, so the counts must agree.
    if (!front || front.draws.length !== chunk.length) return null;
    if (front.draws.some((draw) => draw === null)) return null;

    // The backs printed behind this page, in slot order.
    const backNames = chunk.map((entry) =>
      layout.hasBackPages && !entry.inlineBack
        ? layout.backOf(entry.name)
        : null,
    );
    const backCards: (ExtractedCard | null)[] = backNames.map(() => null);

    if (layout.hasBackPages && !backsMissing && backSource) {
      const expected = backNames.filter((name) => name !== null).length;
      const sourceIndex = separate ? backIndex : pageIndex;
      const candidate = backSource[sourceIndex];
      if (expected > 0) {
        if (!candidate || candidate.draws.length !== expected) return null;
      }
      // A back page with nothing on it may have been left out entirely.
      if (candidate && (expected > 0 || candidate.draws.length === 0)) {
        if (separate) backIndex++;
        else pageIndex++;
        let j = 0;
        backNames.forEach((name, k) => {
          if (name !== null) backCards[k] = candidate.draws[j++];
        });
        if (backCards.some((card, k) => backNames[k] !== null && !card)) {
          return null;
        }
      }
    }

    chunk.forEach((entry, k) => {
      const card = front.draws[k]!;
      if (entry.inlineBack) {
        if (lastFront && !lastFront.back) {
          lastFront.back = card;
          lastFront.backName = entry.name;
        }
        return;
      }
      const back = backCards[k];
      lastFront = {
        front: card,
        back,
        frontName: entry.name,
        backName: back ? backNames[k] : null,
      };
      pairs.push(lastFront);
    });
  }

  // Every page must be accounted for.
  if (pageIndex !== pages.length) return null;
  if (separate && backPages && backIndex !== backPages.length) return null;

  return { pairs, backsMissing };
};

/**
 * The resolved pairs as the import dialog's pairing result, with each image
 * named after its card.
 */
export const ppmPairing = (
  project: PpmProject,
  resolution: PpmResolution,
): PairingResult => {
  const { displayName } = ppmLayout(project);
  const renamed = new Map<string, ExtractedCard>();
  const named = (card: ExtractedCard, name: string) => {
    // One File per card name and image, so copies share it.
    const key = `${name}\u0000${card.hash}`;
    let result = renamed.get(key);
    if (!result) {
      result = renameCard(card, displayName(name));
      renamed.set(key, result);
    }
    return result;
  };
  return summarizePairs(
    resolution.pairs.map((pair) => ({
      front: named(pair.front, pair.frontName),
      back: pair.back && pair.backName ? named(pair.back, pair.backName) : null,
    })),
    0,
  );
};

/** The name Proxy PDF Maker gives the separate backs PDF of `fileName`. */
export const backsideFileName = (fileName: string) =>
  fileName.replace(/(\.pdf)?$/i, "_backside.pdf");

/**
 * Whether `backside` is the separate backs PDF of `front`: both carry the
 * same project, and the names follow Proxy PDF Maker's "_backside" rule.
 */
export const isPpmBacksideOf = (
  front: { fileName: string; ppm: PpmProjectInfo | null },
  backside: { fileName: string; ppm: PpmProjectInfo | null },
): boolean =>
  front.ppm !== null &&
  backside.ppm !== null &&
  front.ppm.project.separate_backsides &&
  front.ppm.raw === backside.ppm.raw &&
  backside.fileName.toLowerCase() ===
    backsideFileName(front.fileName).toLowerCase();

/** Rename an extracted image after the card it shows. */
export const renameCard = (
  card: ExtractedCard,
  name: string,
): ExtractedCard => {
  const safe = name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120) || "card";
  const extension = card.file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg";
  return {
    ...card,
    file: new File([card.file], `${safe}${extension}`, {
      type: card.file.type,
    }),
  };
};
