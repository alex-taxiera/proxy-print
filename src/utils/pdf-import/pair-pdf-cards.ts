// Pairs extracted card fronts with their backs.
//
// Duplex PDFs print backs on the following page, mirrored so they line up when
// the sheet is flipped. The mirror is about the vertical axis for a long-edge
// flip and about the horizontal axis for a short-edge flip; we try both.
// Matching is by mirrored position, like FleemProxyCompanion's
// `mirrored_match`, but with a wider tolerance (backs may be nudged by a
// printer offset) and without requiring a particular draw order.
import type { SlotInputData } from "@/context/ImagesContext";

import type { ExtractedCard, ExtractedPage, ImportedImage } from "./types";

export type BackMode = "none" | "duplex" | "shared-back";

/** Max distance (pt) between a front and a mirrored back to pair them. */
export const MIRROR_TOLERANCE_PT = 20;
/** Cards whose centres differ by less than this (pt) share a row. */
const ROW_TOLERANCE_PT = 20;

type Flip = "long" | "short";

const mirror = (
  card: ExtractedCard,
  page: ExtractedPage,
  flip: Flip,
): { x: number; y: number } =>
  flip === "long"
    ? { x: page.width - card.center.x, y: card.center.y }
    : { x: card.center.x, y: page.height - card.center.y };

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Match each back card to a front card by mirrored position. Returns a map of
 * front index → back card, picking whichever flip direction matches more.
 */
export const matchBacks = (
  front: ExtractedPage,
  back: ExtractedPage,
): { matches: Map<number, ExtractedCard>; unmatched: number } => {
  let best: Map<number, ExtractedCard> = new Map();

  for (const flip of ["long", "short"] as const) {
    const candidates: { f: number; b: number; d: number }[] = [];
    back.cards.forEach((card, b) => {
      const target = mirror(card, back, flip);
      front.cards.forEach((frontCard, f) => {
        const d = distance(target, frontCard.center);
        if (d <= MIRROR_TOLERANCE_PT) candidates.push({ f, b, d });
      });
    });
    candidates.sort((x, y) => x.d - y.d);

    const usedFronts = new Set<number>();
    const usedBacks = new Set<number>();
    const matches = new Map<number, ExtractedCard>();
    for (const { f, b } of candidates) {
      if (usedFronts.has(f) || usedBacks.has(b)) continue;
      usedFronts.add(f);
      usedBacks.add(b);
      matches.set(f, back.cards[b]);
    }
    if (matches.size > best.size) best = matches;
  }

  return { matches: best, unmatched: back.cards.length - best.size };
};

/** The card's MPCFill art when known, otherwise its extracted pixels. */
const toImage = (card: ExtractedCard): ImportedImage =>
  card.remote ?? { file: card.file, hash: card.hash };

const identity = (image: ImportedImage) =>
  "hash" in image ? image.hash : "id" in image ? `id:${image.id}` : image.uri;

export type PairingResult = {
  slots: SlotInputData[];
  /** Extracted pixels for each slot's faces, for previews. */
  previews: { front: File; back: File | null }[];
  /** Set when every back is the same image. */
  sharedBack: ImportedImage | null;
  /** Backs that couldn't be matched to a front. */
  unmatchedBacks: number;
  /** Slots that ended up with a back. */
  withBacks: number;
};

type Pair = { front: ExtractedCard; back: ExtractedCard | null };

const summarize = (pairs: Pair[], unmatchedBacks: number): PairingResult => {
  const slots = pairs.map(({ front, back }) => ({
    front: toImage(front),
    back: back ? toImage(back) : null,
  }));
  const backs = slots
    .map((slot) => slot.back)
    .filter((back): back is ImportedImage => back !== null);
  const sharedBack =
    backs.length > 0 &&
    backs.every((back) => identity(back) === identity(backs[0]))
      ? backs[0]
      : null;
  return {
    slots,
    previews: pairs.map(({ front, back }) => ({
      front: front.file,
      back: back?.file ?? null,
    })),
    sharedBack,
    unmatchedBacks,
    withBacks: backs.length,
  };
};

