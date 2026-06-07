import { Button } from "@chakra-ui/react";
import { PDFDocument } from "pdf-lib";

import { Field } from "@/components/ui/field";

import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { useSettingsStore } from "@/store/settingsStore";

import {
  FileUploadList,
  FileUploadRoot,
  FileUploadTrigger,
} from "../ui/file-upload";

export const BasePDFInput = () => {
  const { formState, handle } = useSettingsFormState();
  const basePdfName = useSettingsStore((s) => s.basePdfName);
  const basePdfBytes = useSettingsStore((s) => s.basePdfBytes);
  const setBasePdf = useSettingsStore((s) => s.setBasePdf);

  const handleBasePdfChange = async (file: File) => {
    const bytes = await file.arrayBuffer();
    const bytesArray = new Uint8Array(bytes);
    const doc = await PDFDocument.load(bytesArray);
    const page = doc.getPage(0);
    const { width: widthPts, height: heightPts } = page.getSize();
    const pageCount = doc.getPageCount();

    // Convert pts to the current unit.
    const ptsPerUnit = formState.unit === "mm" ? 72 / 25.4 : 72;
    const pageWidth = (widthPts / ptsPerUnit).toFixed(3);
    const pageHeight = (heightPts / ptsPerUnit).toFixed(3);

    setBasePdf({ bytes: bytesArray, name: file.name, pageCount });
    void handle({ pageWidth, pageHeight });
  };

  const acceptedFile = basePdfBytes
    ? new File([new Uint8Array(basePdfBytes)], basePdfName ?? "base.pdf", {
        type: "application/pdf",
      })
    : null;

  return (
    <Field
      label="Base PDF"
      helperText="Cards will be printed on top of this PDF. Page size is locked to the PDF's dimensions"
    >
      <FileUploadRoot
        maxFiles={1}
        accept={{ "application/pdf": [".pdf"] }}
        onFileChange={(details) => {
          const file = details.acceptedFiles[0];
          if (!file) {
            setBasePdf(null);
          } else {
            void handleBasePdfChange(file);
          }
        }}
        acceptedFiles={acceptedFile ? [acceptedFile] : []}
      >
        {acceptedFile ? (
          <FileUploadList clearable />
        ) : (
          <FileUploadTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              colorPalette="gray"
              type="button"
            >
              Choose PDF...
            </Button>
          </FileUploadTrigger>
        )}
      </FileUploadRoot>
    </Field>
  );
};
