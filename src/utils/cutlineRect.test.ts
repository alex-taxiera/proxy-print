import { describe, expect, it } from "vitest";

import { buildRoundedRectEntities } from "./cutlineRect";
import type { DxfArcEntity, DxfLineEntity } from "./dxf";

describe("buildRoundedRectEntities", () => {
  it("radius 0 produces 4 lines forming an exact rectangle, no arcs", () => {
    const entities = buildRoundedRectEntities({ cx: 10, cy: 20 }, 40, 60, 0);
    expect(entities).toHaveLength(4);
    expect(entities.every((e) => e.type === "LINE")).toBe(true);

    const lines = entities as DxfLineEntity[];
    const xs = lines.flatMap((l) => [l.x1, l.x2]);
    const ys = lines.flatMap((l) => [l.y1, l.y2]);
    expect(Math.min(...xs)).toBe(10 - 20);
    expect(Math.max(...xs)).toBe(10 + 20);
    expect(Math.min(...ys)).toBe(20 - 30);
    expect(Math.max(...ys)).toBe(20 + 30);
  });

  it("radius > 0 produces 4 lines + 4 arcs, all red", () => {
    const entities = buildRoundedRectEntities({ cx: 0, cy: 0 }, 40, 60, 5);
    expect(entities).toHaveLength(8);
    expect(entities.filter((e) => e.type === "LINE")).toHaveLength(4);
    expect(entities.filter((e) => e.type === "ARC")).toHaveLength(4);
    expect(entities.every((e) => e.color === 1)).toBe(true);
  });

  it("arcs have the requested radius and 90-degree sweeps covering 0-360", () => {
    const entities = buildRoundedRectEntities({ cx: 0, cy: 0 }, 40, 60, 5);
    const arcs = entities.filter((e): e is DxfArcEntity => e.type === "ARC");
    for (const arc of arcs) {
      expect(arc.radius).toBe(5);
      expect(arc.endAngle - arc.startAngle).toBe(90);
    }
    const angles = arcs.map((a) => a.startAngle).sort((a, b) => a - b);
    expect(angles).toEqual([0, 90, 180, 270]);
  });

  it("clamps radius to half the smaller dimension", () => {
    const entities = buildRoundedRectEntities({ cx: 0, cy: 0 }, 40, 60, 1000);
    const arc = entities.find((e) => e.type === "ARC");
    expect(arc?.type).toBe("ARC");
    if (arc?.type === "ARC") {
      expect(arc.radius).toBe(20); // half of the smaller dimension (40)
    }
  });

  it("negative radius is treated as 0", () => {
    const entities = buildRoundedRectEntities({ cx: 0, cy: 0 }, 40, 60, -5);
    expect(entities.every((e) => e.type === "LINE")).toBe(true);
  });
});
