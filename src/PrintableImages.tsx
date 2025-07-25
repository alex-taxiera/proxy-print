import { useContext, useMemo, useRef } from "react";

import { SettingsContext } from "./context/SettingsContext";
import "./PrintableImages.css";
import { Card } from "./Card";
import { Image as ImageType, ImagesContext } from "./context/ImagesContext";
import { ImageErrors } from "./ImageErrors";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { progressEvents } from "./utils/progress-events";

import { PDFDocument } from 'pdf-lib';
import PdfWorker from './workers/pdf-worker?worker'

async function* mergePDFsBlobs(blobs: Blob[]) {
  let mergedPdf = await PDFDocument.create();
  // split the blobs into chunks of 2GB
  const maxPdfSize = 2 * 1024 * 1024 * 1024;
  let pdfSize = 0;

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    if (pdfSize + blob.size > maxPdfSize) {
      console.debug('pdf is too large, saving the current pdf');
      const mergedBytes = await mergedPdf.save();
      yield new Blob([mergedBytes], { type: 'application/pdf' });
      mergedPdf = await PDFDocument.create();
      pdfSize = 0;
    }

    pdfSize += blob.size;
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  console.debug('saving the final pdf');
  const mergedBytes = await mergedPdf.save();
  yield new Blob([mergedBytes], { type: 'application/pdf' });
}

function buildWorkerQueues<T>(workers: Worker[], items: T[], chunkSize: number): T[][] {
  const assignments: T[][] = [];

  // Step 1: Assign 45 items to each worker
  for (let i = 0; i < workers.length; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    assignments.push(items.slice(start, end));
  }

  return assignments
}

