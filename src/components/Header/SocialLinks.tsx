import { ButtonGroup, IconButton } from "@chakra-ui/react";
import { FaGithub, FaDiscord, FaPaypal } from "react-icons/fa";

export const SocialLinks = () => {
  return (
    <ButtonGroup gap="0" color="fg" variant="ghost">
      <IconButton
        asChild
        aria-label="View the Proxy Print Setup GitHub repository"
      >
        <a
          href="https://github.com/alex-taxiera/proxy-print"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub />
        </a>
      </IconButton>
      <IconButton
        asChild
        color="inherit"
        aria-label="Join the Proxy Community Discord"
      >
        <a
          href="https://discord.gg/A5AkkyP8CU"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDiscord />
        </a>
      </IconButton>
      <IconButton asChild color="inherit" aria-label="Donate via PayPal">
        <a
          href="https://www.paypal.me/alextaxiera"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaPaypal />
        </a>
      </IconButton>
    </ButtonGroup>
  );
};
