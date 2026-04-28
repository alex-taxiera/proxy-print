import * as Sentry from "@sentry/react";
import { useQueryClient } from "@tanstack/react-query";
import { PDFDocument } from "pdf-lib";
import { useContext } from "react";

import {
  getIsLocalImage,
  Image as ImageType,
  ImagesContext,
  PossiblyEmptyImage,
  getIsEmptyImage,
} from "~/context/ImagesContext";
import { getQueryKeyForImage, ImageQueryData } from "~/queries/images";
import { useSettingsStore } from "~/store/settingsStore";
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

export const useGeneratePdf = (
  contentRef: React.RefObject<HTMLElement | null>,
) => {
  const queryClient = useQueryClient();
  const settings = useSettingsStore((s) => s.settings);
  const basePdfBytes = useSettingsStore((s) => s.basePdfBytes);
  const basePdfPageCount = useSettingsStore((s) => s.basePdfPageCount) ?? 1;
  const { images, setIsRendering } = useContext(ImagesContext);
  const { pages, cardsPerPage } = usePreviewData();
  const cardPositionMeta = useCardPositionMeta();

  const generatePdf = async () => {
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
      const guidesThickness = guideBorderWidth;
      const guidesAtBleedEdge = settings.guidesAtBleedEdge;
      const guideLength = Number(settings.guideLength);
      const pdfName = `${settings.filename}.pdf`;
      const extendedGuidesOnly = settings.extendedGuidesOnly;
      const backPagesShowGuides = settings.backPagesShowGuides;
      const cardHeight = Number(settings.cardHeight);
      const cardWidth = Number(settings.cardWidth);
      const maxDpi = Number(settings.maxDpi);
      const convertToJpg = settings.convertToJpg;
      const jpgQuality = Number(settings.jpgQuality);

      // Compute crop fractions analytically in mm-space.
      // The <img> has CSS width = imgWidthMm, height = auto (natural aspect ratio).
      // So rendered img height in px = imgWidth_px × (naturalH_px / naturalW_px).
      // Crop fraction for width:  containerWidthMm / imgWidthMm × naturalW_px
      // Crop fraction for height: containerHeightMm / rendered_imgHeight_px × naturalH_px
      //                         = containerHeightMm / (imgWidthMm × naturalH/naturalW) × naturalH_px
      //                         = containerHeightMm / imgWidthMm × naturalW_px   ← naturalH cancels!
      // Both sourceWidth and sourceHeight divide by imgWidthMm and multiply by naturalWidth.
      const enableBleedEdge = settings.enableBleedEdge;
      const imageZoomMm = enableBleedEdge ? 6.2 : 0;
      const imageContainerBufferMm = enableBleedEdge ? guideBorderWidth : 0;
      const containerWidthMm =
        cardWidth + 2 * bleedEdgeWidth + imageContainerBufferMm;
      const containerHeightMm =
        cardHeight + 2 * bleedEdgeWidth + imageContainerBufferMm;
      const imgWidthMm = cardWidth + imageZoomMm;

      const physicalCardHeight =
        (cardHeight + 2 * bleedEdgeWidth + guideBorderWidth) / 25.4;
      const physicalCardWidth =
        (cardWidth + 2 * bleedEdgeWidth + guideBorderWidth) / 25.4;

      let progress = 0;
      const totalProgressAmount = images.length * 2; // 1 for processing 1 for adding to pdf
      const numberOfPages = pages.length;
      const maxWorkers = Math.min(Math.floor(numberOfPages / 2) || 1, 34);
      const cardsDone = new Map<number, number>();
      const pdfPages = new Map<number, Blob>();

      // Build per-page image assignments; each entry carries the full image object
      const assignments: PossiblyEmptyImage[][] = pages.map((page) =>
        page.items.map((item) => item.image),
      );

      const processCard = async ({
        image,
        relativeIndex,
      }: {
        image: PossiblyEmptyImage;
        relativeIndex: number;
      }) => {
        const typedImage: ImageType | undefined = getIsEmptyImage(image)
          ? undefined
          : (image as ImageType);
        console.debug(`Card (rel ${relativeIndex}) processing`);
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
        const downloadableImageData = typedImage
          ? queryClient.getQueryData<ImageQueryData>(
              getQueryKeyForImage(typedImage),
            )
          : undefined;

        const rawMimeType = convertToJpg
          ? "image/jpeg"
          : typedImage && getIsLocalImage(typedImage)
            ? typedImage.file.type
            : (downloadableImageData?.mimeType ?? "image/png");
        // pdf-lib does not support WEBP natively; convert to PNG at the canvas step.
        const mimeType =
          !convertToJpg && rawMimeType === "image/webp"
            ? "image/png"
            : rawMimeType;

        const imgQuality = convertToJpg ? jpgQuality : 1;

        if (typedImage) {
          try {
            // Get the image source URL (could be blob URL or data URL)
            const imageSrc = URL.createObjectURL(downloadableImageData!.data);

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
              (containerWidthMm / imgWidthMm) * tempImg.naturalWidth;
            const sourceHeight =
              (containerHeightMm / imgWidthMm) * tempImg.naturalWidth;
            const sourceX = (tempImg.naturalWidth - sourceWidth) / 2;
            const sourceY = (tempImg.naturalHeight - sourceHeight) / 2;

            // Calculate DPI based on the physical dimensions of the card and the pixel dimensions of the cropped image
            const cardDpi = Math.round(
              Math.sqrt(
                sourceWidth * sourceWidth + sourceHeight * sourceHeight,
              ) /
                Math.sqrt(
                  physicalCardWidth * physicalCardWidth +
                    physicalCardHeight * physicalCardHeight,
                ),
            );

            console.debug("cardDpi", cardDpi);
            // Calculate scale factor based on DPI limit
            const dpiScale = cardDpi > maxDpi ? maxDpi / cardDpi : 1;

            // Apply scaling to target dimensions
            const targetWidth = Math.round(sourceWidth * dpiScale);
            const targetHeight = Math.round(sourceHeight * dpiScale);

            // Log when DPI limiting is applied
            if (dpiScale < 1) {
              console.debug(
                `DPI limiting applied: ${cardDpi} DPI → ${Math.round(cardDpi * dpiScale)} DPI (scale: ${dpiScale.toFixed(3)})`,
              );
            }

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

              imageDataUrl = cropCanvas.toDataURL(mimeType, imgQuality);

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
          `Card (rel ${relativeIndex}) of ${pages.length * cardsPerPage} processed`,
        );

        const { isFirstRow, isLastRow, isFirstColumn, isLastColumn } =
          cardPositionMeta[relativeIndex];

        return {
          imageDataUrl,
          mimeType,
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
                extendedGuidesOnly,
                guideLength,
              }
            : null,
        };
      };

      const requestNextCard = (
        data: [PossiblyEmptyImage, Worker],
        cards: [PossiblyEmptyImage, Worker][],
        relativeIndex: number,
        workerInitData?: { basePdfBytes: Uint8Array; basePdfPageIndex: number },
        pageTransformData?: {
          offsetX: number;
          offsetY: number;
          pageRotation: number;
        },
        showGuides?: boolean,
      ) => {
        const [image, worker] = data;

        progressEvents.emit("progress", {
          progress: progress,
          totalProgressAmount,
          phase: "Building PDF",
        });

        processCard({
          image,
          relativeIndex,
        })
          .then((card) => {
            progressEvents.emit("progress", {
              progress: progress,
              totalProgressAmount,
              phase: "Building PDF",
            });
            const cardData =
              showGuides === false ? { ...card, guides: null } : card;
            worker.postMessage({
              type: "addImage",
              data: {
                card: cardData,
                init: {
                  pageHeight: Number(settings.pageHeight),
                  pageWidth: Number(settings.pageWidth),
                  unit: settings.unit,
                  // Only sent with the first card message; worker ignores init once pdfDoc is set.
                  ...workerInitData,
                  ...pageTransformData,
                },
              },
            });

            if (cards.length > 0) {
              doTimeout(
                () =>
                  requestNextCard(
                    cards.shift()!,
                    cards,
                    relativeIndex + 1,
                    undefined,
                    pageTransformData,
                    showGuides,
                  ),
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
            errorStack?: string;
            blob?: Blob;
            event?: string;
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
              reject(
                new Error(`PDF error during ${e.data.event}: ${e.data.error}`, {
                  cause: e.data.errorStack,
                }),
              );
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
        const basePdfPageIndex = basePdfBytes
          ? (workerIndex - 1) % basePdfPageCount
          : undefined;

        const pageType = pages[workerIndex - 1]?.pageType;
        const isBack = pageType === "back";
        const pageTransformData = {
          offsetX: Number(isBack ? settings.backOffsetX : settings.offsetX),
          offsetY: Number(isBack ? settings.backOffsetY : settings.offsetY),
          pageRotation: Number(
            isBack ? settings.backPageRotation : settings.pageRotation,
          ),
        };
        const showGuides = isBack ? backPagesShowGuides : true;

        doTimeout(() => {
          requestNextCard(
            [cards.shift()!, worker],
            cards.map((card) => [card, worker] as [PossiblyEmptyImage, Worker]),
            0,
            basePdfBytes !== null && basePdfPageIndex !== undefined
              ? { basePdfBytes: basePdfBytes.slice(), basePdfPageIndex }
              : undefined,
            pageTransformData,
            showGuides,
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
  };

  return () => {
    void Sentry.startSpan(
      {
        name: "generatePdf",
        op: "pdf.generate",
        attributes: {
          numberOfPages: pages.length,
          cardsPerPage,
        },
      },
      generatePdf,
    );
  };
};
