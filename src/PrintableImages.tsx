import { useContext, useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import "./PrintableImages.css";
import { SettingsContext } from "./SettingsContext";

interface PrintableImagesProps {
  files: File[];
}

export const PrintableImages = ({ files }: PrintableImagesProps) => {
  const { cssVars, settings } = useContext(SettingsContext);

  const images = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      images.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: "cards",
    contentRef,
    bodyClass: "reee",
    preserveAfterPrint: true,
  });

  const rowsPerPage = useMemo(() => {
    const pageHeight = parseFloat(settings.pageHeight) * 25.4; // convert in to mm
    const guidesThickness = parseFloat(settings.guidesThickness) * 0.265; // convert px to mm
    const bleedEdge = parseFloat(settings.bleedEdge); // mm
    // card height is 88mm + 2 * bleedEdge + guidesThickness
    const cardHeight = 88 + 2 * bleedEdge + guidesThickness; // inches
    return Math.floor(pageHeight / cardHeight);
  }, [settings]);

  const columnsPerPage = useMemo(() => {
    return parseInt(settings.numberOfColumns);
  }, [settings]);

  const cardsPerPage = useMemo(
    () => rowsPerPage * columnsPerPage,
    [rowsPerPage, columnsPerPage]
  );

  const imageMatrix = useMemo(() => {
    if (images.length === 0) {
      return [];
    }

    const rows: string[][] = [];
    for (let i = 0; i < images.length; i += cardsPerPage) {
      rows.push(images.slice(i, i + cardsPerPage));
    }
    const paddingItems = rows.at(-1)!.length % cardsPerPage;
    if (paddingItems > 0) {
      const filler = Array.from({ length: cardsPerPage - paddingItems }).fill(
        ""
      ) as string[];
      rows.at(-1)!.push(...filler);
    }
    return rows;
  }, [images, cardsPerPage]);

  if (images.length === 0) {
    return null;
  }

  const getCardClassName = (index: number) => {
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
  }

  return (
    <div className="printable-images" style={cssVars}>
      <button onClick={() => handlePrint()}>Print</button>
      <div ref={contentRef} className="print-container">
        {imageMatrix.map((row, pageIndex) => (
          <div className="page" key={pageIndex}>
            <div className="card-grid">
              {row.map((src, index) => (
                <div key={index + src} className={getCardClassName(index)}>
                  <div className="image-container">
                    {src ? (
                      <img
                        src={src}
                        alt={`img-${pageIndex * cardsPerPage + index + 1}`}
                        className="image"
                      />
                    ) : (
                      <span className="empty" />
                    )}
                  </div>
                  <div className="guide top-left"></div>
                  <div className="guide top-right"></div>
                  <div className="guide bottom-left"></div>
                  <div className="guide bottom-right"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
