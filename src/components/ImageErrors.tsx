import { css } from "styled-system/css";
import { flex } from "styled-system/patterns";

import { Alert } from "@/components/ui-old/alert";

import { DownloadableImage, getIsGoogleImage } from "@/context/ImagesContext";

export type ImageErrorsProps = {
  onDismiss: () => void;
  imagesWithError: DownloadableImage[];
};

export const ImageErrors = ({
  onDismiss,
  imagesWithError,
}: ImageErrorsProps) => {
  if (imagesWithError.length < 1) {
    return null;
  }

  return (
    <Alert.Root status="error">
      <Alert.StatusIcon />
      <Alert.Content>
        <Alert.Title>Image Errors</Alert.Title>
        <Alert.Description>
          Could not load the following images
          <ul
            className={flex({
              direction: "column",
              gap: "0.25rem",
              listStyleType: "none",
              margin: 0,
              paddingX: "4",
              paddingY: "2",
            })}
          >
            {imagesWithError.map((image) => {
              const id = getIsGoogleImage(image) ? image.id : image.uri;

              return (
                <li
                  key={image.uuid}
                  className={css({
                    fontSize: "0.875rem",
                  })}
                >
                  <strong>{image.name}</strong>
                  {id ? (
                    <>
                      &nbsp;
                      <span className={css({ fontFamily: "mono" })}>
                        ({id})
                      </span>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Alert.Description>
      </Alert.Content>
      <Alert.DismissButton onClick={onDismiss} />
    </Alert.Root>
  );
};
