import { Box, Center, HStack } from "@chakra-ui/react";

import { CommunityBanner } from "./CommunityBanner";
import { SocialLinks } from "./SocialLinks";

export const Header = () => {
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
        as="h1"
        width="full"
        maxWidth="8xl"
        justifyContent="space-between"
        paddingY="1"
        paddingX={{ base: "2", sm: "4" }}
      >
        <Box as="span" fontSize={{ base: "sm", sm: "xl" }} fontWeight="bold">
          Print My Proxy
        </Box>
        <SocialLinks />
      </HStack>
      <CommunityBanner />
    </Center>
  );
};
