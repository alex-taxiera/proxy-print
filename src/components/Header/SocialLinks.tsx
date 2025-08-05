import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "../ui/link";
import {
  faDiscord,
  faGithub,
  faPaypal,
} from "@fortawesome/free-brands-svg-icons";
import { hstack } from "styled-system/patterns";

export const SocialLinks = () => {
  return (
    <div className={hstack({ gap: "4", color: "fg.default" })}>
      <Link
        asChild
        color="inherit"
        aria-label="View the Proxy Print Setup GitHub repository"
      >
        <a
          href="https://github.com/alex-taxiera/proxy-print"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </Link>
      <Link
        asChild
        color="inherit"
        aria-label="Join the Proxy Community Discord"
      >
        <a
          href="https://discord.gg/A5AkkyP8CU"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faDiscord} />
        </a>
      </Link>
      <Link asChild color="inherit" aria-label="Donate via PayPal">
        <a
          href="https://www.paypal.me/alextaxiera"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faPaypal} />
        </a>
      </Link>
    </div>
  );
};
