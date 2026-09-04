import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";

import { ImageSelectionProvider } from "@/context/ImageSelectionProvider";
import { ImagesProvider } from "@/context/ImagesProvider";
import { PreviewProvider } from "@/context/PreviewProvider";
import { useImageLoadingProgress } from "@/hooks/useImageLoadingProgress";
import { useSettingsStore } from "@/store/settingsStore";

import { Layout } from "./Layout";

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
        <PreviewProvider>
          <Layout />
        </PreviewProvider>
      </ImageSelectionProvider>
    </ImagesProvider>
  );
}

function App() {
  const hasHydrated = useSettingsStore((s) => s._hasHydrated);

  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        {hasHydrated ? <AppContent /> : null}
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
