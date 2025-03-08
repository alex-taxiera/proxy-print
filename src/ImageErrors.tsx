import { useContext, useId } from "react";
import { ImagesContext } from "./context/ImagesContext";

import "./ImageErrors.css";

export const ImageErrors = () => {
  const { imagesWithError, onClearErrors } = useContext(ImagesContext);

  const errorDescriptionId = useId();

  if (imagesWithError.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Image Loading Error"
      aria-describedby={errorDescriptionId}
      role="alert"
      className="image-errors"
    >
      <button aria-label="Dismiss" className="close" onClick={onClearErrors} />
      <div className="description" id={errorDescriptionId}>
        <div>
          Could not load the following images:
        </div>
        <ul>
          {imagesWithError.map((image) => (
            <li key={image.uuid}>
              <span className="name">&quot;{image.name}&quot;</span>{" "}
              <span aria-label={`ID: ${image.id}`} className="identifier">{image.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
