import * as Sentry from "@sentry/react";
import { useQueryClient } from "@tanstack/react-query";
import { PDFDocument } from "pdf-lib";
import { useCallback, useContext } from "react";

import {
  getIsDownloadableImage,
  getIsLocalImage,
  Image as ImageType,
  ImagesContext,
} from "~/context/ImagesContext";
import { SettingsContext } from "~/context/SettingsContext";
import { getQueryKeyForImage, ImageQueryData } from "~/queries/images";
import { invertHexColor } from "~/utils/invert-hex-color";
import { progressEvents } from "~/utils/progress-events";
import PdfWorker from "~/workers/pdf-worker?worker";

import { useCardPositionMeta } from "./useCardClassNames";
import { usePreviewData } from "./usePreviewData";

const doTimeout = (fn: () => void, timeout?: number) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, timeout);
  }
};

async function* mergePDFsBlobs(blobs: Blob[]) {
  let mergedPdf = await PDFDocument.create();
  // split the blobs into chunks of 2GB -- this is the limit in Chrome
  const maxPdfSize = 2 * 1024 * 1024 * 1024;
  let pdfSize = 0;

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    if (pdfSize + blob.size > maxPdfSize) {
      console.debug("pdf is too large, saving the current pdf");
      const mergedBytes = await mergedPdf.save();
      yield new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
      mergedPdf = await PDFDocument.create();
      pdfSize = 0;
    }

    pdfSize += blob.size;
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  console.debug("saving the final pdf");
  const mergedBytes = await mergedPdf.save();
  yield new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
}

