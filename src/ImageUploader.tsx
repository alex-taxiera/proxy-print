import { useCallback, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { GoogleImageData, ImagesContext } from "./context/ImagesContext";

import "./ImageUploader.css";

const parseXML = (file: File): Promise<GoogleImageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(
        event.target?.result as string,
        "text/xml"
      );
      const cards: GoogleImageData[] = [];
      Array.from(xml.querySelectorAll("card")).forEach((card) => {
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

  const inputOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        processFiles(Array.from(files)).then(onAdd).catch(console.error);
      }
    },
    [onAdd]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles).then(onAdd).catch(console.error);
    },
    [onAdd]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isFileDialogActive,
  } = useDropzone({
    disabled: isRendering,
    onDrop,
    accept: {
      "image/jpg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/bmp": [".bmp"],
      "text/xml": [".xml"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${
        isDragActive || isFileDialogActive ? "active" : ""
      } ${isDragAccept ? "accept" : ""} ${isRendering ? "disabled" : ""}`}
    >
      <input {...getInputProps()} onChange={inputOnChange} />
      Add Images
    </div>
  );
}
