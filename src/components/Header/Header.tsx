import { Link, Center, HStack } from "@chakra-ui/react";

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
        paddingX="4"
      >
        <HStack
          as="span"
          gap="2"
          fontSize="2xl"
          fontWeight="bold"
          alignItems="flex-end"
          display="inline-flex"
        >
          Proxy Print Setup
          <HStack
            as="span"
            gap="0"
            display={{ base: "none", sm: "inline-flex" }}
            fontSize="xs"
            lineHeight="1.75rem"
            fontWeight="normal"
            color="fg.muted"
          >
            by&nbsp;
            <Link
              fontSize="inherit"
              fontWeight="inherit"
              color="inherit"
              href="https://github.com/alex-taxiera"
              target="_blank"
              rel="noopener noreferrer"
            >
              Alex Taxiera
            </Link>
          </HStack>
        </HStack>
        <SocialLinks />
      </HStack>
      <CommunityBanner />
    </Center>
  );
};
