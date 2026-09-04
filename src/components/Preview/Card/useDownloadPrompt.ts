import { useState } from "react";

/** Asks about front/back pairings before downloading, but only when the cards
 * being downloaded actually have backs to include. */
export const useDownloadPrompt = (
  pairedBackCount: number,
  downloadImages: (options?: { includeBacks?: boolean }) => void,
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const requestDownload = () => {
    if (pairedBackCount > 0) {
      setIsDialogOpen(true);
    } else {
      downloadImages();
    }
  };

  return { isDialogOpen, setIsDialogOpen, requestDownload };
};
