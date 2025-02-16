import { useCallback, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { ImagesContext } from "./ImagesContext";

export function ImageUploader() {
  const { onAdd } = useContext(ImagesContext);

  const addImages = useCallback((files: File[]) => {
    onAdd(files.map((file) => ({
        name: file.name,
        src: URL.createObjectURL(file),
      }))
    );
  }, [onAdd]);

  const inputOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        addImages(Array.from(files));
      }
    },
    [addImages]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addImages(acceptedFiles);
    },
    [addImages]
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
