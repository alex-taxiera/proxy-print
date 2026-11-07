import {
  BoxProps,
  useFileUpload,
  type FileUploadFileAcceptDetails,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";

import {
  FileUploadRootProvider,
  FileUploadDropzone,
} from "@/components/ui/file-upload";
import { toaster } from "@/components/ui/toaster";

import { ImagesContext, LocalImageData } from "@/context/ImagesContext";
import { useSettingsStore } from "@/store/settingsStore";
import { createFileHash } from "@/utils/create-file-hash";
import { parseMpcFillXml } from "@/utils/parse-mpcfill-xml";
import { extractPdfImages } from "@/utils/pdf-import/extract-pdf-images";
import type { PdfExtraction } from "@/utils/pdf-import/types";
import { formatCount } from "@/utils/pluralize";

import { PdfImportDialog, type PdfImportResult } from "./PdfImportDialog";
import { XmlImportDialog, XmlImportPending } from "./XmlImportDialog";

const extensionOf = (file: File) =>
  file.name.toLowerCase().split(".").pop() ?? "";

const hashImage = async (file: File): Promise<LocalImageData> => ({
  file,
  hash: await createFileHash(file),
});

const parseXmlFiles = async (
  files: File[],
): Promise<XmlImportPending | null> => {
  const parsed = (
    await Promise.all(
      files.map(async (file) => {
        try {
          return parseMpcFillXml(await file.text());
        } catch (error) {
          console.error(error);
          toaster.create({
            type: "error",
            title: `Couldn't read ${file.name}`,
            description: "No cards were found in this XML.",
          });
          return null;
        }
      }),
    )
  ).filter((result) => result !== null);
  if (parsed.length === 0) return null;

  return {
    slotAdds: parsed.flatMap((result) => result.slots),
    xmlDefaultCardBack:
      parsed.find((result) => result.defaultCardBack !== null)
        ?.defaultCardBack ?? null,
  };
};

type PdfProgress = { fileName: string; page: number; pageCount: number };

export function ImageUploader(props: BoxProps) {
  const { onAdd, onAddSlots, onClear, isLoadingProject } =
    useContext(ImagesContext);
  const setDefaultCardBack = useSettingsStore((s) => s.setDefaultCardBack);
  const existingCardBack = useSettingsStore((s) => s.defaultCardBack);
  const cardWidth = useSettingsStore((s) => s.settings.cardWidth);
  const cardHeight = useSettingsStore((s) => s.settings.cardHeight);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PdfProgress | null>(null);

  // Pending XML import state
  const [xmlPending, setXmlPending] = useState<XmlImportPending | null>(null);
  const [updateDefaultCardBack, setUpdateDefaultCardBack] = useState(false);

  // PDFs waiting for the import dialog, shown one at a time.
  const [pdfQueue, setPdfQueue] = useState<PdfExtraction[]>([]);
  const [pdfImportKey, setPdfImportKey] = useState(0);

  const cardSizeMm = { w: Number(cardWidth), h: Number(cardHeight) };

  const processFiles = async (files: File[]) => {
    const xmlFiles = files.filter((file) => extensionOf(file) === "xml");
    const pdfFiles = files.filter((file) => extensionOf(file) === "pdf");
    const imageFiles = files.filter(
      (file) => !["xml", "pdf"].includes(extensionOf(file)),
    );

    const images = await Promise.all(imageFiles.map(hashImage));
    if (images.length > 0) onAdd(images);

    const pending = await parseXmlFiles(xmlFiles);
    if (pending) {
      // Default the toggle: true when no existing card back, false otherwise
      setUpdateDefaultCardBack(
        pending.xmlDefaultCardBack !== null && existingCardBack === null,
      );
      setXmlPending(pending);
    }

    for (const file of pdfFiles) {
      try {
        const extraction = await extractPdfImages(
          file,
          cardSizeMm,
          ({ page, pageCount }) =>
            setPdfProgress({ fileName: file.name, page, pageCount }),
        );
        // A manifest can restore cards that are all re-downloaded, so only
        // an extraction without one can come up empty.
        if (
          !extraction.manifest &&
          extraction.pages.every((page) => page.cards.length === 0)
        ) {
          const { failed } = extraction.warnings;
          toaster.create({
            type: "error",
            title: `No card images found in ${file.name}`,
            description:
              failed > 0
                ? `${formatCount(failed, "image")} couldn't be read.`
                : "Scanned or flattened PDFs (one picture per page) aren't supported.",
          });
        } else {
          setPdfQueue((queue) => [...queue, extraction]);
        }
      } catch (error) {
        console.error(error);
        toaster.create({
          type: "error",
          title: `Couldn't read ${file.name}`,
          description: error instanceof Error ? error.message : undefined,
        });
      }
    }
  };

  const onFileAccept = ({ files }: FileUploadFileAcceptDetails) => {
    setIsProcessing(true);
    processFiles(files)
      .catch(console.error)
      .finally(() => {
        setIsProcessing(false);
        setPdfProgress(null);
      });
  };

  const handleXmlConfirm = () => {
    if (!xmlPending) return;
    // Set the card back in Zustand FIRST (synchronous) so that when onAddSlots
    // reads useSettingsStore.getState().defaultCardBack it sees the new value
    // and batches the card back download with the slot images in one wave.
    if (updateDefaultCardBack && xmlPending.xmlDefaultCardBack) {
      setDefaultCardBack(xmlPending.xmlDefaultCardBack);
    }
    onAddSlots(xmlPending.slotAdds);
    setXmlPending(null);
  };

  const handleXmlCancel = () => {
    setXmlPending(null);
  };

  const nextPdf = () => {
    setPdfQueue((queue) => queue.slice(1));
    setPdfImportKey((key) => key + 1);
  };

  const handlePdfConfirm = (result: PdfImportResult) => {
    const previousCardBack = useSettingsStore.getState().defaultCardBack;
    // Same ordering rule as XML: card back first so it downloads with the
    // slots.
    if (result.defaultCardBack) setDefaultCardBack(result.defaultCardBack);
    const ids = onAddSlots(result.slots);
    nextPdf();

    toaster.create({
      type: "success",
      title: `Imported ${formatCount(ids.length, "card")} from ${result.fileName}`,
      // Long enough to notice a wrong import and undo it.
      duration: 10_000,
      action: {
        label: "Undo",
        onClick: () => {
          onClear(ids);
          if (result.defaultCardBack) setDefaultCardBack(previousCardBack);
        },
      },
    });
  };

  const fileUpload = useFileUpload({
    maxFiles: Infinity,
    disabled: isProcessing || isLoadingProject,
    onFileAccept,
    accept: [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".xml", ".pdf"],
  });

  // hack to clear files after they are accepted
  const acceptedFiles = fileUpload.acceptedFiles;
  useEffect(() => {
    if (acceptedFiles.length > 0) {
      fileUpload.clearFiles();
    }
  }, [acceptedFiles, fileUpload]);

  return (
    <>
      <XmlImportDialog
        pending={xmlPending}
        hasExistingCardBack={existingCardBack !== null}
        updateDefaultCardBack={updateDefaultCardBack}
        onUpdateDefaultCardBackChange={setUpdateDefaultCardBack}
        onConfirm={handleXmlConfirm}
        onCancel={handleXmlCancel}
      />
      <PdfImportDialog
        // Wait for any XML dialog so only one is open at a time.
        extraction={xmlPending ? null : (pdfQueue[0] ?? null)}
        importKey={pdfImportKey}
        hasExistingCardBack={existingCardBack !== null}
        cardSizeMm={cardSizeMm}
        onConfirm={handlePdfConfirm}
        onCancel={nextPdf}
      />
      <FileUploadRootProvider value={fileUpload} {...props}>
        <FileUploadDropzone
          gap="2"
          width="full"
          minHeight="0"
          py="4"
          label={fileUpload.dragging ? "Drop!" : "Drop XML, PDF or image files"}
          description={
            pdfProgress
              ? `Reading ${pdfProgress.fileName}: page ${pdfProgress.page} of ${pdfProgress.pageCount}`
              : "click to browse"
          }
        />
      </FileUploadRootProvider>
    </>
  );
}
