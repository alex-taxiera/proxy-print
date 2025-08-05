import { css } from "styled-system/css";

import { Link } from "../ui/link";

export const CommunityBanner = () => {
  return (
    <div
      className={css({
        bg: "colorPalette.default",
        color: "colorPalette.fg",
        paddingY: "1",
        textAlign: "center",
        alignSelf: "stretch",
      })}
    >
      <Link asChild color="colorPalette.fg" fontSize="sm">
        <a
          href="https://discord.gg/A5AkkyP8CU"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join the Proxy Community Discord!
        </a>
      </Link>
    </div>
  );
};