export const PrintableImages = () => {
  const { cssVars, settings } = useContext(SettingsContext);

  const { images, onClear, isRendering, setIsRendering, isFetching, isLoadingLocalImages, loadedLocalImageCount, totalLocalImageCount } =
    useContext(ImagesContext);

  const cardCount = useMemo(() => {
    const totalCards = images.length;
    const cardString = totalCards === 1 ? "card" : "cards";
    return `${totalCards} total ${cardString}`;
  }, [images]);

  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit('progress', {
      progress: 0,
      phase: 'Initializing'
    });

    const pageHeight = Number(settings.pageHeight);
    const pageWidth = Number(settings.pageWidth);
    const referencePage = contentRef.current?.querySelector<HTMLElement>(".page") as HTMLElement;
    const referencePageRect = referencePage.getBoundingClientRect();
    const printContainer = referencePage.closest('.print-container') as HTMLElement;
    const referenceCards = Array.from(referencePage.querySelectorAll<HTMLElement>(".card"));
    const computedStyle = getComputedStyle(printContainer);
    // Get guide settings
    const guideBorderWidth = parseFloat(computedStyle.getPropertyValue('--guide-border-width')) || 1;
    const bleedEdgeWidth = parseFloat(computedStyle.getPropertyValue('--bleed-edge-width')) || 0;
    const guideColor = computedStyle.getPropertyValue('--guide-border-color') || '#adff2f';
    const invertedGuideColor = computedStyle.getPropertyValue('--guide-border-color-inverted') || '#ff0000';
    const unit = computedStyle.getPropertyValue('--page-unit') as 'in' | 'mm' | 'em' | 'pt' | 'px' | 'cm' | 'ex' | 'pc' || 'in';
    const guidesThickness = 0.2645833333 * (parseFloat(computedStyle.getPropertyValue('--guides-thickness')) || 0);
    const guidesAtBleedEdge = computedStyle.getPropertyValue('--guides-at-bleed-edge') === '0';

    const cardsPerWorker = cardsPerPage * 1;
    const cards = Array.from(contentRef.current?.querySelectorAll<HTMLElement>(".card") || []);
    let progress = 0;
    const totalProgressAmount = cards.length * 2; // 1 for processing 1 for adding to pdf

    const maxWorkers = Math.min(Math.floor(imageMatrix.length / 2) || 1, 34);
    const workers = Array.from({ length: Math.ceil(cards.length / cardsPerWorker) }, (_, index) => new PdfWorker({ name: `PDF Worker ${index + 1}` }));
    const waitingWorkers = workers.slice(maxWorkers);
    const lastWorker = workers.at(-1)!;
    const lastWorkerLimit = (cards.length % cardsPerWorker) || cardsPerWorker;
    const cardsDone = new Map<Worker, number>();
    const pdfPages = new Map<Worker, Blob>();

    // sort cards into separate lists per worker
    const assignments = buildWorkerQueues(workers, cards, cardsPerWorker)

    const processCard = async (cardElement: HTMLElement) => {
      const index = cards.indexOf(cardElement);
      const referenceCard = referenceCards[index % 9];
      const referenceImgElement = referenceCard.querySelector('img') as HTMLImageElement;
      console.debug(`Card ${index + 1} of ${cards.length} processing`);
      // Process cards sequentially to reduce memory usage
      const imageUuid = cardElement?.id;
      const image = images.find(image => image.uuid === imageUuid);
      const cardRect = referenceCard.getBoundingClientRect();


      const scaleX = pageWidth / referencePageRect.width;
      const scaleY = pageHeight / referencePageRect.height;
      const pdfGuideBorderWidth = guideBorderWidth * scaleX;

      const cardX = cardRect.left - referencePageRect.left;
      const cardY = cardRect.top - referencePageRect.top;
      const pdfX = cardX * scaleX;
      const pdfY = cardY * scaleY;

      const imageContainer = referenceCard.querySelector('.image-container') as HTMLElement;
      const imageContainerRect = imageContainer.getBoundingClientRect();
      const containerWidth = imageContainerRect.width;
      const containerHeight = imageContainerRect.height;

      let imageDataUrl = null;
      
      if (image) {
        try {
          // Get the image source URL (could be blob URL or data URL)
          const imageSrc = image.url ?? URL.createObjectURL(image.file!);
          
          // Create a new image element to get natural dimensions
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          
          // Wait for the image to load
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            tempImg.src = imageSrc;
          });
          
          const imageRect = referenceImgElement.getBoundingClientRect();
          const imageWidth = imageRect.width;
          const imageHeight = imageRect.height;
          
          const sourceWidth = (containerWidth / imageWidth) * tempImg.naturalWidth;
          const sourceHeight = (containerHeight / imageHeight) * tempImg.naturalHeight;
          const sourceX = (tempImg.naturalWidth - sourceWidth) / 2;
          const sourceY = (tempImg.naturalHeight - sourceHeight) / 2;
          
          // Use full resolution - no max width/height constraints
          const targetWidth = Math.round(sourceWidth);
          const targetHeight = Math.round(sourceHeight);
          
          const cropCanvas = document.createElement('canvas');
          const cropCtx = cropCanvas.getContext('2d');
          
          if (cropCtx) {
            cropCanvas.width = targetWidth;
            cropCanvas.height = targetHeight;
            
            cropCtx.drawImage(
              tempImg,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, targetWidth, targetHeight
            );
            
            imageDataUrl = cropCanvas.toDataURL(image.mimeType ?? image.file!.type, 1);
            
            // Clear canvas immediately to free memory
            cropCanvas.width = 0;
            cropCanvas.height = 0;
            cropCtx.clearRect(0, 0, 0, 0);
            if (image.file) {
              URL.revokeObjectURL(imageSrc);
            }
          }
          
          // Clear tempImg reference to help GC
          tempImg.src = '';
        } catch (error) {
          console.error('Error processing image for PDF:', error);
        }
      }

      progress++;
      console.debug(`Card ${index + 1} of ${cards.length} processed`);

      // Get card classes to determine guide types
      const cardClasses = referenceCard.className.split(' ');
      const isFirstRow = cardClasses.includes('first-row');
      const isLastRow = cardClasses.includes('last-row');
      const isFirstColumn = cardClasses.includes('first-column');
      const isLastColumn = cardClasses.includes('last-column');

      return {
        imageDataUrl,
        mimeType: image?.mimeType ?? image?.file!.type,
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
      }
    }

    const requestNextCard = (data: [HTMLElement, Worker], cards: [HTMLElement, Worker][]) => {
      const [cardElement, worker] = data;

      progressEvents.emit('progress', {
        progress: progress,
        totalProgressAmount,
        phase: 'Building PDF'
      });
      processCard(cardElement).then((card) => {
        progressEvents.emit('progress', {
          progress: progress,
          totalProgressAmount,
          phase: 'Building PDF'
        });
        worker.postMessage({
          type: 'addImage',
          data: {
            card,
            init: {
              pageHeight: Number(settings.pageHeight),
              pageWidth: Number(settings.pageWidth),
              unit: settings.unit,
            },
          }
        });

        if (cards.length > 0) {
          requestIdleCallback(() => requestNextCard(cards.shift()!, cards), { timeout: 50 });
        }
      }).catch(error => {
        console.error('Error processing card:', error);
      });
    }

    const savePDF = async () => {
      progressEvents.emit('progress', {
        progress: progress,
        totalProgressAmount,
        isIndeterminate: true,
        phase: 'Saving PDF'
      });

      // combine pdfs
      const pdfGenerator = mergePDFsBlobs(
        workers.map(worker => pdfPages.get(worker)!)
      )

      try {
        for await (const blob of pdfGenerator) {
          console.debug('saving pdf', blob);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "cards.pdf";
          a.click();
          URL.revokeObjectURL(url);
        }
        console.debug('done!');
        console.timeEnd("save");
        setIsRendering(false);
        progressEvents.emit('complete');
      } catch (error) {
        console.error('Error merging PDFs', error);
        console.timeEnd("save");
        setIsRendering(false);
        progressEvents.emit('complete');
      }
    }

    const startWorker = (worker: Worker, cards: HTMLElement[]) => {
      requestIdleCallback(() => {
        requestNextCard([cards.shift()!, worker], cards.map(card => [card, worker]));
      })
    }

    const startNextWorker = () => {
      if (waitingWorkers.length > 0) {
        const worker = waitingWorkers.shift()!;
        console.debug(`Starting next worker, ${waitingWorkers.length} workers left`);
        const workerIndex = workers.indexOf(worker);
        startWorker(worker, assignments[workerIndex]);
      }
    }

    workers.forEach((worker, index) => {
      worker.onmessage = (e: MessageEvent<{ type: string; success: boolean; error?: string, blob?: Blob }>) => {
        switch (e.data.type) {
          case 'cardProcessed': {
            progress++;
            cardsDone.set(worker, (cardsDone.get(worker) || 0) + 1);

            console.debug(`PDF Worker ${index + 1}: card ${cardsDone.get(worker)} of ${lastWorkerLimit} processed`);

            progressEvents.emit('progress', {
              progress: progress,
              totalProgressAmount,
              phase: 'Building PDF'
            });

            const done = cardsDone.get(worker) === (lastWorker === worker ? lastWorkerLimit : cardsPerWorker);
            if (done) {
              worker.postMessage({
                type: 'save',
              })
            }
            break;
          }
          case 'save': {
            console.debug(`PDF Worker ${index + 1}: saved pdf size ${e.data.blob?.size}`);
            // cleanup worker and start any sleeping workers
            worker.terminate();
            startNextWorker();
            pdfPages.set(worker, e.data.blob!);

            if (pdfPages.size === workers.length) {
              // done, moving to save logic
              void savePDF();
            }
            break;
          }
          case 'error':
            console.error('PDF error:', e.data.error);
            console.timeEnd("save");
            setIsRendering(false);
            progressEvents.emit('complete');
            break;
        }
      };

      worker.onerror = (e) => {
        console.error('Worker error:', e.error);
        console.timeEnd("save");
        setIsRendering(false);
        progressEvents.emit('complete');
      }
    });

    // Finally start the process
    progressEvents.emit('progress', {
      progress: progress,
      totalProgressAmount,
      phase: 'Building PDF'
    });

    // start first set of workers
    for (let i = 0; i < workers.length; i++) {
      if (i < maxWorkers) {
        startWorker(workers[i], assignments[i]);
      }
    }
  };


  const imageMatrix = useMemo(() => {
    if (images.length === 0) {
      return [];
    }

    const rows: ImageType[][] = [];
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
              display: pageIndex < 10 ? 'block' : 'none'
            }}
          >
            <div className="page">
              <div className="card-grid">
                {row.map((image, index) => (
                  <Card
                    key={image.uuid || `empty-${index}`}
                    image={image}
                    className={getCardClassName(index)}
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
