import { describe, expect, it } from "vitest";

import {
  computeCardCrop,
  measureCard,
  median,
  PT_PER_MM,
  type Box,
} from "./card-geometry";

const mm = (v: number) => v * PT_PER_MM;
const CARD = { w: mm(63), h: mm(88) };

/** An image box of a 63x88 card with `bleedMm` of bleed, at (x, y). */
const cardImageBox = (bleedMm: number, x = 50, y = 60): Box => ({
  x,
  y,
  w: CARD.w + 2 * mm(bleedMm),
  h: CARD.h + 2 * mm(bleedMm),
});

/** A 300dpi pixel size for a box. */
const px = (box: Box) => ({
  w: Math.round((box.w / 72) * 300),
  h: Math.round((box.h / 72) * 300),
});

const expectClose = (actual: number, expected: number, digits = 1) =>
  expect(actual).toBeCloseTo(expected, digits);

describe("measureCard", () => {
  it("measures 3mm of fully visible bleed", () => {
    const m = measureCard(cardImageBox(3), null, CARD);
    expect(m.kind).toBe("card");
    if (m.kind !== "card") return;
    expectClose(m.visibleBleedPt / PT_PER_MM, 3);
    expectClose(m.availableBleedPt / PT_PER_MM, 3);
  });

  it("finds bleed hidden by a clip", () => {
    const box = cardImageBox(3);
    const clip = {
      x: box.x + mm(2),
      y: box.y + mm(2),
      w: CARD.w + mm(2),
      h: CARD.h + mm(2),
    };
    const m = measureCard(box, clip, CARD);
    expect(m.kind).toBe("card");
    if (m.kind !== "card") return;
    expectClose(m.visibleBleedPt / PT_PER_MM, 1);
    expectClose(m.availableBleedPt / PT_PER_MM, 3);
  });

  it("treats an exact card as zero bleed", () => {
    const m = measureCard(cardImageBox(0), null, CARD);
    expect(m.kind).toBe("card");
    if (m.kind !== "card") return;
    expectClose(m.availableBleedPt, 0);
  });

  it("accepts an inch-sized card within tolerance", () => {
    const box = { x: 0, y: 0, w: 2.48 * 72, h: 3.46 * 72 };
    expect(measureCard(box, null, CARD).kind).toBe("card");
  });

  it("flags a poker-size card against a 63x88 setting when bleed is uneven", () => {
    // Poker (2.5 x 3.5 in) has 1.44 / 2.88 pt more than 63x88: uneven
    // "bleed" of ~0.7 / 1.4 pt per side is within tolerance, so make it
    // clearly larger.
    const box = { x: 0, y: 0, w: mm(70), h: mm(120) };
    const m = measureCard(box, null, CARD);
    expect(m.kind).toBe("mismatch");
  });

  it("ignores small images", () => {
    expect(measureCard({ x: 0, y: 0, w: 40, h: 40 }, null, CARD).kind).toBe(
      "ignore",
    );
  });

  it("ignores an image clipped out of view", () => {
    const box = cardImageBox(3);
    expect(
      measureCard(box, { x: 1000, y: 1000, w: 10, h: 10 }, CARD).kind,
    ).toBe("ignore");
  });

  it("rejects bleed beyond 4.5mm as a mismatch", () => {
    expect(measureCard(cardImageBox(6), null, CARD).kind).toBe("mismatch");
  });

  it("uses the smallest side for available bleed when off-centre", () => {
    const box = cardImageBox(3);
    // Clip hides 1mm on the left: the card centre moves 0.5mm right, so the
    // right side of the image only carries 2.5mm beyond the card.
    const clip = { x: box.x + mm(1), y: box.y, w: box.w - mm(1), h: box.h };
    const m = measureCard(box, clip, CARD);
    expect(m.kind).toBe("card");
    if (m.kind !== "card") return;
    expectClose(m.availableBleedPt / PT_PER_MM, 2.5);
  });

  it("treats uneven visible bleed beyond tolerance as a mismatch", () => {
    const box = cardImageBox(3);
    const clip = { x: box.x + mm(2), y: box.y, w: box.w - mm(4), h: box.h };
    expect(measureCard(box, clip, CARD).kind).toBe("mismatch");
  });
});

describe("computeCardCrop", () => {
  const crop3 = (bleedMm: number, clip: Box | null = null) => {
    const box = cardImageBox(bleedMm);
    const m = measureCard(box, clip, CARD);
    if (m.kind !== "card") throw new Error("expected card");
    const imagePx = px(box);
    return {
      imagePx,
      ...computeCardCrop({
        imageBox: box,
        imagePx,
        center: m.center,
        cardPt: CARD,
        bleedPt: mm(3),
      }),
    };
  };

  it("uses the whole image when it has exactly 3mm", () => {
    const { crop, pad, imagePx } = crop3(3);
    expectClose(crop.x, 0);
    expectClose(crop.y, 0);
    expectClose(crop.w, imagePx.w, 0);
    expectClose(crop.h, imagePx.h, 0);
    expect(Math.max(pad.l, pad.t, pad.r, pad.b)).toBeLessThan(0.01);
  });

  it("recovers hidden bleed without padding", () => {
    const box = cardImageBox(3);
    const clip = {
      x: box.x + mm(2),
      y: box.y + mm(2),
      w: CARD.w + mm(2),
      h: CARD.h + mm(2),
    };
    const { pad } = crop3(3, clip);
    expect(Math.max(pad.l, pad.t, pad.r, pad.b)).toBeLessThan(0.01);
  });

  it("pads 2mm per side for a 1mm image", () => {
    const { pad } = crop3(1);
    const twoMmPx = (mm(2) / 72) * 300;
    for (const side of [pad.l, pad.t, pad.r, pad.b]) {
      expect(side).toBeCloseTo(twoMmPx, 0);
    }
  });

  it("pads 1mm per side for a 2mm image", () => {
    const { pad } = crop3(2);
    const oneMmPx = (mm(1) / 72) * 300;
    expect(pad.l).toBeCloseTo(oneMmPx, 0);
    expect(pad.b).toBeCloseTo(oneMmPx, 0);
  });

  it("trims a 4.5mm image down to 3mm", () => {
    const { crop, pad } = crop3(4.5);
    const trimPx = (mm(1.5) / 72) * 300;
    expect(crop.x).toBeCloseTo(trimPx, 0);
    expect(crop.y).toBeCloseTo(trimPx, 0);
    expect(Math.max(pad.l, pad.t, pad.r, pad.b)).toBeLessThan(0.01);
  });

  it("yields the 3mm-bleed aspect ratio", () => {
    const { crop } = crop3(1);
    expect(crop.w / crop.h).toBeCloseTo(69 / 94, 3);
  });

  it("crops the bare card when bleed is 0", () => {
    const box = cardImageBox(0);
    const imagePx = px(box);
    const { crop, pad } = computeCardCrop({
      imageBox: box,
      imagePx,
      center: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
      cardPt: CARD,
      bleedPt: 0,
    });
    expectClose(crop.w, imagePx.w, 0);
    expect(Math.max(pad.l, pad.t, pad.r, pad.b)).toBeLessThan(0.01);
  });
});

describe("median", () => {
  it("handles odd, even and empty lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});
