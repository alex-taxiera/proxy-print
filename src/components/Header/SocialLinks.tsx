import { ButtonGroup, IconButton, Button, Icon } from "@chakra-ui/react";
import { FaGithub, FaDiscord, FaPaypal } from "react-icons/fa";

export const SocialLinks = () => {
  return (
    <ButtonGroup
      color="fg"
      size={{ base: "2xs", sm: "xs" }}
      gap={{ base: "2", sm: "4" }}
      variant="ghost"
      colorPalette="accent"
    >
      <Button variant="outline" asChild>
        <a
          href="https://cardanvil.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create MTG cards!
        </a>
      </Button>
      <IconButton
        asChild
        aria-label="View the Proxy Print Setup GitHub repository"
      >
        <a
          href="https://github.com/alex-taxiera/proxy-print"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon size={{ base: "sm", sm: "md" }}>
            <FaGithub />
          </Icon>
        </a>
      </IconButton>
      <IconButton asChild aria-label="Join the Proxy Community Discord">
        <a
          href="https://discord.gg/A5AkkyP8CU"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon size={{ base: "sm", sm: "md" }}>
            <FaDiscord />
          </Icon>
        </a>
      </IconButton>
      <IconButton asChild aria-label="Donate via PayPal">
        <a
          href="https://www.paypal.me/alextaxiera"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon size={{ base: "sm", sm: "md" }}>
            <FaPaypal />
          </Icon>
        </a>
      </IconButton>
    </ButtonGroup>
  );
};
