import { nanoid } from "nanoid";
import { useContext, useMemo } from "react";

import {
  CardSlot,
  ImageData,
  ImagesContext,
  PossiblyEmptyImage,
} from "~/context/ImagesContext";
import { useSettingsStore } from "~/store/settingsStore";

export const usePageLimits = () => {
  const settings = useSettingsStore((s) => s.settings);

  const guidesThickness = parseFloat(settings.guidesThickness); // mm
  const bleedEdge = settings.enableBleedEdge ? Number(settings.bleedEdge) : 0; // mm

  // Adjust card height based on card size
  const cardHeight =
    Number(settings.cardHeight) + 2 * bleedEdge + guidesThickness;
  const cardWidth =
    Number(settings.cardWidth) + 2 * bleedEdge + guidesThickness;

  const rowsPerPage = useMemo(() => {
    // convert in to mm when settings.unit is set to "in"
    const pageHeight =
      parseFloat(settings.pageHeight) * (settings.unit === "in" ? 25.4 : 1);

    const rowsBeforeGap = Math.floor(pageHeight / cardHeight);
    const amountOfGaps = rowsBeforeGap - 1;
    const gapHeight = amountOfGaps * Number(settings.rowGap);
    const availableHeight = pageHeight - gapHeight;
    const rowsAfterGap = Math.floor(availableHeight / cardHeight);
    return rowsAfterGap;
  }, [settings, cardHeight]);

  const columnsPerPage = useMemo(() => {
    const pageWidth =
      parseFloat(settings.pageWidth) * (settings.unit === "in" ? 25.4 : 1);

    const columnsBeforeGap = Math.floor(pageWidth / cardWidth);
    const amountOfGaps = columnsBeforeGap - 1;
    const gapWidth = amountOfGaps * Number(settings.columnGap);
    const availableWidth = pageWidth - gapWidth;
    const columnsAfterGap = Math.floor(availableWidth / cardWidth);
    return columnsAfterGap;
  }, [settings, cardWidth]);

  const cardsPerPage = useMemo(
    () => rowsPerPage * columnsPerPage,
    [rowsPerPage, columnsPerPage],
  );

  return {
    rowsPerPage,
    columnsPerPage,
    cardsPerPage,
  };
};

export type PreviewPageItem = {
  image: PossiblyEmptyImage;
  /** Slot ID this image belongs to, null for filler/padding */
  slotId: string | null;
  /** Which face of the slot this image represents */
  face: "front" | "back";
};

export type PreviewPage = {
  items: PreviewPageItem[];
  /** front/back: duplex pages; side-by-side: interleaved pairs on one page */
  pageType: "front" | "back" | "side-by-side";
  /** Actual CSS grid column count for this page */
  gridColumns: number;
  /**
   * Indices into sortedSlots for the first and last card on this page.
   * Used by drag-to-page DnD to insert cards at the correct position.
   */
  insertBoundary: { first: number; last: number };
};

function buildBackRow(
  slots: (CardSlot | null)[],
  defaultBack: ImageData | null,
): PreviewPageItem[] {
  return slots
    .map((slot): PreviewPageItem => {
      if (!slot) {
        return {
          image: { uuid: nanoid(), name: "empty" },
          slotId: null,
          face: "back",
        };
      }
      if (slot.back) {
        return { image: slot.back, slotId: slot.id, face: "back" };
      }
      if (defaultBack && slot.id && slot.front) {
        return {
          image: { ...defaultBack, uuid: `${slot.id}:back-preview` },
          slotId: slot.id,
          face: "back",
        };
      }
      return {
        image: { uuid: `${slot.id}:back-empty`, name: "empty" },
        slotId: slot.id,
        face: "back",
      };
    })
    .reverse(); // Mirror columns for duplex printing alignment
}

