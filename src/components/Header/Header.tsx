import { Box, Center, HStack } from "@chakra-ui/react";

import { TITLE_BAR_ID, windowFrame } from "@/desktop/window";

import { CommunityBanner } from "./CommunityBanner";
import { SocialLinks } from "./SocialLinks";
import { UpdateButton } from "./UpdateButton";
import { WindowControls } from "./WindowControls";

/**
 * In the desktop app the top row is also the window's title bar: the whole
 * row drags the window (its buttons and links still take their clicks), and
 * where the native frame is off it carries the window controls.
 */
const titleBarProps = (frame: "custom" | "mac") => ({
  id: TITLE_BAR_ID,
  "data-tauri-drag-region": "deep",
  height: "var(--title-bar-height)",
  maxWidth: "none",
  paddingY: "0",
  // Room for the traffic lights macOS overlays on the left; on the right the
  // window controls sit flush against the edge.
  paddingStart: frame === "mac" ? "20" : "4",
  paddingEnd: frame === "mac" ? "4" : "0",
  gap: "4",
  // An open dialog turns pointer events off for the rest of the page; the
  // window still has to be draggable and closable.
  pointerEvents: "auto",
  userSelect: "none",
});

export const Header = () => {
  const frame = windowFrame();

  return (
    <Center
      as="header"
      flexDirection="column"
      boxShadow="sm"
      backgroundColor="bg.muted"
      alignItems="center"
      zIndex="2"
    >
      <HStack
        width="full"
        maxWidth="8xl"
        justifyContent="space-between"
        {...(frame === "browser"
          ? { paddingY: "1", paddingX: { base: "2", sm: "4" } }
          : titleBarProps(frame))}
      >
        <Box
          as="h1"
          flex="1"
          fontSize={{ base: "sm", sm: "xl" }}
          fontWeight="bold"
        >
          Print My Proxy
        </Box>
        <HStack gap={{ base: "2", sm: "4" }}>
          <UpdateButton />
          <SocialLinks />
        </HStack>
        {frame === "custom" ? <WindowControls /> : null}
      </HStack>
      <CommunityBanner />
    </Center>
  );
};
