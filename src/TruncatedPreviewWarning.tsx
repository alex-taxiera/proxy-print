import "./TruncatedPreviewWarning.css";
import { usePreviewData } from "./hooks/usePreviewData";
import { useId } from "react";

const TruncatedPreviewWarning = () => {
  const { imageMatrix, maxPages } = usePreviewData();

  const warningDescriptionId = useId();

  const totalPages = imageMatrix.length;

  if (totalPages <= maxPages) {
    return null;
  }

  return (
    <div
      aria-label="Preview Limited"
      aria-describedby={warningDescriptionId}
      role="alert"
      className="truncated-preview-warning"
    >
      <div className="description" id={warningDescriptionId}>
        <div>
          Only the first {maxPages} pages are visible in the preview.
          The complete document contains {totalPages} total pages.
        </div>
      </div>
    </div>
  );
};

export default TruncatedPreviewWarning;
