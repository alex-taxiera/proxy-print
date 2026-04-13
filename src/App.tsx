import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { hstack } from "styled-system/patterns";

import { Toaster } from "~/components/ui/styled/toast";
import { AlertToast } from "~/components/ui/toast";

import { Header } from "~/components/Header";
import { Preview } from "~/components/Preview";
import { Sidebar } from "~/components/Sidebar";

import { ImageSelectionProvider } from "~/context/ImageSelectionProvider";
import { ImagesProvider } from "~/context/ImagesProvider";
import { useImageLoadingProgress } from "~/hooks/useImageLoadingProgress";
import { useSettingsStore } from "~/store/settingsStore";
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

function AppContent() {
  useImageLoadingProgress();

  return (
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
  );
}

function App() {
  const hasHydrated = useSettingsStore((s) => s._hasHydrated);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster toaster={toaster}>
        {(toast) => <AlertToast toast={toast} />}
      </Toaster>
      {hasHydrated ? <AppContent /> : null}
    </QueryClientProvider>
  );
}

export default App;
