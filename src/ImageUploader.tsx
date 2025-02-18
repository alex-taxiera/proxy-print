import { useCallback, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { ImagesContext } from "./context/ImagesContext";

import "./ImageUploader.css";

export function ImageUploader() {
  const { onAdd, isRendering } = useContext(ImagesContext);

  const inputOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        onAdd(Array.from(files));
      }
    },
    [onAdd]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onAdd(acceptedFiles);
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
    },
  });

  console.log("getRootProps() :", getRootProps());
  console.log("getInputProps() :", getInputProps());

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
