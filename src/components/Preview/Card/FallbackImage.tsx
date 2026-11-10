import { Box, Center, Image, Spinner, Text } from "@chakra-ui/react";
import { useState } from "react";

export type FallbackImageProps = {
  /** URLs for the same picture, tried in order until one loads. */
  uris: string[];
  alt: string;
};

/**
 * A card-shaped thumbnail that works through a list of mirrors, with a
 * spinner while loading and a message once every URL has failed.
 */
export const FallbackImage = ({ uris, alt }: FallbackImageProps) => {
  const [uriIndex, setUriIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(uris.length > 0);
  const [hasFailed, setHasFailed] = useState(uris.length === 0);

  const handleError = () => {
    if (uriIndex < uris.length - 1) {
      setUriIndex((index) => index + 1);
      return;
    }

    setIsLoading(false);
    setHasFailed(true);
  };

  return (
    <Box
      position="relative"
      borderRadius="lg"
      width="full"
      aspectRatio="0.714"
      overflow="hidden"
      bg="bg.subtle"
    >
      {hasFailed ? (
        <Center height="full" padding="2">
          <Text fontSize="xs" color="fg.error">
            Image unavailable
          </Text>
        </Center>
      ) : (
        <Image
          src={uris[uriIndex]}
          alt={alt}
          width="full"
          height="full"
          objectFit="cover"
          loading="lazy"
          opacity={isLoading ? 0 : 1}
          transition="opacity 0.2s ease-in-out"
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
      )}
      {isLoading && !hasFailed ? (
        <Center position="absolute" inset="0">
          <Spinner size="sm" color="accent.solid" />
        </Center>
      ) : null}
    </Box>
  );
};
