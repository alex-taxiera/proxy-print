import { PDFDocument } from "pdf-lib";

import { Unit } from "@/context/SettingsContext";
import { useSettingsFormState } from "@/hooks/useSettingsFormState";

/** Syncs the settings form's page size fields to a base PDF's actual page dimensions. */
export const applyBasePdfPageSize = async (
  bytes: Uint8Array,
  unit: Unit,
  handle: ReturnType<typeof useSettingsFormState>["handle"],
) => {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const { width: widthPts, height: heightPts } = page.getSize();

  // Convert pts to the current unit.
  const ptsPerUnit = unit === "mm" ? 72 / 25.4 : 72;
  const pageWidth = (widthPts / ptsPerUnit).toFixed(3);
  const pageHeight = (heightPts / ptsPerUnit).toFixed(3);

  await handle({ pageWidth, pageHeight });
};
