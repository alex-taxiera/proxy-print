import { useContext, useMemo, useRef } from "react";

import { SettingsContext } from "./context/SettingsContext";
import "./PrintableImages.css";
import { Card } from "./Card";
import { ImagesContext } from "./context/ImagesContext";
import { ImageErrors } from "./ImageErrors";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { progressEvents } from "./utils/progress-events";

import { usePreviewData } from "./hooks/usePreviewData";
import { useGeneratePdf } from "./hooks/useGeneratePdf";
import { useCardClassNames } from "./hooks/useCardClassNames";

export const PrintableImages = () => {
  const { cssVars } = useContext(SettingsContext);

  const { images, onClear, isRendering, setIsRendering, isFetching } =
    useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const { rowsPerPage, columnsPerPage, imageMatrix } =
    usePreviewData();

  const generatePdf = useGeneratePdf(contentRef);

  const cardCount = useMemo(() => {
    const totalCards = images.length;
    const cardString = totalCards === 1 ? "card" : "cards";
    return `${totalCards} total ${cardString}`;
  }, [images]);

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit("progress", {
      progress: 0,
      phase: "Initializing",
    });
    generatePdf();
  };

  const cardClassNames = useCardClassNames();

  if (images.length === 0) {
    return (
      <div className="printable-images help">
        <p>Add images to get started.</p>
        <p>
          Upload an XML from{" "}
          <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
            MPC Autofill
          </a>{" "}
          &quot;Download XML&quot; option.
        </p>
        <p>
          You can download images from your{" "}
          <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
            MPC Autofill
          </a>{" "}
          project with their &quot;Download Card Images&quot; option.
        </p>
      </div>
    );
  }

  return (
    <div className="printable-images" style={cssVars}>
      <ProgressOverlay />
      <div className="actions">
        <div>{cardCount}</div>
        <button disabled={isRendering} onClick={() => onClear()}>
          Remove all cards
        </button>
        <button
          className="primary"
          disabled={isRendering || isFetching}
          onClick={() => handleSave()}
          title={
            isRendering
              ? "Generating PDF..."
              : isFetching
              ? "Downloading images..."
              : ""
          }
        >
          Save
        </button>
      </div>
      <ImageErrors />
      <div ref={contentRef} className="print-container">
        {imageMatrix.map((row, pageIndex) => (
          <div
            className={`page-container ${isRendering ? "loading" : ""}`}
            key={pageIndex}
            style={{
              display: pageIndex < 10 ? "block" : "none",
            }}
          >
            <div className="page">
              <div className="card-grid">
                {row.map((image, index) => (
                  <Card
                    key={image.uuid || `empty-${index}`}
                    image={image}
                    className={cardClassNames[index]}
                    showImage={pageIndex < 10}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