export const pairPdfCards = (
  pages: ExtractedPage[],
  mode: BackMode,
): PairingResult => {
  if (mode === "duplex") {
    const pairs: Pair[] = [];
    let unmatchedBacks = 0;
    for (let i = 0; i < pages.length; i += 2) {
      const front = pages[i];
      const back = pages[i + 1];
      const { matches, unmatched } = back
        ? matchBacks(front, back)
        : { matches: new Map<number, ExtractedCard>(), unmatched: 0 };
      unmatchedBacks += unmatched;
      front.cards.forEach((card, index) => {
        pairs.push({ front: card, back: matches.get(index) ?? null });
      });
    }
    return summarize(pairs, unmatchedBacks);
  }

  if (mode === "shared-back" && pages.length >= 2) {
    const back = pages[pages.length - 1].cards[0];
    if (back) {
      const pairs = pages
        .slice(0, -1)
        .flatMap((page) => page.cards)
        .map((front) => ({ front, back }));
      return summarize(pairs, 0);
    }
  }

  const pairs = pages
    .flatMap((page) => page.cards)
    .map((front) => ({ front, back: null }));
  return summarize(pairs, 0);
};

/** Group cards into rows by centre y. */
const rowsOf = (cards: ExtractedCard[]): ExtractedCard[][] => {
  const rows: ExtractedCard[][] = [];
  for (const card of [...cards].sort((a, b) => a.center.y - b.center.y)) {
    const row = rows.find(
      (r) => Math.abs(r[0].center.y - card.center.y) < ROW_TOLERANCE_PT,
    );
    if (row) row.push(card);
    else rows.push([card]);
  }
  return rows;
};

/**
 * Positive evidence that `back` really is the back of `front`, beyond the
 * positions lining up (a centred grid mirrors onto itself, so two pages of
 * fronts would line up too).
 */
const looksLikeBackPage = (
  front: ExtractedPage,
  back: ExtractedPage,
): boolean => {
  // A blank page after a front page: blank backs.
  if (back.cards.length === 0) return true;

  // Every back is the same image (a shared card back). A single leftover card
  // on a fronts-only PDF would trivially pass, so require at least two.
  if (
    back.cards.length >= 2 &&
    back.cards.every((card) => card.hash === back.cards[0].hash)
  ) {
    return true;
  }

  // Backs drawn right-to-left within each row: the order a duplex generator
  // produces when it mirrors the rows (this app and Fleem both do).
  const multiRows = rowsOf(back.cards).filter((row) => row.length > 1);
  if (
    multiRows.length > 0 &&
    multiRows.every((row) => {
      const drawn = [...row].sort((a, b) => a.drawIndex - b.drawIndex);
      return drawn.every(
        (card, i) => i === 0 || card.center.x < drawn[i - 1].center.x,
      );
    })
  ) {
    return true;
  }

  // A partial page whose cards only line up when mirrored.
  const unmirrored = back.cards.every((card) =>
    front.cards.some(
      (frontCard) =>
        distance(card.center, frontCard.center) <= MIRROR_TOLERANCE_PT,
    ),
  );
  return !unmirrored;
};

/** A best guess at how the PDF lays out its backs, to preselect in the UI. */
export const guessBackMode = (pages: ExtractedPage[]): BackMode => {
  if (pages.length >= 2 && pages.length % 2 === 0) {
    let consistent = true;
    let evidence = false;
    let anyBacks = false;
    for (let i = 0; i < pages.length; i += 2) {
      const front = pages[i];
      const back = pages[i + 1];
      if (front.cards.length === 0 || back.cards.length > front.cards.length) {
        consistent = false;
        break;
      }
      const { unmatched } = matchBacks(front, back);
      if (unmatched > 0) {
        consistent = false;
        break;
      }
      if (back.cards.length > 0) anyBacks = true;
      if (looksLikeBackPage(front, back)) evidence = true;
    }
    if (consistent && evidence && anyBacks) return "duplex";
  }

  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const last = lastPage.cards;
    const rest = pages.slice(0, -1).flatMap((page) => page.cards);
    const lastIsOneImage =
      last.length > 0 && last.every((card) => card.hash === last[0].hash);
    // A lone card is only a shared back when it's centred on its page; a
    // leftover front on a fronts-only PDF sits in the first grid cell.
    const loneCardCentred =
      last.length !== 1 ||
      Math.abs(last[0].center.x - lastPage.width / 2) < MIRROR_TOLERANCE_PT;
    if (lastIsOneImage && loneCardCentred && rest.length > last.length) {
      return "shared-back";
    }
  }

  return "none";
};
