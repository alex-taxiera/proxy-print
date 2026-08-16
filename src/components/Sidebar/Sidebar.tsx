import { Icon, Box, Collapsible, Button, VStack, Link } from "@chakra-ui/react";
import { useState } from "react";
import { LuPanelRightClose, LuPanelRightOpen } from "react-icons/lu";

import { DialogTrigger } from "@/components/ui/dialog";

import { DecklistDialog } from "../DecklistDialog";
import { Tooltip } from "../ui/tooltip";
import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  return (
    <Box
      as="aside"
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
          <VStack
            height="full"
            width="64"
            gap="4"
            paddingY={{ base: "2", lg: "4" }}
            paddingX={{ base: "2", lg: "4" }}
            overflowY="auto"
            overflowX="hidden"
            tabIndex={-1}
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
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
