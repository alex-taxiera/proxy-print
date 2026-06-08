import { Box, List } from "@chakra-ui/react";

import { Alert, AlertDismissButton } from "@/components/ui/alert";

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
    <Alert status="error" title="Image Errors">
      Could not load the following images
      <List.Root
        display="flex"
        flexDirection="column"
        gap="0.25rem"
        listStyleType="none"
        margin={0}
        paddingX="4"
        paddingY="2"
      >
        {imagesWithError.map((image) => {
          const id = getIsGoogleImage(image) ? image.id : image.uri;

          return (
            <List.Item key={image.uuid} fontSize="sm">
              <Box as="strong" fontWeight="heavy">
                {image.name}
              </Box>
              {id ? (
                <>
                  &nbsp;
                  <Box as="span" fontFamily="mono">
                    ({id})
                  </Box>
                </>
              ) : null}
            </List.Item>
          );
        })}
      </List.Root>
      <AlertDismissButton onClick={onDismiss} />
    </Alert>
  );
};
