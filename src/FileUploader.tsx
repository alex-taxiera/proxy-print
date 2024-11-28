import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export type ImageUploaderProps = {
  onChange: (files: File[]) => void;
}

export function ImageUploader({ onChange }: ImageUploaderProps) {
  const inputOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        onChange(Array.from(files));
      }
    },
    [onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onChange(acceptedFiles);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept } = useDropzone({ onDrop });

  const dropzoneStyle: React.CSSProperties = {
    border: '2px dashed #007bff',
    borderRadius: '5px',
    padding: '20px',
    textAlign: 'center',
    transition: 'border .3s ease-in-out',
    backgroundColor: isDragAccept ? '#f0f8ff' : '#fafafa',
    cursor: 'pointer',
    color: 'black'
  };

  return (
    <div {...getRootProps()} style={dropzoneStyle} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} onChange={inputOnChange} />
      Upload Images...
    </div>
  );
}
