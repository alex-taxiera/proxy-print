import { useContext } from "react";
import { ImagesContext } from "./context/ImagesContext";

import "./ImageDownloadIndicator.css";

export function ImageDownloadIndicator() {
  const { isFetching } = useContext(ImagesContext);
  if (!isFetching) {
    return null;
  }

  return (
    <div id="download-indicator" className={isFetching ? "active" : ""}>
      Downloading images from MPC Autofill...
    </div>
  );
}
