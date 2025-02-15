import { useState, useCallback } from "react";
import "./App.css";
import { ImageUploader } from "./ImageUploader";
import { PrintableImages } from "./PrintableImages";
import { SettingsForm } from "./SettingsForm";
import { SettingsProvider } from "./SettingsProvider";

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
      <SettingsProvider>
        <main id="app-main">
          <ImageUploader onChange={onFilesChange} />
          {images.length === 0 ? (
            <>
              <p>Upload images to get started.</p>
              <p>
                You can download images from your{" "}
                <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
                  MPC Autofill
                </a>{" "}
                project with their &quot;Download Card Images&quot; option.
              </p>
            </>
          ) : (
            <SettingsForm />
          )}
          <PrintableImages files={images} />
        </main>
      </SettingsProvider>
      <footer id="app-footer">
        <a href="https://github.com/alex-taxiera/proxy-print">{"<Code />"}</a>
        &nbsp;by&nbsp;
        <a href="https://github.com/alex-taxiera">Alex Taxiera</a>
      </footer>
    </>
  );
}

export default App;
