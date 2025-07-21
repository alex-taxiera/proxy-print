import { useContext, useMemo, useRef } from "react";

import { SettingsContext } from "./context/SettingsContext";
import "./PrintableImages.css";
import { Card } from "./Card";
import { Image, ImagesContext } from "./context/ImagesContext";
import { ImageErrors } from "./ImageErrors";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { progressEvents } from "./utils/progress-events";

export const PrintableImages = () => {
  const { cssVars, settings } = useContext(SettingsContext);

  const { images, onClear, isRendering, setIsRendering, isFetching } =
    useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
    setIsRendering(true);
    console.time("save");

    const pageHeight = Number(settings.pageHeight);
    const pageWidth = Number(settings.pageWidth);
    const pages = contentRef.current?.querySelectorAll<HTMLElement>(".page") || [];

    // Process images progressively using requestIdleCallback
    const processImagesProgressively = () => {
      let currentPageIndex = 0;
      let currentCardIndex = 0;
      const processedPages: Array<{ cards: Array<{
        imageDataUrl: string | null;
        pdfX: number;
        pdfY: number;
        containerWidth: number;
        containerHeight: number;
        scaleX: number;
        scaleY: number;
        cardPosition: {
          isFirstRow: boolean;
          isLastRow: boolean;
          isFirstColumn: boolean;
          isLastColumn: boolean;
        };
        guides: {
          enabled: boolean;
          thickness: number;
          bleedEdgeWidth: number;
          guideColor: string;
          invertedGuideColor: string;
          unit: string;
          guidesThickness: number;
          guidesAtBleedEdge: boolean;
        } | null;
      }> }> = [];
      let totalCards = 0;
      let processedCards = 0;
      
      // Count total cards for progress
      Array.from(pages).forEach(pageNode => {
        totalCards += pageNode.querySelectorAll('.card').length;
      });
      
      const processNextCard = () => {
        if (currentPageIndex < pages.length) {
          const pageNode = pages[currentPageIndex];
          const cardElements = pageNode.querySelectorAll<HTMLElement>('.card');
          
          if (currentCardIndex < cardElements.length) {
            // Process single card
            const cardElement = cardElements[currentCardIndex];
            const imgElement = cardElement.querySelector('img') as HTMLImageElement;
            const cardRect = cardElement.getBoundingClientRect();
            const pageRect = pageNode.getBoundingClientRect();
            const printContainer = pageNode.closest('.print-container') as HTMLElement;
            const computedStyle = getComputedStyle(printContainer);
            
            // Get guide settings
            const guideBorderWidth = parseFloat(computedStyle.getPropertyValue('--guide-border-width')) || 1;
            const bleedEdgeWidth = parseFloat(computedStyle.getPropertyValue('--bleed-edge-width')) || 0;
            const guideColor = computedStyle.getPropertyValue('--guide-border-color') || '#adff2f';
            const invertedGuideColor = computedStyle.getPropertyValue('--guide-border-color-inverted') || '#ff0000';
            const unit = computedStyle.getPropertyValue('--page-unit') || 'in';
            const guidesThickness = 0.2645833333 * (parseFloat(computedStyle.getPropertyValue('--guides-thickness')) || 0);
            const guidesAtBleedEdge = computedStyle.getPropertyValue('--guides-at-bleed-edge') === '0';

            const scaleX = pageWidth / pageRect.width;
            const scaleY = pageHeight / pageRect.height;
            const pdfGuideBorderWidth = guideBorderWidth * scaleX;

            const cardX = cardRect.left - pageRect.left;
            const cardY = cardRect.top - pageRect.top;
            const pdfX = cardX * scaleX;
            const pdfY = cardY * scaleY;

            const imageContainer = cardElement.querySelector('.image-container') as HTMLElement;
            const imageContainerRect = imageContainer.getBoundingClientRect();
            const containerWidth = imageContainerRect.width;
            const containerHeight = imageContainerRect.height;

            let imageDataUrl = null;
            
            if (imgElement && imgElement.src && !imgElement.classList.contains('loading')) {
              try {
                const imageRect = imgElement.getBoundingClientRect();
                const imageWidth = imageRect.width;
                const imageHeight = imageRect.height;
                
                const sourceWidth = (containerWidth / imageWidth) * imgElement.naturalWidth;
                const sourceHeight = (containerHeight / imageHeight) * imgElement.naturalHeight;
                const sourceX = (imgElement.naturalWidth - sourceWidth) / 2;
                const sourceY = (imgElement.naturalHeight - sourceHeight) / 2;
                
                const maxWidth = 1500;
                const maxHeight = 2100;
                const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
                const targetWidth = Math.round(sourceWidth * scale);
                const targetHeight = Math.round(sourceHeight * scale);
                
                const cropCanvas = document.createElement('canvas');
                const cropCtx = cropCanvas.getContext('2d');
                
                if (cropCtx) {
                  cropCanvas.width = targetWidth;
                  cropCanvas.height = targetHeight;
                  
                  cropCtx.drawImage(
                    imgElement,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, targetWidth, targetHeight
                  );
                  
                  imageDataUrl = cropCanvas.toDataURL('image/jpeg', 1);
                  
                  // Clear canvas
                  cropCanvas.width = 0;
                  cropCanvas.height = 0;
                  cropCtx.clearRect(0, 0, 0, 0);
                }
              } catch (error) {
                console.error('Error processing image for PDF:', error);
              }
            }

            // Get card classes to determine guide types
            const cardClasses = cardElement.className.split(' ');
            const isFirstRow = cardClasses.includes('first-row');
            const isLastRow = cardClasses.includes('last-row');
            const isFirstColumn = cardClasses.includes('first-column');
            const isLastColumn = cardClasses.includes('last-column');

            const processedCard = {
              imageDataUrl,
              pdfX,
              pdfY,
              containerWidth,
              containerHeight,
              scaleX,
              scaleY,
              cardPosition: {
                isFirstRow,
                isLastRow,
                isFirstColumn,
                isLastColumn
              },
              guides: guidesThickness ? {
                enabled: true,
                thickness: pdfGuideBorderWidth,
                bleedEdgeWidth,
                guideColor,
                invertedGuideColor,
                unit,
                guidesThickness,
                guidesAtBleedEdge
              } : null
            };

            // Add card to current page or create new page
            if (!processedPages[currentPageIndex]) {
              processedPages[currentPageIndex] = { cards: [] };
            }
            processedPages[currentPageIndex].cards.push(processedCard);
            
            processedCards++;
            const progress = Math.round((processedCards / totalCards) * 100);
            progressEvents.emit('progress', {
              progress,
              phase: 'Processing images'
            });
            console.log(`Processing: ${progress}% (${processedCards}/${totalCards})`);
            
            currentCardIndex++;
            requestIdleCallback(processNextCard, { timeout: 50 });
          } else {
            // Move to next page
            currentPageIndex++;
            currentCardIndex = 0;
            requestIdleCallback(processNextCard, { timeout: 50 });
          }
        } else {
          // All cards processed, send to worker
          console.log('All images processed, generating PDF...');
          const worker = new Worker('/pdf-worker.js');
          
          worker.onmessage = (e: MessageEvent<{ type: string; percentage?: number; blob?: Blob; error?: string }>) => {
            const { type, percentage, blob, error } = e.data;
            
            if (type === 'progress') {
              progressEvents.emit('progress', {
                progress: percentage || 0,
                phase: 'Saving PDF'
              });
              console.log(`PDF Generation: ${percentage}%`);
            } else if (type === 'complete' && blob) {
              // Download the PDF
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "cards.pdf";
              a.click();
              URL.revokeObjectURL(url);
              console.timeEnd("save");
              setIsRendering(false);
              progressEvents.emit('complete');
              worker.terminate();
            } else if (type === 'error') {
              console.error('PDF generation error:', error);
              console.timeEnd("save");
              setIsRendering(false);
              worker.terminate();
            }
          };

          // Send data to worker
          worker.postMessage({
            type: 'generatePdf',
            data: {
              pages: processedPages,
              settings,
              pageHeight,
              pageWidth,
              unit: settings.unit
            }
          });
        }
      };
      
      // Start processing
      requestIdleCallback(processNextCard, { timeout: 50 });
    };
    
    // Start the progressive processing
    processImagesProgressively();

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
