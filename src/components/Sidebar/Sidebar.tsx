import { Box, Collapsible, Button, VStack } from "@chakra-ui/react";
import { LuChevronLeft } from "react-icons/lu";

import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";

export const Sidebar = () => {
  return (
    <Collapsible.Root
      defaultOpen
      direction="right"
      boxShadow="sm"
      backgroundColor="bg.subtle"
      zIndex="2"
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
          <Collapsible.Indicator
            transition="transform 0.2s"
            _open={{ transform: "rotate(180deg)" }}
          >
            <LuChevronLeft />
          </Collapsible.Indicator>
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box
          as="aside"
          height="full"
          overflowY="auto"
          overflowX="hidden"
          tabIndex={-1}
        >
          <VStack
            width="64"
            gap="4"
            paddingY={{ base: "2", lg: "4" }}
            paddingX={{ base: "2", lg: "4" }}
          >
            <ImageUploader />
            <SettingsForm />
          </VStack>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
