import { describe, expect, it } from "vitest";

import {
  formatMpcFillQuery,
  normalizeMpcFillQuery,
  parseMpcFillQuery,
  stripImageExtension,
} from "@/queries/mpcfill/normalize-query";

describe("normalizeMpcFillQuery", () => {
  it("lowercases and trims", () => {
    expect(normalizeMpcFillQuery("  Lightning Bolt ")).toBe("lightning bolt");
  });

  it("drops bracketed variant and tag text", () => {
    expect(normalizeMpcFillQuery("Lightning Bolt (Full Art B)")).toBe(
      "lightning bolt",
    );
    expect(normalizeMpcFillQuery("Opt [NSFW]")).toBe("opt");
  });

  it("turns hyphens into spaces and strips other punctuation", () => {
    expect(normalizeMpcFillQuery("Jace, Vryn's Prodigy")).toBe(
      "jace vryns prodigy",
    );
    expect(normalizeMpcFillQuery("Will-o'-the-Wisp")).toBe("will o the wisp");
    expect(normalizeMpcFillQuery("Urza’s Saga")).toBe("urzas saga");
  });

  it("strips digits and collapses the whitespace left behind", () => {
    expect(normalizeMpcFillQuery("Fire // Ice 2")).toBe("fire ice");
  });
});

describe("parseMpcFillQuery", () => {
  it("treats an unprefixed query as a card", () => {
    expect(parseMpcFillQuery(" Black Lotus ")).toEqual({
      query: "Black Lotus",
      cardType: "CARD",
    });
  });

  it("reads the token and card back prefixes", () => {
    expect(parseMpcFillQuery("t:treasure")).toEqual({
      query: "treasure",
      cardType: "TOKEN",
    });
    expect(parseMpcFillQuery("B: black lotus")).toEqual({
      query: "black lotus",
      cardType: "CARDBACK",
    });
  });

  it("leaves other colons alone", () => {
    expect(parseMpcFillQuery("Circle of Protection: Red").cardType).toBe(
      "CARD",
    );
  });
});

describe("formatMpcFillQuery", () => {
  it("adds the prefix MPC Autofill writes into XML", () => {
    expect(formatMpcFillQuery("lightning bolt", "CARD")).toBe("lightning bolt");
    expect(formatMpcFillQuery("treasure", "TOKEN")).toBe("t:treasure");
    expect(formatMpcFillQuery("black lotus", "CARDBACK")).toBe("b:black lotus");
  });

  it("round-trips through parseMpcFillQuery", () => {
    expect(parseMpcFillQuery(formatMpcFillQuery("treasure", "TOKEN"))).toEqual({
      query: "treasure",
      cardType: "TOKEN",
    });
  });
});

describe("stripImageExtension", () => {
  it("removes image extensions only", () => {
    expect(stripImageExtension("Lightning Bolt (Full Art B).png")).toBe(
      "Lightning Bolt (Full Art B)",
    );
    expect(stripImageExtension("Dr. Who")).toBe("Dr. Who");
  });
});
