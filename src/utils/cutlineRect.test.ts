import { describe, expect, it } from "vitest";

import { buildRoundedRectOutline } from "./cutlineRect";
import type { DxfPoint } from "./dxf";

function bounds(vertices: DxfPoint[]) {
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

describe("buildRoundedRectOutline", () => {
  it("radius 0 produces a closed 4-vertex rectangle", () => {
    const outline = buildRoundedRectOutline({ cx: 10, cy: 20 }, 40, 60, 0);
    expect(outline.closed).toBe(true);
    expect(outline.vertices).toHaveLength(4);
    expect(bounds(outline.vertices)).toEqual({
      minX: -10,
      maxX: 30,
      minY: -10,
      maxY: 50,
    });
  });

  it("radius > 0 flattens each corner into 33 vertices", () => {
    const outline = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, 5);
    expect(outline.closed).toBe(true);
    expect(outline.vertices).toHaveLength(4 * 33);
    const b = bounds(outline.vertices);
    expect(b.minX).toBeCloseTo(-20);
    expect(b.maxX).toBeCloseTo(20);
    expect(b.minY).toBeCloseTo(-30);
    expect(b.maxY).toBeCloseTo(30);
  });

  it("honors a custom segment count", () => {
    const outline = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, 5, 8);
    expect(outline.vertices).toHaveLength(4 * 9);
  });

  it("places every vertex on the rounded-rect outline", () => {
    const hw = 20;
    const hh = 30;
    const r = 5;
    const outline = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, r);
    for (const { x, y } of outline.vertices) {
      // Distance from the inner rect (shrunk by r) must equal r.
      const dx = Math.max(Math.abs(x) - (hw - r), 0);
      const dy = Math.max(Math.abs(y) - (hh - r), 0);
      expect(Math.hypot(dx, dy)).toBeCloseTo(r);
    }
  });

  it("winds clockwise", () => {
    const { vertices } = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, 5);
    const signedArea = vertices.reduce((sum, v, i) => {
      const next = vertices[(i + 1) % vertices.length];
      return sum + (v.x * next.y - next.x * v.y);
    }, 0);
    expect(signedArea).toBeLessThan(0);
  });

  it("clamps radius to half the smaller dimension", () => {
    const outline = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, 1000);
    // r = 20: the left/right sides collapse to points at y = ±10
    const b = bounds(outline.vertices);
    expect(b.minX).toBeCloseTo(-20);
    expect(b.maxX).toBeCloseTo(20);
    expect(b.maxY).toBeCloseTo(30);
  });

  it("negative radius is treated as 0", () => {
    const outline = buildRoundedRectOutline({ cx: 0, cy: 0 }, 40, 60, -5);
    expect(outline.vertices).toHaveLength(4);
  });
});
