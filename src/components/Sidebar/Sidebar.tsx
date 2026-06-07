import { Box, Collapsible, Button, VStack } from "@chakra-ui/react";
import { LuChevronLeft } from "react-icons/lu";

import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";

export const Sidebar = () => {
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
      <Collapsible.Root defaultOpen direction="right">
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
            <Collapsible.Indicator
              transition="transform 0.2s"
              _open={{ transform: "rotate(180deg)" }}
            >
              <LuChevronLeft />
            </Collapsible.Indicator>
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
            <ImageUploader />
            <SettingsForm />
          </VStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
