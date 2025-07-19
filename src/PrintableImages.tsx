import { useContext, useMemo, useRef } from "react";
import jsPDF, { type jsPDFOptions } from "jspdf";

import { SettingsContext } from "./context/SettingsContext";
import "./PrintableImages.css";
import { Card } from "./Card";
import { Image, ImagesContext } from "./context/ImagesContext";
import { ImageErrors } from "./ImageErrors";

function addNodesToPdf(
  nodeList: Array<HTMLElement>,
  pdf: jsPDF,
  pdfOptions: jsPDFOptions
) {
  const [pageWidth, pageHeight] = pdfOptions.format as number[];
  
  for (let pageIndex = 0; pageIndex < nodeList.length; pageIndex++) {
    if (pageIndex !== 0) {
      pdf.addPage(pdfOptions.format, pdfOptions.orientation);
    }
    
    const pageNode = nodeList[pageIndex];
    
    // Create a canvas to render the page
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Get the page dimensions
      const rect = pageNode.getBoundingClientRect();
      
      // Set canvas size to match the page dimensions with high DPI
      const scale = 12.5; // Same scale as original html2canvas for 1200dpi
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      
      // Scale the context to match
      ctx.scale(scale, scale);
      
      // Use html2canvas-like approach: capture the page as it appears
      // We'll use a simpler method that focuses on the card grid layout
      const cardElements = pageNode.querySelectorAll<HTMLElement>('.card');
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Process each card
      cardElements.forEach(cardElement => {
        const cardRect = cardElement.getBoundingClientRect();
        const imgElement = cardElement.querySelector('img') as HTMLImageElement;
        
        if (imgElement && imgElement.src && !imgElement.classList.contains('loading')) {
          try {
            // Calculate position relative to the page
            const imgX = cardRect.left - rect.left;
            const imgY = cardRect.top - rect.top;
            
            // Create a temporary canvas for the image
            const imgCanvas = document.createElement('canvas');
            const imgCtx = imgCanvas.getContext('2d');
            
            if (imgCtx) {
              // Get the image container element to understand the actual dimensions
              const imageContainer = cardElement.querySelector('.image-container') as HTMLElement;
              const imageContainerRect = imageContainer.getBoundingClientRect();
              
              // Get the actual image dimensions as rendered
              const imageRect = imgElement.getBoundingClientRect();
              
              // Set canvas size to match the image dimensions
              imgCanvas.width = imgElement.naturalWidth;
              imgCanvas.height = imgElement.naturalHeight;
              
              // Draw the full image
              imgCtx.drawImage(imgElement, 0, 0);
              
              // The logic: the image is oversized and the container crops it with overflow: hidden
              // We need to calculate what portion of the oversized image is visible
              
              // Calculate the crop proportions based on the actual rendered sizes
              // The image is oversized, so we need to show the center portion that fits in the container
              const containerWidth = imageContainerRect.width;
              const containerHeight = imageContainerRect.height;
              const imageWidth = imageRect.width;
              const imageHeight = imageRect.height;
              
              // Calculate the source rectangle for cropping
              // The image is centered in the container, so we crop from the center
              const sourceWidth = (containerWidth / imageWidth) * imgElement.naturalWidth;
              const sourceHeight = (containerHeight / imageHeight) * imgElement.naturalHeight;
              const sourceX = (imgElement.naturalWidth - sourceWidth) / 2;
              const sourceY = (imgElement.naturalHeight - sourceHeight) / 2;
              
              // Create a cropped canvas
              const croppedCanvas = document.createElement('canvas');
              const croppedCtx = croppedCanvas.getContext('2d');
              
              if (croppedCtx) {
                croppedCanvas.width = sourceWidth;
                croppedCanvas.height = sourceHeight;
                
                // Draw the cropped portion
                croppedCtx.drawImage(
                  imgCanvas,
                  sourceX, sourceY, sourceWidth, sourceHeight,
                  0, 0, sourceWidth, sourceHeight
                );
                
                // Draw the cropped image to the main canvas at the correct position and size
                ctx.drawImage(
                  croppedCanvas,
                  imgX,
                  imgY,
                  containerWidth,
                  containerHeight
                );
              }
            }
          } catch (error) {
            console.error('Error processing image for PDF:', error);
          }
        }
      });
      
      // Convert canvas to image and add to PDF
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imageDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
    }
  }
}

export const PrintableImages = () => {
  const { cssVars, settings } = useContext(SettingsContext);

  const { images, onClear, isRendering, setIsRendering, isFetching } =
    useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    setIsRendering(true);

    setTimeout(() => {
      console.time("save");
      if (!contentRef.current) {
        return;
      }

      const pageHeight = Number(settings.pageHeight);
      const pageWidth = Number(settings.pageWidth);

      const pdfOptions = {
        orientation: pageWidth > pageHeight ? "l" : "p",
        unit: settings.unit,
        format: [pageWidth, pageHeight],
      } satisfies jsPDFOptions;

      const pdf = new jsPDF(pdfOptions);
      const pages = contentRef.current.querySelectorAll<HTMLElement>(".page");

      // render each page to a canvas
      const batchSize = 8;

      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = Array.from(pages).slice(i, i + batchSize);
        addNodesToPdf(batch, pdf, pdfOptions);

        // add a page between batches
        if (i + batchSize < pages.length) {
          pdf.addPage(pdfOptions.format, pdfOptions.orientation);
        }
      }

      const pdfOutput = pdf.output("blob");

      // download the pdf
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
    // convert in to mm when settings.unit is set to "in"
    const pageHeight = parseFloat(settings.pageHeight) * (settings.unit === "in" ? 25.4 : 1); 
    const guidesThickness = parseFloat(settings.guidesThickness) * 0.265; // convert px to mm
    const bleedEdge = parseFloat(settings.bleedEdge); // mm
    // card height is 88mm + 2 * bleedEdge + guidesThickness
    const cardHeight = 88 + 2 * bleedEdge + guidesThickness; // mm
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

  const cardCount = useMemo(() => {
    const totalCards = images.length;
    const cardString = totalCards === 1 ? "card" : "cards";
    return `${totalCards} total ${cardString}`;
  }, [images]);

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
      <div className="actions">
        <div>{cardCount}</div>
        <button disabled={isRendering} onClick={() => onClear()}>
          Remove all cards
        </button>
        <button
          className="primary"
          disabled={isRendering || isFetching}
          onClick={() => handleSave()}
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
          >
            <div className="page">
              <div className="card-grid">
                {row.map((image, index) => (
                  <Card
                    key={image.uuid || `empty-${index}`}
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
