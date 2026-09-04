import { Box, HStack } from "@chakra-ui/react";
import { useContext } from "react";

import { MobileSettingsDrawer } from "@/components/Sidebar";

import { ImagesContext } from "@/context/ImagesContext";

import { PaginationControls } from "./PaginationControls";
import { PreviewActions } from "./PreviewActions";
import { SelectionActionBar } from "./SelectionActionBar";

/** Docked strip along the bottom of the app holding the controls that used to
 * scroll away with the preview. */
export const BottomBar = () => {
  const { images, imagesWithError } = useContext(ImagesContext);
  const hasPreview = images.length > 0 || imagesWithError.length > 0;

  return (
    <Box
      as="footer"
      // Containing block for the selection action bar, which floats above it
      position="relative"
      zIndex="2"
      flexShrink={0}
      borderTopWidth="1px"
      borderColor="border"
      backgroundColor="bg.muted"
      // Without a preview there is nothing here but the mobile settings trigger
      display={{ base: "block", md: hasPreview ? "block" : "none" }}
    >
      <HStack
        width="full"
        maxWidth="8xl"
        marginX="auto"
        gap={{ base: "1", md: "2" }}
        rowGap="2"
        flexWrap="wrap"
        paddingY="2"
        paddingX={{ base: "2", sm: "4" }}
      >
        {hasPreview ? <PreviewActions /> : null}
        <HStack gap={{ base: "1", md: "2" }} marginLeft="auto">
          <PaginationControls />
          <MobileSettingsDrawer />
        </HStack>
      </HStack>
      <SelectionActionBar />
    </Box>
  );
};
