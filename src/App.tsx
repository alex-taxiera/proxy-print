import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { hstack } from "styled-system/patterns";

import { Toaster } from "~/components/ui/styled/toast";
import { AlertToast } from "~/components/ui/toast";

import { Header } from "~/components/Header";
import { Preview } from "~/components/Preview";
import { Sidebar } from "~/components/Sidebar";

import { ImageLoadingProvider } from "~/context/ImageLoadingContext";
import { ImageSelectionProvider } from "~/context/ImageSelectionProvider";
import { ImagesProvider } from "~/context/ImagesProvider";
import { SettingsProvider } from "~/context/SettingsProvider";
import { toaster } from "~/utils/toaster";

const queryClient = new QueryClient();

// This code is only for TypeScript
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient;
  }
}

// This code is for all users
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster toaster={toaster}>
        {(toast) => <AlertToast toast={toast} />}
      </Toaster>
      <ImageLoadingProvider>
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
      </ImageLoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
