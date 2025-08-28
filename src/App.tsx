import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { hstack } from "styled-system/patterns";

import { Header } from "./components/Header";
import { Preview } from "./components/Preview";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/ui/styled/toast";
import { AlertToast } from "./components/ui/toast";
import { ImageSelectionProvider } from "./context/ImageSelectionProvider";
import { ImagesProvider } from "./context/ImagesProvider";
import { SettingsProvider } from "./context/SettingsProvider";
import { toaster } from "./utils/toaster";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster toaster={toaster}>
        {(toast) => <AlertToast toast={toast} />}
      </Toaster>
      <SettingsProvider>
        <ImagesProvider>
          <ImageSelectionProvider>
            <Header />
            <main
              className={hstack({
                alignItems: "stretch",
                flex: 1,
                gap: "0",
                overflow: "hidden",
              })}
            >
              <Preview />
              <Sidebar />
            </main>
          </ImageSelectionProvider>
        </ImagesProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
