import { describe, expect, it } from "vitest";

import { guessBackMode, matchBacks, pairPdfCards } from "./pair-pdf-cards";
import type { ExtractedCard, ExtractedPage } from "./types";

// Letter page with a centred 3x3 grid of 63x88mm cards.
const W = 612;
const H = 792;
const COLS = [126, 306, 486];
const ROWS = [144, 396, 648];

const card = (
  x: number,
  y: number,
  hash: string,
  drawIndex: number,
): ExtractedCard => ({
  file: new File([hash], `${hash}.jpg`, { type: "image/jpeg" }),
  hash,
  center: { x, y },
  availableBleedMm: 3,
  kind: "normalized",
  drawIndex,
});

const page = (cards: ExtractedCard[]): ExtractedPage => {
  const sorted = [...cards].sort(
    (a, b) => a.center.y - b.center.y || a.center.x - b.center.x,
  );
  const draws = [...cards].sort((a, b) => a.drawIndex - b.drawIndex);
  return { width: W, height: H, cards: sorted, draws };
};

/** Fronts f0..f(n-1) in reading order, drawn left-to-right. */
const frontPage = (n: number, prefix = "f") =>
  page(
    Array.from({ length: n }, (_, i) =>
      card(COLS[i % 3], ROWS[Math.floor(i / 3)], `${prefix}${i}`, i),
    ),
  );

/** Backs for the first n fronts, mirrored and drawn right-to-left per row. */
const mirroredBackPage = (
  n: number,
  hashFor: (i: number) => string = (i) => `b${i}`,
  flip: "long" | "short" = "long",
) =>
  page(
    Array.from({ length: n }, (_, i) => {
      const x = COLS[i % 3];
      const y = ROWS[Math.floor(i / 3)];
      return card(
        flip === "long" ? W - x : x,
        flip === "long" ? y : H - y,
        hashFor(i),
        i,
      );
    }),
  );

const frontHashes = (slots: ReturnType<typeof pairPdfCards>["slots"]) =>
  slots.map((s) => (s.front && "hash" in s.front ? s.front.hash : null));
const backHashes = (slots: ReturnType<typeof pairPdfCards>["slots"]) =>
  slots.map((s) => (s.back && "hash" in s.back ? s.back.hash : null));

describe("matchBacks", () => {
  it("matches long-edge mirrored backs", () => {
    const { matches, unmatched } = matchBacks(
      frontPage(9),
      mirroredBackPage(9),
    );
    expect(unmatched).toBe(0);
    expect(matches.get(0)?.hash).toBe("b0");
    expect(matches.get(2)?.hash).toBe("b2");
  });

  it("matches short-edge mirrored backs when long-edge doesn't fit", () => {
    // A full centred grid mirrors onto itself either way, so long-edge (the
    // common case) wins ties; a partial page tells them apart.
    const { matches, unmatched } = matchBacks(
      frontPage(4),
      mirroredBackPage(4, (i) => `b${i}`, "short"),
    );
    expect(unmatched).toBe(0);
    expect(matches.get(0)?.hash).toBe("b0");
    expect(matches.get(3)?.hash).toBe("b3");
  });

  it("prefers long-edge on a full symmetric grid", () => {
    const { matches } = matchBacks(frontPage(9), mirroredBackPage(9));
    expect(matches.get(0)?.hash).toBe("b0");
  });

  it("tolerates a small back offset", () => {
    const back = mirroredBackPage(9);
    for (const c of back.cards) c.center.x += 8;
    expect(matchBacks(frontPage(9), back).unmatched).toBe(0);
  });

  it("counts backs with no front", () => {
    const back = page([card(10, 10, "stray", 0)]);
    expect(matchBacks(frontPage(9), back).unmatched).toBe(1);
  });
});

describe("pairPdfCards", () => {
  it("pairs duplex pages in reading order", () => {
    const result = pairPdfCards([frontPage(9), mirroredBackPage(9)], "duplex");
    expect(frontHashes(result.slots)).toEqual(
      Array.from({ length: 9 }, (_, i) => `f${i}`),
    );
    expect(backHashes(result.slots)).toEqual(
      Array.from({ length: 9 }, (_, i) => `b${i}`),
    );
    expect(result.withBacks).toBe(9);
    expect(result.sharedBack).toBeNull();
  });

  it("pairs a partial last row", () => {
    const result = pairPdfCards([frontPage(4), mirroredBackPage(4)], "duplex");
    expect(backHashes(result.slots)).toEqual(["b0", "b1", "b2", "b3"]);
  });

  it("leaves a trailing odd page as fronts only", () => {
    const result = pairPdfCards(
      [frontPage(9), mirroredBackPage(9), frontPage(2, "g")],
      "duplex",
    );
    expect(result.slots).toHaveLength(11);
    expect(backHashes(result.slots).slice(9)).toEqual([null, null]);
  });

  it("treats an empty back page as blank backs", () => {
    const result = pairPdfCards([frontPage(9), page([])], "duplex");
    expect(result.withBacks).toBe(0);
  });

  it("reports a shared back when every back is identical", () => {
    const result = pairPdfCards(
      [frontPage(9), mirroredBackPage(9, () => "same")],
      "duplex",
    );
    expect(result.sharedBack).toMatchObject({ hash: "same" });
  });

  it("applies the last page as a shared back", () => {
    const backPage = page([card(W / 2, H / 2, "back", 0)]);
    const result = pairPdfCards(
      [frontPage(9), frontPage(3, "g"), backPage],
      "shared-back",
    );
    expect(result.slots).toHaveLength(12);
    expect(new Set(backHashes(result.slots))).toEqual(new Set(["back"]));
    expect(result.sharedBack).toMatchObject({ hash: "back" });
  });

  it("imports every card as a front with no backs", () => {
    const result = pairPdfCards([frontPage(9), mirroredBackPage(9)], "none");
    expect(result.slots).toHaveLength(18);
    expect(result.withBacks).toBe(0);
  });
});

describe("guessBackMode", () => {
  it("guesses duplex from right-to-left back rows", () => {
    // Draw order: mirroredBackPage's drawIndex follows the front index, so
    // within each row the x position decreases as drawIndex increases.
    expect(guessBackMode([frontPage(9), mirroredBackPage(9)])).toBe("duplex");
  });

  it("guesses duplex from a shared back on each back page", () => {
    const backs = mirroredBackPage(9, () => "same");
    expect(guessBackMode([frontPage(9), backs])).toBe("duplex");
  });

  it("guesses duplex from a partial page that only lines up mirrored", () => {
    const backs = page(
      mirroredBackPage(4).cards.map((c, i) => ({ ...c, drawIndex: 3 - i })),
    );
    // Row 0 drawn left-to-right now, so the only evidence is the lone card
    // in row 1 landing on the right.
    expect(guessBackMode([frontPage(4), backs])).toBe("duplex");
  });

  it("guesses none for two pages of fronts", () => {
    expect(guessBackMode([frontPage(9), frontPage(9, "g")])).toBe("none");
  });

  it("guesses none for a single leftover front on the last page", () => {
    expect(guessBackMode([frontPage(9), frontPage(1, "g")])).toBe("none");
  });

  it("guesses shared-back for a centred lone card on the last page", () => {
    const backPage = page([card(W / 2, H / 2, "back", 0)]);
    expect(guessBackMode([frontPage(9), backPage])).toBe("shared-back");
  });

  it("guesses none for an odd page count of fronts", () => {
    expect(guessBackMode([frontPage(9)])).toBe("none");
  });
});
