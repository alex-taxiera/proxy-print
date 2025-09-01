import {
  Dialog,
  useFileUpload,
  type FileUploadFileAcceptDetails,
} from "@ark-ui/react";
import { useCallback, useContext, useEffect, useState } from "react";

import { css } from "styled-system/css";
import { center, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { FileUpload } from "~/components/ui/file-upload";

import { DecklistDialog } from "~/components/DecklistDialog";

import {
  GoogleImageData,
  ImagesContext,
  LocalImageData,
} from "~/context/ImagesContext";
import { createFileHash } from "~/utils/create-file-hash";

const parseXML = (file: File): Promise<GoogleImageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      console.debug("Parsing XML", event.target?.result);
      const parser = new DOMParser();
      const xml = parser.parseFromString(
        event.target?.result as string,
        "text/xml",
      );
      const cards: GoogleImageData[] = [];
      const frontsSection = xml.querySelector("fronts");
      const cardFronts = frontsSection?.querySelectorAll("card");
      if (!cardFronts) {
        reject(new Error("No cards found in XML"));
        return;
      }
      Array.from(cardFronts).forEach((card) => {
        const id = card.querySelector("id")?.textContent;
        const name = card.querySelector("name")?.textContent;
        const slots = card
          .querySelector("slots")
          ?.textContent?.split(",")
          .map(Number);
        if (id && name && slots) {
          slots.forEach((slot) => {
            cards[slot] = {
              id,
              name,
            };
          });
        }
      });
      resolve(cards.filter(Boolean));
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parseNonXmlFile = async (file: File): Promise<LocalImageData> => {
  const hash = await createFileHash(file);
  return { file, hash };
};

const processFiles = async (files: File[]) => {
  const xmlFiles = files.filter((file) => file.type === "text/xml");
  const nonXmlFiles = files.filter((file) => file.type !== "text/xml");
  const xmlFilesParsed = (await Promise.all(xmlFiles.map(parseXML))).flat();
  const nonXmlFilesHashed = await Promise.all(nonXmlFiles.map(parseNonXmlFile));

  return [...nonXmlFilesHashed, ...xmlFilesParsed];
};

export function ImageUploader() {
  const { onAdd } = useContext(ImagesContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileAccept = useCallback(
    ({ files }: FileUploadFileAcceptDetails) => {
      setIsProcessing(true);
      processFiles(files)
        .then(onAdd)
        .catch(console.error)
        .finally(() => setIsProcessing(false));
    },
    [onAdd],
  );

  const fileUpload = useFileUpload({
    maxFiles: Infinity,
    disabled: isProcessing,
    onFileAccept,
    accept: [".jpg", ".jpeg", ".png", ".bmp", ".xml"],
  });

  // hack to clear files after they are accepted
  const acceptedFiles = fileUpload.acceptedFiles;
  useEffect(() => {
    if (acceptedFiles.length > 0) {
      fileUpload.clearFiles();
    }
  }, [acceptedFiles, fileUpload]);

  return (
    <div
      className={vstack({ gap: "2", alignItems: "flex-start", width: "full" })}
    >
      <FileUpload.RootProvider value={fileUpload}>
        <FileUpload.Trigger asChild>
          <FileUpload.Dropzone
            className={css({ cursor: "pointer" })}
            onClick={(e) => e.preventDefault()}
          >
            <FileUpload.Label className={center({ flexDirection: "column" })}>
              <span>{fileUpload.dragging ? "Drop!" : "Drop files here"}</span>
              <span
                className={css({
                  color: "fg.muted",
                  fontSize: "xs",
                  visibility: fileUpload.dragging ? "hidden" : "visible",
                })}
              >
                or click to browse
              </span>
            </FileUpload.Label>
          </FileUpload.Dropzone>
        </FileUpload.Trigger>
        <FileUpload.HiddenInput />
      </FileUpload.RootProvider>
      <DecklistDialog>
        <Dialog.Trigger asChild>
          <Button variant="link" size="xs" colorPalette="gray">
            Import from Decklist
          </Button>
        </Dialog.Trigger>
      </DecklistDialog>
    </div>
  );
}
