// Pure geometry for a single card's cut line: a rounded rectangle, red,
// centered at a given point. Coordinates follow the bottom-left origin,
// y-up convention used throughout (pdf-spec.ts, silhouette-spec.ts, gridLayout.ts).
import type { DxfEntity } from "./dxf";

const RED = 1;

export function buildRoundedRectEntities(
  center: { cx: number; cy: number },
  width: number,
  height: number,
  radius: number,
): DxfEntity[] {
  const { cx, cy } = center;
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.max(0, Math.min(radius, Math.min(hw, hh)));

  if (r === 0) {
    const corners: [number, number][] = [
      [cx - hw, cy + hh],
      [cx + hw, cy + hh],
      [cx + hw, cy - hh],
      [cx - hw, cy - hh],
    ];
    return corners.map(([x1, y1], i) => {
      const [x2, y2] = corners[(i + 1) % corners.length];
      return { type: "LINE", x1, y1, x2, y2, color: RED };
    });
  }

  const lines: DxfEntity[] = [
    // top
    {
      type: "LINE",
      x1: cx - hw + r,
      y1: cy + hh,
      x2: cx + hw - r,
      y2: cy + hh,
      color: RED,
    },
    // right
    {
      type: "LINE",
      x1: cx + hw,
      y1: cy + hh - r,
      x2: cx + hw,
      y2: cy - hh + r,
      color: RED,
    },
    // bottom
    {
      type: "LINE",
      x1: cx + hw - r,
      y1: cy - hh,
      x2: cx - hw + r,
      y2: cy - hh,
      color: RED,
    },
    // left
    {
      type: "LINE",
      x1: cx - hw,
      y1: cy - hh + r,
      x2: cx - hw,
      y2: cy + hh - r,
      color: RED,
    },
  ];

  const arcs: DxfEntity[] = [
    // top-right
    {
      type: "ARC",
      cx: cx + hw - r,
      cy: cy + hh - r,
      radius: r,
      startAngle: 0,
      endAngle: 90,
      color: RED,
    },
    // top-left
    {
      type: "ARC",
      cx: cx - hw + r,
      cy: cy + hh - r,
      radius: r,
      startAngle: 90,
      endAngle: 180,
      color: RED,
    },
    // bottom-left
    {
      type: "ARC",
      cx: cx - hw + r,
      cy: cy - hh + r,
      radius: r,
      startAngle: 180,
      endAngle: 270,
      color: RED,
    },
    // bottom-right
    {
      type: "ARC",
      cx: cx + hw - r,
      cy: cy - hh + r,
      radius: r,
      startAngle: 270,
      endAngle: 360,
      color: RED,
    },
  ];

  return [...lines, ...arcs];
}
