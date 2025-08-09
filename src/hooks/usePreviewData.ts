import { useContext, useMemo } from "react";
import { SettingsContext } from "../context/SettingsContext";
import { type Image, ImagesContext } from "../context/ImagesContext";

const MAX_PREVIEW_CARDS = 108;

export const usePageLimits = () => {
  const { settings } = useContext(SettingsContext);

  const rowsPerPage = useMemo(() => {
    // convert in to mm when settings.unit is set to "in"
    const pageHeight =
      parseFloat(settings.pageHeight) * (settings.unit === "in" ? 25.4 : 1);
    const guidesThickness = parseFloat(settings.guidesThickness) * 0.265; // convert px to mm
    const bleedEdge = parseFloat(settings.bleedEdge); // mm
    
    // Adjust card height based on card size
    const cardHeight =
      settings.cardSize === "japanese"
        ? 86 + 2 * bleedEdge + guidesThickness // Japanese card height
        : 88 + 2 * bleedEdge + guidesThickness; // Standard card height

    return Math.floor(pageHeight / cardHeight);
  }, [settings]);

  const columnsPerPage = useMemo(() => {
    return parseInt(settings.numberOfColumns);
  }, [settings]);

  const cardsPerPage = useMemo(
    () => rowsPerPage * columnsPerPage,
    [rowsPerPage, columnsPerPage]
  );

  const maxPages = Math.floor(MAX_PREVIEW_CARDS / cardsPerPage);

  return {
    rowsPerPage,
    columnsPerPage,
    cardsPerPage,
    maxPages,
  };
}

export const usePreviewData = () => {
  const { images } = useContext(ImagesContext);

  const { cardsPerPage, rowsPerPage, columnsPerPage, maxPages } = usePageLimits();

  const imageMatrix = useMemo(() => {
    if (images.length === 0) {
      return [];
    }

    const rows: Image[][] = [];
    for (let i = 0; i < images.length; i += cardsPerPage) {
      rows.push(images.slice(i, i + cardsPerPage));
    }
    const paddingItems = rows.at(-1)!.length % cardsPerPage;
    if (paddingItems > 0) {
      const filler = Array.from({ length: cardsPerPage - paddingItems }).fill({
        name: "empty",
      }) as (typeof rows)[0];
      rows.at(-1)!.push(...filler);
    }
    return rows;
  }, [images, cardsPerPage]);

  return {
    rowsPerPage,
    columnsPerPage,
    cardsPerPage,
    maxPages,
    imageMatrix,
  };
};
