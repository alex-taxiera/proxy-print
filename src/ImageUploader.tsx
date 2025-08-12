import { useCallback, useContext, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { GoogleImageData, ImagesContext } from "./context/ImagesContext";

import "./ImageUploader.css";

const parseXML = (file: File): Promise<GoogleImageData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      console.debug("Parsing XML", event.target?.result);
      const parser = new DOMParser();
      const xml = parser.parseFromString(
        event.target?.result as string,
        "text/xml"
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

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsProcessing(true);
    }
  }, []);

  const onDrop = useCallback(() => {
    setIsProcessing(true);
  }, []);

  // called for both dropped and input change
  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles)
        .then(onAdd)
        .catch(console.error)
        .finally(() => setIsProcessing(false));
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
    disabled: isRendering || isProcessing,
    onDropAccepted,
    accept: {
      "image/jpg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/bmp": [".bmp"],
      "text/xml": [".xml"],
    },
  });

  const rootProps = useMemo(
    () => getRootProps({ onDrop }),
    [getRootProps, onDrop]
  );

  const inputProps = useMemo(
    () => getInputProps({ onChange }),
    [getInputProps, onChange]
  );

  return (
    <div
      {...rootProps}
      className={`dropzone ${
        isDragActive || isFileDialogActive ? "active" : ""
      } ${isDragAccept ? "accept" : ""} ${
        isRendering || isProcessing ? "disabled" : ""
      }`}
    >
      <input {...inputProps} />
      {isProcessing ? "Processing files..." : "Add Images"}
    </div>
  );
}
