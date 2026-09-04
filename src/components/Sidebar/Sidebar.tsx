import {
  Icon,
  Box,
  Collapsible,
  Button,
  IconButton,
  VStack,
  Link,
  StackProps,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  LuPanelRightClose,
  LuPanelRightOpen,
  LuSettings,
} from "react-icons/lu";

import { DialogTrigger } from "@/components/ui/dialog";
import {
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTrigger,
  DrawerCloseTrigger,
} from "@/components/ui/drawer";

import { DecklistDialog } from "../DecklistDialog";
import { Tooltip } from "../ui/tooltip";
import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";

const SidebarContent = (props: StackProps) => (
  <VStack
    height="full"
    gap="4"
    paddingY={{ base: "2", lg: "4" }}
    paddingX={{ base: "2", lg: "4" }}
    overflowY="auto"
    overflowX="hidden"
    tabIndex={-1}
    {...props}
  >
    <VStack gap="2" alignItems="flex-start" width="full">
      <ImageUploader />
      <DecklistDialog>
        <DialogTrigger asChild>
          <Link fontSize="sm" as="button" colorPalette="accent">
            Import from Decklist
          </Link>
        </DialogTrigger>
      </DecklistDialog>
    </VStack>
    <SettingsForm />
  </VStack>
);

/** Rendered by the docked BottomBar, which is the only place settings are
 * reachable from below the `md` breakpoint. */
export const MobileSettingsDrawer = () => (
  <DrawerRoot placement="end" size="xs">
    <DrawerTrigger asChild>
      <IconButton
        aria-label="Open settings"
        colorPalette="accent"
        size={{ base: "xs", md: "sm" }}
        display={{ base: "inline-flex", md: "none" }}
      >
        <LuSettings />
      </IconButton>
    </DrawerTrigger>
    <DrawerContent maxWidth="64">
      <DrawerHeader>Settings</DrawerHeader>
      <DrawerBody asChild>
        <SidebarContent />
      </DrawerBody>
      <DrawerCloseTrigger />
    </DrawerContent>
  </DrawerRoot>
);

export const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box
      as="aside"
      display={{ base: "none", md: "block" }}
      overflowY="auto"
      overflowX="hidden"
      tabIndex={-1}
      zIndex="2"
      boxShadow="sm"
      backgroundColor="bg.subtle"
    >
      <Collapsible.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        direction="right"
      >
        <Collapsible.Trigger asChild>
          <Button
            aria-label="Settings"
            variant="ghost"
            size="2xl"
            colorPalette="gray"
            minWidth="8"
            paddingX="0"
            paddingY="4"
            height="full"
            alignItems="flex-start"
            borderRadius="0"
          >
            <Tooltip content={open ? "Close settings" : "Open settings"}>
              <Collapsible.Indicator asChild>
                <Icon>
                  {open ? <LuPanelRightClose /> : <LuPanelRightOpen />}
                </Icon>
              </Collapsible.Indicator>
            </Tooltip>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box width="64" height="full">
            <SidebarContent />
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
