import { Box, Link } from "@chakra-ui/react";

export const CommunityBanner = () => {
  return (
    <Box bg="accent.solid" paddingY="1" textAlign="center" alignSelf="stretch">
      <Link
        fontSize="sm"
        color="white"
        href="https://discord.gg/A5AkkyP8CU"
        target="_blank"
        rel="noopener noreferrer"
      >
        Join the Proxy Community Discord!
      </Link>
    </Box>
  );
};