export const useGeneratePdf = (contentRef: React.RefObject<HTMLElement>) => {
  const queryClient = useQueryClient();
  const { settings } = useContext(SettingsContext);
  const { images, setIsRendering } = useContext(ImagesContext);
  const { imageMatrix, cardsPerPage } = usePreviewData();
  const cardPositionMeta = useCardPositionMeta();

  const generatePdf = useCallback(() => {
    return new Promise((resolve, reject) => {
      const referencePage = contentRef.current?.querySelector<HTMLElement>(
        ".page",
      ) as HTMLElement;
      const referencePageRect = referencePage.getBoundingClientRect();
      const referenceCards = Array.from(
        referencePage.querySelectorAll<HTMLElement>(".card"),
      );
      const referenceImageContainer = referenceCards[0].querySelector(
        ".image-container",
      ) as HTMLElement;
      const imageContainerRect =
        referenceImageContainer.getBoundingClientRect();
      const containerWidth = imageContainerRect.width;
      const containerHeight = imageContainerRect.height;
      const referenceImg = referenceCards[0].querySelector<HTMLImageElement>(
        "img",
      ) as HTMLImageElement;
      const imageRect = referenceImg.getBoundingClientRect();
      const imageWidth = imageRect.width;
      const imageHeight = imageRect.height;

      // read settings
      const pageHeight = Number(settings.pageHeight);
      const pageWidth = Number(settings.pageWidth);
      const guideBorderWidth = Number(settings.guidesThickness);
      const bleedEdgeWidth = settings.enableBleedEdge
        ? Number(settings.bleedEdge)
        : 0;
      const guideColor = settings.guidesColor;
      const invertedGuideColor = invertHexColor(settings.guidesColor);
      const unit = settings.unit;
      const guidesThickness = 0.2645833333 * guideBorderWidth;
      const guidesAtBleedEdge = settings.guidesAtBleedEdge;
      const pdfName = `${settings.filename}.pdf`;

      let progress = 0;
      const totalProgressAmount = images.length * 2; // 1 for processing 1 for adding to pdf
      const numberOfPages = imageMatrix.length;
      const maxWorkers = Math.min(Math.floor(numberOfPages / 2) || 1, 34);
      const cardsDone = new Map<number, number>();
      const pdfPages = new Map<number, Blob>();

      // sort cards into separate lists per worker
      const assignments = imageMatrix.map((page) =>
        page.map((image) => image.uuid),
      );

      const processCard = async ({
        imageUuid,
        relativeIndex,
      }: {
        imageUuid?: string;
        relativeIndex: number;
      }) => {
        const index = imageUuid
          ? images.findIndex((image) => image.uuid === imageUuid)
          : relativeIndex + (imageMatrix.length - 1) * cardsPerPage;
        const image: ImageType | undefined = images[index];
        console.debug(
          `Card ${index + 1} of ${imageMatrix.length * cardsPerPage} processing`,
        );
        const referenceCard = referenceCards[relativeIndex];
        const cardRect = referenceCard.getBoundingClientRect();

        const scaleX = pageWidth / referencePageRect.width;
        const scaleY = pageHeight / referencePageRect.height;
        const pdfGuideBorderWidth = guideBorderWidth * scaleX;

        const cardX = cardRect.left - referencePageRect.left;
        const cardY = cardRect.top - referencePageRect.top;
        const pdfX = cardX * scaleX;
        const pdfY = cardY * scaleY;

        let imageDataUrl = null;
        const downloadableImageData =
          image && getIsDownloadableImage(image)
            ? queryClient.getQueryData<ImageQueryData>(
                getQueryKeyForImage(image),
              )
            : undefined;

        if (image) {
          const isLocalImage = getIsLocalImage(image);
          try {
            // Get the image source URL (could be blob URL or data URL)
            const imageSrc = URL.createObjectURL(
              isLocalImage ? image.file : downloadableImageData!.data,
            );

            // Create a new image element to get natural dimensions
            const tempImg = new Image();

            // Wait for the image to load
            await new Promise((resolve, reject) => {
              tempImg.onload = resolve;
              tempImg.onerror = (event, source, lineno, colno, error) => {
                console.debug("Image load error:", {
                  imageSrc,
                  event,
                  source,
                  lineno,
                  colno,
                  error,
                });
                reject(error ?? new Error("Image load error"));
              };
              tempImg.src = imageSrc;
            });

            const sourceWidth =
              (containerWidth / imageWidth) * tempImg.naturalWidth;
            const sourceHeight =
              (containerHeight / imageHeight) * tempImg.naturalHeight;
            const sourceX = (tempImg.naturalWidth - sourceWidth) / 2;
            const sourceY = (tempImg.naturalHeight - sourceHeight) / 2;

            // Use full resolution - no max width/height constraints
            const targetWidth = Math.round(sourceWidth);
            const targetHeight = Math.round(sourceHeight);

            const cropCanvas = document.createElement("canvas");
            const cropCtx = cropCanvas.getContext("2d");

            if (cropCtx) {
              cropCanvas.width = targetWidth;
              cropCanvas.height = targetHeight;

              cropCtx.drawImage(
                tempImg,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                targetWidth,
                targetHeight,
              );

              imageDataUrl = cropCanvas.toDataURL(
                isLocalImage
                  ? image.file.type
                  : (downloadableImageData?.mimeType ?? "image/png"),
                1,
              );

              // Clear canvas immediately to free memory
              cropCanvas.width = 0;
              cropCanvas.height = 0;
              cropCtx.clearRect(0, 0, 0, 0);
              URL.revokeObjectURL(imageSrc);
            }

            // Clear tempImg reference to help GC
            tempImg.onload = null;
            tempImg.onerror = null;
            tempImg.src = "";
          } catch (error) {
            console.error("Error processing image for PDF:", error);
            reject(error as Error);
          }
        }

        progress++;
        console.debug(
          `Card ${index + 1} of ${imageMatrix.length * cardsPerPage} processed`,
        );

        const { isFirstRow, isLastRow, isFirstColumn, isLastColumn } =
          cardPositionMeta[relativeIndex];

        return {
          imageDataUrl,
          mimeType:
            image && getIsLocalImage(image)
              ? image.file.type
              : (downloadableImageData?.mimeType ?? "image/png"),
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
            isLastColumn,
          },
          guides: guidesThickness
            ? {
                enabled: true,
                thickness: pdfGuideBorderWidth,
                bleedEdgeWidth,
                guideColor,
                invertedGuideColor,
                unit,
                guidesThickness,
                guidesAtBleedEdge,
              }
            : null,
        };
      };

      const requestNextCard = (
        data: [string, Worker],
        cards: [string, Worker][],
        relativeIndex: number,
      ) => {
        const [imageUuid, worker] = data;

        progressEvents.emit("progress", {
          progress: progress,
          totalProgressAmount,
          phase: "Building PDF",
        });

        processCard({
          imageUuid,
          relativeIndex,
        })
          .then((card) => {
            progressEvents.emit("progress", {
              progress: progress,
              totalProgressAmount,
              phase: "Building PDF",
            });
            worker.postMessage({
              type: "addImage",
              data: {
                card,
                init: {
                  pageHeight: Number(settings.pageHeight),
                  pageWidth: Number(settings.pageWidth),
                  unit: settings.unit,
                },
              },
            });

            if (cards.length > 0) {
              doTimeout(
                () => requestNextCard(cards.shift()!, cards, relativeIndex + 1),
                50,
              );
            }
          })
          .catch((error) => {
            reject(error as Error);
            console.error("Error processing card:", error);
          });
      };

      const savePDF = async () => {
        progressEvents.emit("progress", {
          progress: null,
          totalProgressAmount,
          phase: "Saving PDF",
        });

        // combine pdfs
        const pdfGenerator = mergePDFsBlobs(
          Array.from(pdfPages.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, blob]) => blob),
        );

        try {
          for await (const blob of pdfGenerator) {
            console.debug("saving pdf", blob);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = pdfName;
            a.click();
            URL.revokeObjectURL(url);
          }
          console.debug("done!");
          Sentry.addBreadcrumb({
            category: "pdf",
            message: "PDF generation complete",
            level: "info",
          });
          console.timeEnd("save");
          setIsRendering(false);
          progressEvents.emit("complete");
          resolve(void 0);
        } catch (error) {
          console.error("Error merging PDFs", error);
          reject(error as Error);
          console.timeEnd("save");
          setIsRendering(false);
          progressEvents.emit("complete");
        }
      };

      const startWorker = () => {
        const cards = assignments.shift()!;
        const workerIndex = numberOfPages - assignments.length;
        const worker = new PdfWorker({ name: `PDF Worker ${workerIndex}` });

        // set up handlers
        worker.onmessage = (
          e: MessageEvent<{
            type: string;
            success: boolean;
            error?: string;
            blob?: Blob;
          }>,
        ) => {
          switch (e.data.type) {
            case "cardProcessed": {
              progress++;
              cardsDone.set(workerIndex, (cardsDone.get(workerIndex) || 0) + 1);

              console.debug(
                `PDF Worker ${workerIndex}: card ${cardsDone.get(
                  workerIndex,
                )} of ${cardsPerPage} processed`,
              );

              progressEvents.emit("progress", {
                progress: progress,
                totalProgressAmount,
                phase: "Building PDF",
              });

              const done = cardsDone.get(workerIndex) === cardsPerPage;
              if (done) {
                worker.postMessage({
                  type: "save",
                });
              }
              break;
            }
            case "save": {
              console.debug(
                `PDF Worker ${workerIndex}: saved pdf size ${
                  e.data.blob?.size
                }`,
              );
              worker.terminate();
              if (assignments.length > 0) {
                startWorker();
              }
              // cleanup worker and start any sleeping workers
              pdfPages.set(workerIndex, e.data.blob!);

              if (pdfPages.size === numberOfPages) {
                // done, moving to save logic
                void Sentry.startSpan(
                  {
                    name: "savePDF",
                    op: "pdf.save",
                    attributes: {
                      numberOfPages,
                      cardsPerPage,
                    },
                  },
                  async () => {
                    await savePDF();
                  },
                );
              }
              break;
            }
            case "error":
              reject(new Error(e.data.error));
              console.error("PDF error:", e.data.error);
              console.timeEnd("save");
              setIsRendering(false);
              progressEvents.emit("complete");
              break;
          }
        };

        worker.onerror = (e) => {
          console.error("Worker error:", e.error);
          reject(e.error as Error);
          console.timeEnd("save");
          setIsRendering(false);
          progressEvents.emit("complete");
        };

        // start the worker
        doTimeout(() => {
          requestNextCard(
            [cards.shift()!, worker],
            cards.map((card) => [card, worker]),
            0,
          );
        });
      };

      // Finally start the process
      progressEvents.emit("progress", {
        progress: progress,
        totalProgressAmount,
        phase: "Building PDF",
      });

      for (let i = 0; i < maxWorkers; i++) {
        startWorker();
      }
    });
  }, [
    contentRef,
    settings,
    images,
    imageMatrix,
    cardsPerPage,
    cardPositionMeta,
    queryClient,
    setIsRendering,
  ]);

  return useCallback(() => {
    void Sentry.startSpan(
      {
        name: "generatePdf",
        op: "pdf.generate",
        attributes: {
          numberOfPages: imageMatrix.length,
          cardsPerPage,
        },
      },
      generatePdf,
    );
  }, [generatePdf, imageMatrix.length, cardsPerPage]);
};
