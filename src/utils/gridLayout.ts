// Pure grid-fitting and centering math shared by the print-preview page-limit
// calculation (usePageLimits) and the DXF cutline generator. All output
// lengths are in millimeters.
import { Settings } from "@/context/SettingsContext";

export type GridLimits = {
  rowsPerPage: number;
  columnsPerPage: number;
  cardsPerPage: number;
  /** Per-card grid cell pitch, including bleed edge + guides thickness. */
  itemWidthMm: number;
  itemHeightMm: number;
  pageWidthMm: number;
  pageHeightMm: number;
};

type GridLimitSettings = Pick<
  Settings,
  | "guidesThickness"
  | "enableBleedEdge"
  | "bleedEdge"
  | "cardHeight"
  | "cardWidth"
  | "pageHeight"
  | "pageWidth"
  | "unit"
  | "rowGap"
  | "columnGap"
>;

/**
 * Ports the exact fit math previously duplicated in usePageLimits (hooks/usePreviewData.ts)
 * so pagination and the DXF cutline template stay in sync.
 */
export function computeGridLimits(settings: GridLimitSettings): GridLimits {
  const guidesThickness = parseFloat(settings.guidesThickness); // mm
  const bleedEdge = settings.enableBleedEdge ? Number(settings.bleedEdge) : 0; // mm

  const itemHeightMm =
    Number(settings.cardHeight) + 2 * bleedEdge + guidesThickness;
  const itemWidthMm =
    Number(settings.cardWidth) + 2 * bleedEdge + guidesThickness;

  const mmPerUnit = settings.unit === "in" ? 25.4 : 1;
  const pageHeightMm = parseFloat(settings.pageHeight) * mmPerUnit;
  const pageWidthMm = parseFloat(settings.pageWidth) * mmPerUnit;

  const rowsPerPage = (() => {
    const rowsBeforeGap = Math.floor(pageHeightMm / itemHeightMm);
    const amountOfGaps = rowsBeforeGap - 1;
    const gapHeight = amountOfGaps * Number(settings.rowGap);
    const availableHeight = pageHeightMm - gapHeight;
    return Math.floor(availableHeight / itemHeightMm);
  })();

  const columnsPerPage = (() => {
    const columnsBeforeGap = Math.floor(pageWidthMm / itemWidthMm);
    const amountOfGaps = columnsBeforeGap - 1;
    const gapWidth = amountOfGaps * Number(settings.columnGap);
    const availableWidth = pageWidthMm - gapWidth;
    return Math.floor(availableWidth / itemWidthMm);
  })();

  const cardsPerPage = rowsPerPage * columnsPerPage;

  return {
    rowsPerPage,
    columnsPerPage,
    cardsPerPage,
    itemWidthMm,
    itemHeightMm,
    pageWidthMm,
    pageHeightMm,
  };
}

export type SlotCenter = { cx: number; cy: number };

/**
 * Reproduces the print-preview CSS grid's centered-block layout (see
 * PageGrid in src/components/Preview/Preview.tsx: `justifyContent: center`
 * columns, wrapped in a column-centered `Center`) as pure math. Returns
 * slot centers in mm, bottom-left origin with y increasing upward — the
 * same convention as pdf-spec.ts / silhouette-spec.ts. Order is row-major,
 * top-to-bottom, left-to-right.
 */
export function computeCardSlotCenters({
  pageWidthMm,
  pageHeightMm,
  rowsPerPage,
  columnsPerPage,
  itemWidthMm,
  itemHeightMm,
  rowGapMm,
  columnGapMm,
}: {
  pageWidthMm: number;
  pageHeightMm: number;
  rowsPerPage: number;
  columnsPerPage: number;
  itemWidthMm: number;
  itemHeightMm: number;
  rowGapMm: number;
  columnGapMm: number;
}): SlotCenter[] {
  if (rowsPerPage <= 0 || columnsPerPage <= 0) return [];

  const gridWidthMm =
    columnsPerPage * itemWidthMm + (columnsPerPage - 1) * columnGapMm;
  const gridHeightMm =
    rowsPerPage * itemHeightMm + (rowsPerPage - 1) * rowGapMm;

  const marginXMm = (pageWidthMm - gridWidthMm) / 2;
  const marginTopMm = (pageHeightMm - gridHeightMm) / 2;

  const centers: SlotCenter[] = [];
  for (let row = 0; row < rowsPerPage; row++) {
    const rowTopMm = marginTopMm + row * (itemHeightMm + rowGapMm);
    const centerYFromTopMm = rowTopMm + itemHeightMm / 2;
    const cy = pageHeightMm - centerYFromTopMm;
    for (let col = 0; col < columnsPerPage; col++) {
      const cx =
        marginXMm + col * (itemWidthMm + columnGapMm) + itemWidthMm / 2;
      centers.push({ cx, cy });
    }
  }
  return centers;
}
