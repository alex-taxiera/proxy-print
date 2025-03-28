import { ImageUploader } from "./ImageUploader";
import { PrintableImages } from "./PrintableImages";
import { SettingsForm } from "./SettingsForm";
import { SettingsProvider } from "./context/SettingsProvider";
import { ImagesProvider } from "./context/ImagesProvider";

import "./App.css";
import { ImageDownloadIndicator } from "./ImageDownloadIndicator";

function App() {
  return (
    <SettingsProvider>
      <ImagesProvider>
        <header id="app-header">
          <h1>Proxy Print Setup</h1>
          <ImageDownloadIndicator />
        </header>
        <main id="app-main">
          <PrintableImages />
          <aside>
            <div>
              <ImageUploader />
              <SettingsForm />
            </div>
          </aside>
        </main>
        <footer id="app-footer">
          <a href="https://github.com/alex-taxiera/proxy-print">{"<Code />"}</a>
          &nbsp;by&nbsp;
          <a href="https://github.com/alex-taxiera">Alex Taxiera</a>
        </footer>
      </ImagesProvider>
    </SettingsProvider>
  );
}

export default App;
