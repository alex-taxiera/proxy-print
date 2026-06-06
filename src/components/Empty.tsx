import { Link, VStack } from "@chakra-ui/react";

export const Empty = () => {
  return (
    <VStack
      paddingY="6"
      paddingX="2"
      gap="6"
      justifyContent="center"
      alignItems="center"
      flex={1}
      height="full"
    >
      <p>Add images to get started.</p>
      <p>
        Upload an XML from{" "}
        <Link
          href="https://mpcfill.com/"
          target="_blank"
          rel="noreferrer"
          colorPalette="accent"
        >
          MPC Autofill
        </Link>{" "}
        &quot;Download XML&quot; option.
      </p>
      <p>Or import a decklist from your favorite deckbuilder!</p>
    </VStack>
  );
};
