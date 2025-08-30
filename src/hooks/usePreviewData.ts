import { nanoid } from "nanoid";
import { useContext, useMemo } from "react";

import { ImagesContext, PossiblyEmptyImage } from "~/context/ImagesContext";
import { SettingsContext } from "~/context/SettingsContext";

export const usePageLimits = () => {
  const { settings } = useContext(SettingsContext);

  const guidesThickness = parseFloat(settings.guidesThickness) * 0.265; // convert px to mm
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

    // const colNum = parseInt(settings.numberOfColumns);

    // return Math.min(colNum, Math.floor(pageWidth / cardWidth));
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

export const usePreviewData = () => {
  const { images } = useContext(ImagesContext);

  const { cardsPerPage, rowsPerPage, columnsPerPage } = usePageLimits();

  const imageMatrix = useMemo(() => {
    if (images.length === 0) {
      return [];
    }

    const rows: PossiblyEmptyImage[][] = [];
    for (let i = 0; i < images.length; i += cardsPerPage) {
      rows.push(images.slice(i, i + cardsPerPage));
    }
    const paddingItems = rows.at(-1)!.length % cardsPerPage;
    if (paddingItems > 0) {
      const filler = Array.from<never, PossiblyEmptyImage>(
        { length: cardsPerPage - paddingItems },
        () => ({
          name: "empty",
          uuid: nanoid(),
        }),
      );
      rows.at(-1)!.push(...filler);
    }
    return rows;
  }, [images, cardsPerPage]);

  return {
    rowsPerPage,
    columnsPerPage,
    cardsPerPage,
    imageMatrix,
  };
};
