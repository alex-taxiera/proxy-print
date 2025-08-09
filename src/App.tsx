import { hstack } from "styled-system/patterns";

import { PrintableImages } from "./PrintableImages";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/ui/styled/toast";
import { AlertToast } from "./components/ui/toast";
import { ImagesProvider } from "./context/ImagesProvider";
import { SettingsProvider } from "./context/SettingsProvider";
import { toaster } from "./utils/toaster";

function App() {
  return (
    <SettingsProvider>
      <ImagesProvider>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Header />
        <main
          className={hstack({
            alignItems: "stretch",
            flex: 1,
            gap: "0",
            overflow: "hidden",
          })}
        >
          <PrintableImages />
          <Sidebar />
        </main>
      </ImagesProvider>
    </SettingsProvider>
  );
}

export default App;
