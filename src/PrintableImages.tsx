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
  pdfOptions: jsPDFOptions,
) {
  const [pageWidth, pageHeight] = pdfOptions.format as number[];
    
  for (let pageIndex = 0; pageIndex < nodeList.length; pageIndex++) {
    if (pageIndex !== 0) {
      pdf.addPage(pdfOptions.format, pdfOptions.orientation);
    }
    
    const pageNode = nodeList[pageIndex];
    const cardElements = pageNode.querySelectorAll<HTMLElement>('.card');
    
    // Set white background for the page
    
    
    // Get the page dimensions in pixels for coordinate conversion
    const pageRect = pageNode.getBoundingClientRect();
    
    // Get guide settings from CSS variables
    const printContainer = pageNode.closest('.print-container') as HTMLElement;
    const computedStyle = getComputedStyle(printContainer);
    const guideBorderWidth = parseFloat(computedStyle.getPropertyValue('--guide-border-width')) || 1;
    const bleedEdgeWidth = parseFloat(computedStyle.getPropertyValue('--bleed-edge-width')) || 0;
    const guideColor = computedStyle.getPropertyValue('--guide-border-color') || '#adff2f';
    const invertedGuideColor = computedStyle.getPropertyValue('--guide-border-color-inverted') || '#ff0000';
    const unit = computedStyle.getPropertyValue('--page-unit') || 'in';
    const guidesThickness = 0.2645833333 * (parseFloat(computedStyle.getPropertyValue('--guides-thickness')) || 0); // mm
    const guidesAtBleedEdge = computedStyle.getPropertyValue('--guides-at-bleed-edge') === '0';

    // Convert guide border width from pixels to PDF units
    const scaleX = pageWidth / pageRect.width;
    const scaleY = pageHeight / pageRect.height;
    const pdfGuideBorderWidth = guideBorderWidth * scaleX;
    
    // Process each card on this page
    for (let cardIndex = 0; cardIndex < cardElements.length; cardIndex++) {
      const cardElement = cardElements[cardIndex];
      const imgElement = cardElement.querySelector('img') as HTMLImageElement;
      
      // Get card position and classes for guides (needed for both images and empty cards)
      const cardRect = cardElement.getBoundingClientRect();
      const cardX = cardRect.left - pageRect.left;
      const cardY = cardRect.top - pageRect.top;
      const pdfX = cardX * scaleX;
      const pdfY = cardY * scaleY;
      
      // Get card classes to determine guide types
      const cardClasses = cardElement.className.split(' ');
      const isFirstRow = cardClasses.includes('first-row');
      const isLastRow = cardClasses.includes('last-row');
      const isFirstColumn = cardClasses.includes('first-column');
      const isLastColumn = cardClasses.includes('last-column');
      
      // Get the image container element to understand the actual dimensions
      const imageContainer = cardElement.querySelector('.image-container') as HTMLElement;
      const imageContainerRect = imageContainer.getBoundingClientRect();
      const containerWidth = imageContainerRect.width;
      const containerHeight = imageContainerRect.height;
      
      // Process image if it exists
      if (imgElement && imgElement.src && !imgElement.classList.contains('loading')) {
        try {
          
          // Get the actual image dimensions as rendered
          const imageRect = imgElement.getBoundingClientRect();
          
          
          // Calculate the crop proportions based on the actual rendered sizes
          const imageWidth = imageRect.width;
          const imageHeight = imageRect.height;
          
          // Calculate the source rectangle for cropping
          // The image is centered in the container, so we crop from the center
          const sourceWidth = (containerWidth / imageWidth) * imgElement.naturalWidth;
          const sourceHeight = (containerHeight / imageHeight) * imgElement.naturalHeight;
          const sourceX = (imgElement.naturalWidth - sourceWidth) / 2;
          const sourceY = (imgElement.naturalHeight - sourceHeight) / 2;
                    
          // Create a canvas to crop the image
          const cropCanvas = document.createElement('canvas');
          const cropCtx = cropCanvas.getContext('2d');
          
          if (cropCtx) {
            cropCanvas.width = sourceWidth;
            cropCanvas.height = sourceHeight;
            
            // Draw the cropped portion
            cropCtx.drawImage(
              imgElement,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, sourceWidth, sourceHeight
            );
            
            // Convert the cropped image to data URL
            const imageDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
                        
            // Add the cropped image directly to the PDF at the card's position
            pdf.addImage(
              imageDataUrl,
              'JPEG',
              pdfX,
              pdfY,
              containerWidth * scaleX,
              containerHeight * scaleY
            );
            
            // Clear canvas immediately
            cropCanvas.width = 0;
            cropCanvas.height = 0;
            cropCtx.clearRect(0, 0, 0, 0);
          }
        } catch (error) {
          console.error('Error processing image for PDF:', error);
        }
      } else {
        console.log(`Skipping card ${cardIndex + 1}: no image or loading`);
      }

      // Add guide lines if guides are enabled (for all cards, including empty ones)
      if (guidesThickness) {
        const pdfContainerWidth = containerWidth * scaleX;
        const pdfContainerHeight = containerHeight * scaleY;

        // Set line color and style
        pdf.setDrawColor(0, 0, 0); // Black for guides
        pdf.setLineWidth(pdfGuideBorderWidth);

        // Edge guides
        // Convert mm to PDF units (assuming PDF unit is inches, 1 inch = 25.4 mm)
        const bleedEdgeWidthPdf = guidesAtBleedEdge ? 0 : unit === 'in' ? bleedEdgeWidth / 25.4 : bleedEdgeWidth;
        // Crosshair size (4mm = 0.157 inches)
        const crosshairSize = bleedEdgeWidthPdf || (unit === 'in' ? 1 / 25.4 : 1);
        
        // Calculate crosshair positions (at the edges of the card area - 63mm x 88mm)
        const topLeft = {
          x: pdfX + bleedEdgeWidthPdf,
          y: pdfY + bleedEdgeWidthPdf
        }
        const topRight = {
          x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
          y: pdfY + bleedEdgeWidthPdf
        }
        const bottomLeft = {
          x: pdfX + bleedEdgeWidthPdf,
          y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf
        }
        const bottomRight = {
          x: pdfX + pdfContainerWidth - bleedEdgeWidthPdf,
          y: pdfY + pdfContainerHeight - bleedEdgeWidthPdf
        }

        // draw 4 crosses, centered on each corner
        

        // draw base crosshair with inverted color
        pdf.setDrawColor(invertedGuideColor); // Reset line color to black for subsequent lines
        pdf.setLineWidth(unit === 'in' ? guidesThickness / 24.5 : guidesThickness);

        // top left
        pdf.line(topLeft.x - crosshairSize, topLeft.y, topLeft.x + crosshairSize, topLeft.y);
        pdf.line(topLeft.x, topLeft.y - crosshairSize, topLeft.x, topLeft.y + crosshairSize);

        // top right
        pdf.line(topRight.x - crosshairSize, topRight.y, topRight.x + crosshairSize, topRight.y);
        pdf.line(topRight.x, topRight.y - crosshairSize, topRight.x, topRight.y + crosshairSize);
        
        // bottom left
        pdf.line(bottomLeft.x - crosshairSize, bottomLeft.y, bottomLeft.x + crosshairSize, bottomLeft.y);
        pdf.line(bottomLeft.x, bottomLeft.y - crosshairSize, bottomLeft.x, bottomLeft.y + crosshairSize);

        // bottom right
        pdf.line(bottomRight.x - crosshairSize, bottomRight.y, bottomRight.x + crosshairSize, bottomRight.y);
        pdf.line(bottomRight.x, bottomRight.y - crosshairSize, bottomRight.x, bottomRight.y + crosshairSize);
        
        // Draw crosshairs with guide color centered on the crosshair
        pdf.setDrawColor(guideColor);

        pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
        pdf.line(topLeft.x - crosshairSize, topLeft.y, topLeft.x + crosshairSize, topLeft.y);
        pdf.line(topLeft.x, topLeft.y - crosshairSize, topLeft.x, topLeft.y + crosshairSize);
        
        // Draw crosshair at top-right corner
        pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
        pdf.line(topRight.x - crosshairSize, topRight.y, topRight.x + crosshairSize, topRight.y);
        pdf.line(topRight.x, topRight.y - crosshairSize, topRight.x, topRight.y + crosshairSize);
        
        // Draw crosshair at bottom-left corner
        pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
        pdf.line(bottomLeft.x - crosshairSize, bottomLeft.y, bottomLeft.x + crosshairSize, bottomLeft.y);
        pdf.line(bottomLeft.x, bottomLeft.y - crosshairSize, bottomLeft.x, bottomLeft.y + crosshairSize);
        
        // Draw crosshair at bottom-right corner
        pdf.setLineDashPattern([crosshairSize / 5, crosshairSize / 4], 0);
        pdf.line(bottomRight.x - crosshairSize, bottomRight.y, bottomRight.x + crosshairSize, bottomRight.y);
        pdf.line(bottomRight.x, bottomRight.y - crosshairSize, bottomRight.x, bottomRight.y + crosshairSize);
        
        
        pdf.setLineDashPattern([], 0); // reset line dash pattern
        pdf.setDrawColor(0, 0, 0); // Reset line color to black for subsequent lines      
        // Draw edge guides that extend to page boundaries
        
        // Top edge guide (if first row)
        if (isFirstRow) {
          pdf.line(topLeft.x, 0, topLeft.x, topLeft.y - (crosshairSize));
          pdf.line(topRight.x, 0, topRight.x, topRight.y - (crosshairSize));
        }
        
        // Bottom edge guide (if last row)
        if (isLastRow) {
          pdf.line(bottomLeft.x, pageHeight, bottomLeft.x, bottomLeft.y + (crosshairSize));
          pdf.line(bottomRight.x, pageHeight, bottomRight.x, bottomRight.y + (crosshairSize));
        }
        
        // Left edge guide (if first column)
        if (isFirstColumn) {
          pdf.line(0, topLeft.y, topLeft.x - (crosshairSize), topLeft.y);
          pdf.line(0, bottomLeft.y, bottomLeft.x - (crosshairSize), bottomLeft.y);
        }
        
        // Right edge guide (if last column)
        if (isLastColumn) {
          pdf.line(pageWidth, topRight.y, topRight.x + (crosshairSize), topRight.y);
          pdf.line(pageWidth, bottomRight.y, bottomRight.x + (crosshairSize), bottomRight.y);
        }
      }
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
        console.log(`batch ${i / batchSize + 1} of ${Math.ceil(pages.length / batchSize)}`);
        console.time(`batch ${i / batchSize + 1} of ${Math.ceil(pages.length / batchSize)}`);
        const batch = Array.from(pages).slice(i, i + batchSize);
        addNodesToPdf(batch, pdf, pdfOptions);

        // add a page between batches
        if (i + batchSize < pages.length) {
          pdf.addPage(pdfOptions.format, pdfOptions.orientation);
        }
        console.timeEnd(`batch ${i / batchSize + 1} of ${Math.ceil(pages.length / batchSize)}`);
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