export const usePreviewData = () => {
  const { sortedSlots } = useContext(ImagesContext);
  const settings = useSettingsStore((s) => s.settings);
  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);
  const { cardsPerPage, rowsPerPage, columnsPerPage } = usePageLimits();
  const printMode = settings.printMode;

  const pages = useMemo((): PreviewPage[] => {
    if (sortedSlots.length === 0) return [];

    if (printMode === "duplex") {
      const result: PreviewPage[] = [];

      for (let i = 0; i < sortedSlots.length; i += cardsPerPage) {
        const chunk = sortedSlots.slice(i, i + cardsPerPage);

      const chunkStart = i;
      const chunkEnd = Math.min(i + cardsPerPage, sortedSlots.length) - 1;

        // Front page
        const frontItems: PreviewPageItem[] = chunk.map((slot) => ({
          image: slot.front ?? { uuid: `${slot.id}:front-empty`, name: "empty" },
          slotId: slot.id,
          face: "front" as const,
        }));
        while (frontItems.length < cardsPerPage) {
          frontItems.push({ image: { uuid: nanoid(), name: "empty" }, slotId: null, face: "front" });
        }
        result.push({ items: frontItems, pageType: "front", gridColumns: columnsPerPage, insertBoundary: { first: chunkStart, last: chunkEnd } });

        // Back page — per-row column reversal for duplex alignment
        const backItems: PreviewPageItem[] = [];
        for (let r = 0; r < cardsPerPage; r += columnsPerPage) {
          const rowSlots: (CardSlot | null)[] = Array.from(
            { length: columnsPerPage },
            (_, j) => chunk[r + j] ?? null,
          );
          backItems.push(...buildBackRow(rowSlots, defaultCardBack));
        }
        result.push({ items: backItems, pageType: "back", gridColumns: columnsPerPage, insertBoundary: { first: chunkStart, last: chunkEnd } });
      }

      return result;
    }

    if (printMode === "side-by-side") {
      // Pairs are always adjacent; use floor(cols/2) pairs per row so each pair
      // fits in one row without wrapping onto the next.
      const pairsPerRow = Math.max(1, Math.floor(columnsPerPage / 2));
      const gridColumns = pairsPerRow * 2;
      const slotsPerPage = pairsPerRow * rowsPerPage;
      const result: PreviewPage[] = [];

      for (let i = 0; i < sortedSlots.length; i += slotsPerPage) {
        const chunk = sortedSlots.slice(i, i + slotsPerPage);
        const items: PreviewPageItem[] = [];

        for (const slot of chunk) {
          items.push({
            image: slot.front ?? { uuid: `${slot.id}:front-empty`, name: "empty" },
            slotId: slot.id,
            face: "front",
          });
          const backImg =
            slot.back ??
            (defaultCardBack ? { ...defaultCardBack, uuid: `${slot.id}:back-preview` } : null);
          items.push({
            image: backImg ?? { uuid: `${slot.id}:back-empty`, name: "empty" },
            slotId: slot.id,
            face: "back",
          });
        }

        while (items.length < slotsPerPage * 2) {
          items.push({ image: { uuid: nanoid(), name: "empty" }, slotId: null, face: "front" });
        }

        result.push({ items, pageType: "side-by-side", gridColumns, insertBoundary: { first: i, last: Math.min(i + slotsPerPage, sortedSlots.length) - 1 } });
      }

      return result;
    }

    if (printMode === "inline-faces") {
      // Normal grid layout with fronts and backs interleaved.
      // Each slot emits a front cell plus a back cell only if it has a specific
      // back. Items flow left-to-right, top-to-bottom filling cardsPerPage cells
      // per page. The default card back is never used — no blank placeholders.
      const allItems: PreviewPageItem[] = [];
      for (const slot of sortedSlots) {
        allItems.push({
          image: slot.front ?? { uuid: `${slot.id}:front-empty`, name: "empty" },
          slotId: slot.id,
          face: "front",
        });
        if (slot.back) {
          allItems.push({
            image: slot.back,
            slotId: slot.id,
            face: "back",
          });
        }
      }

      const result: PreviewPage[] = [];
      for (let i = 0; i < allItems.length; i += cardsPerPage) {
        const chunk = allItems.slice(i, i + cardsPerPage);
        const items = [...chunk];
        while (items.length < cardsPerPage) {
          items.push({ image: { uuid: nanoid(), name: "empty" }, slotId: null, face: "front" });
        }
        // insertBoundary: find the sortedSlots index range covered by this page
        const firstSlotId = chunk.find((it) => it.slotId)?.slotId ?? null;
        const lastSlotId = [...chunk].reverse().find((it) => it.slotId)?.slotId ?? null;
        const firstIdx = firstSlotId ? sortedSlots.findIndex((s) => s.id === firstSlotId) : 0;
        const lastIdx = lastSlotId ? sortedSlots.findIndex((s) => s.id === lastSlotId) : sortedSlots.length - 1;
        result.push({
          items,
          pageType: "side-by-side",
          gridColumns: columnsPerPage,
          insertBoundary: { first: firstIdx, last: lastIdx },
        });
      }

      return result;
    }

    if (printMode === "fronts-only") {
      const result: PreviewPage[] = [];
      for (let i = 0; i < sortedSlots.length; i += cardsPerPage) {
        const chunk = sortedSlots.slice(i, i + cardsPerPage);
        const items: PreviewPageItem[] = chunk.map((slot) => ({
          image: slot.front ?? { uuid: `${slot.id}:front-empty`, name: "empty" },
          slotId: slot.id,
          face: "front" as const,
        }));
        while (items.length < cardsPerPage) {
          items.push({ image: { uuid: nanoid(), name: "empty" }, slotId: null, face: "front" });
        }
        result.push({ items, pageType: "front", gridColumns: columnsPerPage, insertBoundary: { first: i, last: Math.min(i + cardsPerPage, sortedSlots.length) - 1 } });
      }
      return result;
    }

    if (printMode === "backs-only") {
      const result: PreviewPage[] = [];
      for (let i = 0; i < sortedSlots.length; i += cardsPerPage) {
        const chunk = sortedSlots.slice(i, i + cardsPerPage);
        const backItems: PreviewPageItem[] = [];
        for (let r = 0; r < cardsPerPage; r += columnsPerPage) {
          const rowSlots: (CardSlot | null)[] = Array.from(
            { length: columnsPerPage },
            (_, j) => chunk[r + j] ?? null,
          );
          backItems.push(...buildBackRow(rowSlots, defaultCardBack));
        }
        result.push({ items: backItems, pageType: "back", gridColumns: columnsPerPage, insertBoundary: { first: i, last: Math.min(i + cardsPerPage, sortedSlots.length) - 1 } });
      }
      return result;
    }

    return [];
  }, [
    sortedSlots,
    printMode,
    cardsPerPage,
    columnsPerPage,
    rowsPerPage,
    defaultCardBack,
  ]);

  // Backward-compatible imageMatrix (flat images per page)
  const imageMatrix = useMemo(
    () => pages.map((p) => p.items.map((item) => item.image)),
    [pages],
  );

  // The grid columns to use for CSS/position calculations
  const currentGridColumns = useMemo(() => {
    if (printMode === "side-by-side") {
      return Math.max(1, Math.floor(columnsPerPage / 2)) * 2;
    }
    return columnsPerPage;
  }, [printMode, columnsPerPage]);

  return {
    rowsPerPage,
    columnsPerPage,
    currentGridColumns,
    cardsPerPage,
    imageMatrix,
    pages,
  };
};
