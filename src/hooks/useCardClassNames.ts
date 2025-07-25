import { useMemo } from "react";
import { usePreviewData } from "./usePreviewData";

export const useCardClassNames = () => {
  const { rowsPerPage, columnsPerPage } = usePreviewData();

  return useMemo(() => {
    return Array.from({ length: rowsPerPage * columnsPerPage }, (_, index) => {
      const row = Math.floor(index / columnsPerPage);
      const column = index % columnsPerPage;
      const className = ["card"];
      if (column === 0) {
        className.push("first-column");
      }
      if (row === 0) {
        className.push("first-row");
      }
      if (column === columnsPerPage - 1) {
        className.push("last-column");
      }
      if (row === rowsPerPage - 1) {
        className.push("last-row");
      }
      return className.join(" ");
    })
  }, [columnsPerPage, rowsPerPage]);
};
