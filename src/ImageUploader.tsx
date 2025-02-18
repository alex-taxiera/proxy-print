import { useCallback, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { ImagesContext } from "./ImagesContext";

export function ImageUploader() {
  const { onAdd } = useContext(ImagesContext);

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

  const { getRootProps, getInputProps, isDragActive, isDragAccept } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/bmp": [".bmp"],
      },
    });

  const dropzoneStyle: React.CSSProperties = {
    border: "2px dashed #007bff",
    borderRadius: "5px",
    padding: "20px",
    textAlign: "center",
    transition: "border .3s ease-in-out",
    backgroundColor: isDragAccept ? "#f0f8ff" : "#fafafa",
    cursor: "pointer",
    color: "black",
  };

  return (
    <div
      {...getRootProps()}
      style={dropzoneStyle}
      className={`dropzone ${isDragActive ? "active" : ""}`}
    >
      <input {...getInputProps()} onChange={inputOnChange} />
      Add Images
    </div>
  );
}
