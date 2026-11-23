import { toaster } from "@/components/ui/toaster";

import { saveBlobToDisk } from "@/desktop/save-file";
import { IS_DESKTOP } from "@/desktop/window";

export const downloadBlob = (blob: Blob, fileName: string): void => {
  if (IS_DESKTOP) {
    // Webviews don't reliably honour blob-anchor downloads, so the desktop
    // app asks where to save and writes the file itself.
    saveBlobToDisk(blob, fileName).catch((error: unknown) => {
      toaster.create({
        type: "error",
        title: `Couldn't save ${fileName}`,
        description: error instanceof Error ? error.message : String(error),
      });
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
