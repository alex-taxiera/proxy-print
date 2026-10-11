// Orchestrates the DXF cutline template: one closed rounded-rect cut line per
// card grid slot, sized to the nominal (trim) card dimensions and spaced to
// match the print-preview grid. Runs on the main thread — this is a one-shot
// text-generation step, not worth a worker.
//
// Silhouette Studio centers an imported DXF on the page rather than honoring
// absolute coordinates, and the printed grid is centered on the page too, so
// the outlines are shifted to start at the origin (matching DXFs known to
// import correctly) instead of carrying page positions.
import { Settings } from "@/context/SettingsContext";

import { buildRoundedRectOutline } from "./cutlineRect";
import { buildDxfDocument } from "./dxf";
import {
  computeCardSlotCenters,
  computeGridLimits,
  gridColumnsForPrintMode,
} from "./gridLayout";

export function generateCutlineDxf({
  settings,
  cornerRadiusMm,
}: {
  settings: Settings;
  cornerRadiusMm: number;
}): string {
  const limits = computeGridLimits(settings);

  const centers = computeCardSlotCenters({
    pageWidthMm: limits.pageWidthMm,
    pageHeightMm: limits.pageHeightMm,
    rowsPerPage: limits.rowsPerPage,
    columnsPerPage: gridColumnsForPrintMode(
      settings.printMode,
      limits.columnsPerPage,
    ),
    itemWidthMm: limits.itemWidthMm,
    itemHeightMm: limits.itemHeightMm,
    rowGapMm: Number(settings.rowGap),
    columnGapMm: Number(settings.columnGap),
  });

  const cardWidthMm = Number(settings.cardWidth);
  const cardHeightMm = Number(settings.cardHeight);

  const outlines = centers.map((center) =>
    buildRoundedRectOutline(center, cardWidthMm, cardHeightMm, cornerRadiusMm),
  );

  const allVertices = outlines.flatMap((outline) => outline.vertices);
  const minX = Math.min(...allVertices.map((v) => v.x));
  const minY = Math.min(...allVertices.map((v) => v.y));

  const normalized = outlines.map((outline) => ({
    ...outline,
    vertices: outline.vertices.map((v) => ({ x: v.x - minX, y: v.y - minY })),
  }));

  return buildDxfDocument(normalized);
}
