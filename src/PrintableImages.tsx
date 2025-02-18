import { useContext, useMemo, useRef } from "react";
import jsPDF, { type jsPDFOptions } from "jspdf";
import html2canvas from "html2canvas";

import { SettingsContext } from "./SettingsContext";
import "./PrintableImages.css";
import { Card } from "./Card";
import { Image, ImagesContext } from "./ImagesContext";

export const PrintableImages = () => {
  const { cssVars, settings } = useContext(SettingsContext);

  const { images, onClear, isRendering, setIsRendering } =
    useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    setIsRendering(true);

    setTimeout(async () => {
      console.time("save");
      if (!contentRef.current) {
        return;
      }
      const pageHeight = Number(settings.pageHeight);
      const pageWidth = Number(settings.pageWidth);

      const pdfOptions = {
        orientation: pageWidth > pageHeight ? "l" : "p",
        unit: "in",
        format: [pageWidth, pageHeight],
      } satisfies jsPDFOptions;

      const pdf = new jsPDF(pdfOptions);
      const pages = contentRef.current.querySelectorAll<HTMLElement>(".page");
      const canvases = await Promise.all(
        Array.from(pages).map((page) => html2canvas(page, { scale: 12.5 })) // 12.5 for 1200dpi, 8.33 for 800dpi
      );
      const pageImages = canvases.map((canvas) =>
        canvas.toDataURL("image/jpeg")
      );

      for (let index = 0; index < pages.length; index++) {
        if (index !== 0) {
          pdf.addPage(pdfOptions.format, pdfOptions.orientation);
        }
        pdf.addImage(pageImages[index], "JPEG", 0, 0, pageWidth, pageHeight);
      }
      const pdfOutput = pdf.output("blob");

      const url = URL.createObjectURL(pdfOutput);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cards.pdf";
      a.click();
      URL.revokeObjectURL(url);
      console.timeEnd("save");
      setIsRendering(false);
    });
  };

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

  if (images.length === 0) {
    return (
      <div className="printable-images help">
        <p>Upload images to get started.</p>
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
  };

  return (
    <div className="printable-images" style={cssVars}>
      <div className="actions">
        <div>{images.length} Total Cards</div>
        <button disabled={isRendering} onClick={() => onClear()}>
          Remove all cards
        </button>
        <button disabled={isRendering} onClick={() => handleSave()}>
          Save
        </button>
      </div>
      <div ref={contentRef} className="print-container">
        {imageMatrix.map((row, pageIndex) => (
          <div
            className={`page-container ${isRendering ? "loading" : ""}`}
            key={pageIndex}
          >
            <div className="page">
              <div className="card-grid">
                {row.map((image, index) => (
                  <Card
                    key={image.uuid}
                    image={image}
                    className={getCardClassName(index)}
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
