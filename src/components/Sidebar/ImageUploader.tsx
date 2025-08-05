import { useFileUpload, type FileUploadFileAcceptDetails } from "@ark-ui/react";
import { useCallback, useContext, useEffect, useState } from "react";

import { css } from "styled-system/css";
import { center } from "styled-system/patterns";

import { GoogleImageData, ImagesContext } from "../../context/ImagesContext";
import { FileUpload } from "../ui/file-upload";

const parseXML = (file: File): Promise<GoogleImageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
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

const processFiles = async (files: File[]) => {
  const xmlFiles = files.filter((file) => file.type === "text/xml");
  const nonXmlFiles = files.filter((file) => file.type !== "text/xml");
  const xmlFilesParsed = (await Promise.all(xmlFiles.map(parseXML))).flat();

  return [...nonXmlFiles, ...xmlFilesParsed];
};

export function ImageUploader() {
  const { onAdd, isRendering } = useContext(ImagesContext);
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
    disabled: isRendering || isProcessing,
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
    <FileUpload.RootProvider value={fileUpload}>
      <FileUpload.Trigger asChild>
        <FileUpload.Dropzone
          className={css({ cursor: "pointer" })}
          onClick={(e) => e.preventDefault}
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
  );
}
