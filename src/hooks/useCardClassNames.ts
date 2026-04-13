import { usePreviewData } from "./usePreviewData";

export const useCardPositionMeta = () => {
  const { rowsPerPage, currentGridColumns } = usePreviewData();

  return Array.from(
    { length: rowsPerPage * currentGridColumns },
    (_, index) => {
      const row = Math.floor(index / currentGridColumns);
      const column = index % currentGridColumns;
      return {
        isFirstColumn: column === 0,
        isLastColumn: column === currentGridColumns - 1,
        isFirstRow: row === 0,
        isLastRow: row === rowsPerPage - 1,
      };
    },
  );
};
