import { useMemo } from "react";

import { usePreviewData } from "./usePreviewData";

export const useCardPositionMeta = () => {
  const { rowsPerPage, columnsPerPage } = usePreviewData();

  return useMemo(() => {
    return Array.from({ length: rowsPerPage * columnsPerPage }, (_, index) => {
      const row = Math.floor(index / columnsPerPage);
      const column = index % columnsPerPage;
      return {
        isFirstColumn: column === 0,
        isLastColumn: column === columnsPerPage - 1,
        isFirstRow: row === 0,
        isLastRow: row === rowsPerPage - 1,
      };
    });
  }, [columnsPerPage, rowsPerPage]);
}
