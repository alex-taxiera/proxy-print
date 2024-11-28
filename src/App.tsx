import { useState, useCallback } from "react";
import "./App.css";
import { ImageUploader } from "./FileUploader";
import { PrintableImages } from "./PrintableImages";

function App() {
  const [images, setImages] = useState<File[]>([]);

  const onFilesChange = useCallback((files: File[]) => {
    if (files) {
      setImages(Array.from(files));
    }
  }, []);

  return (
    <>
      <header id="app-header">
        <h1>Proxy Print</h1>
      </header>
      <main id="app-main">
        {images.length === 0 ? (
          <>
            <p>Upload images to get started</p>
            <ImageUploader onChange={onFilesChange} />
          </>
        ) : (
          <button onClick={() => setImages([])}>Clear Images</button>
        )}
        <PrintableImages files={images} />
      </main>
      <footer id="app-footer">
        <a href="https://github.com/alex-taxiera/proxy-print">{"<Code />"}</a>
        &nbsp;by&nbsp;
        <a href="https://github.com/alex-taxiera">Alex Taxiera</a>
      </footer>
    </>
  );
}

export default App;
