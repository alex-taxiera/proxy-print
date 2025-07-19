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
    const cardElements = pageNode.querySelectorAll<HTMLElement>('.card');
    
    // Set white background for the page
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    console.log(`Processing page ${pageIndex + 1} with ${cardElements.length} cards`);
    console.log(`PDF page dimensions: ${pageWidth}x${pageHeight} ${pdfOptions.unit}`);
    
    // Get the page dimensions in pixels for coordinate conversion
    const pageRect = pageNode.getBoundingClientRect();
    console.log(`Page DOM dimensions: ${pageRect.width}x${pageRect.height}px`);
    
    // Process each card on this page
    cardElements.forEach((cardElement, cardIndex) => {
      const imgElement = cardElement.querySelector('img') as HTMLImageElement;
      
      if (imgElement && imgElement.src && !imgElement.classList.contains('loading')) {
        try {
          console.log(`Processing card ${cardIndex + 1}, image src: ${imgElement.src.substring(0, 50)}...`);
          
          // Get the image container element to understand the actual dimensions
          const imageContainer = cardElement.querySelector('.image-container') as HTMLElement;
          const imageContainerRect = imageContainer.getBoundingClientRect();
          
          // Get the actual image dimensions as rendered
          const imageRect = imgElement.getBoundingClientRect();
          
          console.log(`Container: ${imageContainerRect.width}x${imageContainerRect.height}, Image: ${imageRect.width}x${imageRect.height}, Natural: ${imgElement.naturalWidth}x${imgElement.naturalHeight}`);
          
          // Calculate the crop proportions based on the actual rendered sizes
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
          
          console.log(`Crop source: ${sourceX},${sourceY} ${sourceWidth}x${sourceHeight}`);
          
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
            
            // Calculate the position of this card on the page
            const cardRect = cardElement.getBoundingClientRect();
            const cardX = cardRect.left - pageRect.left;
            const cardY = cardRect.top - pageRect.top;
            
            // Convert browser coordinates to PDF coordinates
            // PDF coordinates start from bottom-left, browser from top-left
            // Also need to convert from pixels to PDF units
            const scaleX = pageWidth / pageRect.width;
            const scaleY = pageHeight / pageRect.height;
            
            const pdfX = cardX * scaleX;
            const pdfY = cardY * scaleY;
            
            console.log(`Browser position: ${cardX},${cardY} -> PDF position: ${pdfX},${pdfY}`);
            console.log(`Adding image at position: ${pdfX},${pdfY} with size: ${containerWidth * scaleX}x${containerHeight * scaleY}`);
            
            // Add the cropped image directly to the PDF at the card's position
            pdf.addImage(
              imageDataUrl,
              'JPEG',
              pdfX,
              pdfY,
              containerWidth * scaleX,
              containerHeight * scaleY
            );
          }
        } catch (error) {
          console.error('Error processing image for PDF:', error);
        }
      } else {
        console.log(`Skipping card ${cardIndex + 1}: no image or loading`);
      }
    });
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
