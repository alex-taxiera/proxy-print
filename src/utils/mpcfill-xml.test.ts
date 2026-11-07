// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { SlotInputData } from "@/context/ImagesContext";

import { bracketFor, buildMpcFillXml } from "./mpcfill-xml";
import { parseMpcFillXml } from "./parse-mpcfill-xml";

const google = (id: string, name = `${id}.png`, query?: string) =>
  query ? { id, name, query } : { id, name };

describe("bracketFor", () => {
  it("rounds up to the next MPC bracket", () => {
    expect(bracketFor(1)).toBe(18);
    expect(bracketFor(18)).toBe(18);
    expect(bracketFor(19)).toBe(36);
    expect(bracketFor(100)).toBe(108);
    expect(bracketFor(613)).toBeNull();
  });
});

describe("buildMpcFillXml", () => {
  it("round-trips the sample order", () => {
    const text = readFileSync(
      path.resolve(__dirname, "../../test/rats.xml"),
      "utf8",
    );
    const parsed = parseMpcFillXml(text);
    const { xml, exported, skipped } = buildMpcFillXml(
      parsed.slots,
      parsed.defaultCardBack,
    );
    expect(skipped).toBe(0);
    expect(exported).toBe(parsed.slots.length);
    expect(parseMpcFillXml(xml).slots).toEqual(parsed.slots);
  });

  it("groups repeated ids and keeps queries", () => {
    const slots: SlotInputData[] = [
      { front: google("a", "Island.png", "island"), back: null },
      { front: google("b"), back: google("x") },
      { front: google("a", "Island.png", "island"), back: google("x") },
    ];
    const { xml } = buildMpcFillXml(slots, null);
    expect(xml).toContain("<slots>0,2</slots>");
    expect(xml).toContain("<query>island</query>");
    expect(xml).toContain("<query>b</query>");
    expect(xml).toMatch(/<backs>[\s\S]*<id>x<\/id>[\s\S]*<slots>1,2<\/slots>/);

    // A missing query is derived from the name on export.
    const reparsed = parseMpcFillXml(xml).slots;
    expect(reparsed[2]).toEqual({
      front: google("a", "Island.png", "island"),
      back: google("x", "x.png", "x"),
    });
  });

  it("skips non-MPCFill fronts and renumbers slots", () => {
    const local = {
      file: new File(["x"], "x.png"),
      hash: "h",
    };
    const slots: SlotInputData[] = [
      { front: local, back: null },
      { front: { uri: "https://example.com/c.png", name: "c" }, back: null },
      { front: google("a"), back: local },
    ];
    const result = buildMpcFillXml(slots, null);
    expect(result.exported).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.skippedBacks).toBe(1);
    expect(result.xml).toContain("<slots>0</slots>");
    expect(result.xml).not.toContain("<backs>");
  });

  it("writes an MPCFill default card back", () => {
    const { xml } = buildMpcFillXml(
      [{ front: google("a"), back: null }],
      google("cb"),
    );
    expect(xml).toContain("<cardback>cb</cardback>");
    expect(parseMpcFillXml(xml).defaultCardBack?.id).toBe("cb");
  });

  it("leaves the card back empty when it isn't an MPCFill image", () => {
    const { xml } = buildMpcFillXml([{ front: google("a"), back: null }], {
      uri: "https://example.com/b.png",
      name: "b",
    });
    expect(xml).toContain("<cardback></cardback>");
  });

  it("escapes special characters", () => {
    const { xml } = buildMpcFillXml(
      [{ front: google("a", "Fire & Ice <promo>.png"), back: null }],
      null,
    );
    expect(xml).toContain("Fire &amp; Ice &lt;promo&gt;.png");
    expect(parseMpcFillXml(xml).slots[0].front).toMatchObject({
      name: "Fire & Ice <promo>.png",
    });
  });

  it("refuses orders over the largest bracket", () => {
    const slots = Array.from({ length: 613 }, () => ({
      front: google("a"),
      back: null,
    }));
    expect(() => buildMpcFillXml(slots, null)).toThrow(/612/);
  });
});
