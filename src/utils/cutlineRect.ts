// Pure geometry for a single card's cut line: a closed rounded rectangle
// centered at a given point, with each corner arc flattened into straight
// segments. Coordinates follow the bottom-left origin, y-up convention used
// throughout (pdf-spec.ts, silhouette-spec.ts, gridLayout.ts).
import type { DxfPoint, DxfPolylineEntity } from "./dxf";

const DEFAULT_SEGMENTS_PER_CORNER = 32;

export function buildRoundedRectOutline(
  center: { cx: number; cy: number },
  width: number,
  height: number,
  radius: number,
  segmentsPerCorner = DEFAULT_SEGMENTS_PER_CORNER,
): DxfPolylineEntity {
  const { cx, cy } = center;
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.max(0, Math.min(radius, Math.min(hw, hh)));

  if (r === 0) {
    return {
      type: "POLYLINE",
      closed: true,
      vertices: [
        { x: cx + hw, y: cy + hh },
        { x: cx + hw, y: cy - hh },
        { x: cx - hw, y: cy - hh },
        { x: cx - hw, y: cy + hh },
      ],
    };
  }

  // Clockwise: bottom-right, bottom-left, top-left, top-right. Each arc sweeps
  // -90° from its start angle; the straight edges are the segments joining
  // one arc's last vertex to the next arc's first (and the closing segment).
  const corners = [
    { x: cx + hw - r, y: cy - hh + r, startDeg: 0 },
    { x: cx - hw + r, y: cy - hh + r, startDeg: -90 },
    { x: cx - hw + r, y: cy + hh - r, startDeg: 180 },
    { x: cx + hw - r, y: cy + hh - r, startDeg: 90 },
  ];

  const vertices: DxfPoint[] = corners.flatMap((corner) =>
    Array.from({ length: segmentsPerCorner + 1 }, (_, i) => {
      const deg = corner.startDeg - (90 * i) / segmentsPerCorner;
      const rad = (deg * Math.PI) / 180;
      return {
        x: corner.x + r * Math.cos(rad),
        y: corner.y + r * Math.sin(rad),
      };
    }),
  );

  return { type: "POLYLINE", closed: true, vertices };
}
