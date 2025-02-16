import { ImageUploader } from "./ImageUploader";
import { PrintableImages } from "./PrintableImages";
import { SettingsForm } from "./SettingsForm";
import { SettingsProvider } from "./SettingsProvider";
import { ImagesProvider } from "./ImagesProvider";

import "./App.css";

function App() {
  return (
    <>
      <header id="app-header">
        <h1>Proxy Print Setup</h1>
      </header>
      <SettingsProvider>
        <ImagesProvider>
          <main id="app-main">
            <ImageUploader />
            <SettingsForm />
            <PrintableImages />
          </main>
        </ImagesProvider>
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
