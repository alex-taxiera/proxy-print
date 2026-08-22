// Orchestrates the DXF cutline template: one rounded-rect cut line per card
// grid slot, sized to the nominal (trim) card dimensions and positioned to
// match the print-preview grid. Runs on the main thread — this is a one-shot
// text-generation step, not worth a worker.
import { Settings } from "@/context/SettingsContext";

import { buildRoundedRectEntities } from "./cutlineRect";
import { buildDxfDocument } from "./dxf";
import { computeCardSlotCenters, computeGridLimits } from "./gridLayout";

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
    columnsPerPage: limits.columnsPerPage,
    itemWidthMm: limits.itemWidthMm,
    itemHeightMm: limits.itemHeightMm,
    rowGapMm: Number(settings.rowGap),
    columnGapMm: Number(settings.columnGap),
  });

  const cardWidthMm = Number(settings.cardWidth);
  const cardHeightMm = Number(settings.cardHeight);

  const entities = centers.flatMap((center) =>
    buildRoundedRectEntities(center, cardWidthMm, cardHeightMm, cornerRadiusMm),
  );

  return buildDxfDocument(entities);
}
