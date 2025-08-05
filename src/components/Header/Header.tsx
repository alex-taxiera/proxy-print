import { css } from "styled-system/css";
import { center, hstack } from "styled-system/patterns";

import { Link } from "../ui/link";
import { CommunityBanner } from "./CommunityBanner";
import { SocialLinks } from "./SocialLinks";

export const Header = () => {
  return (
    <header
      className={center({
        flexDirection: "column",
        boxShadow: "sm",
        backgroundColor: "bg.emphasized",
        alignItems: "center",
        zIndex: "2",
      })}
    >
      <h1
        className={hstack({
          width: "full",
          maxWidth: "8xl",
          justifyContent: "space-between",
          paddingY: "1",
          paddingX: "4",
        })}
      >
        <span className={css({ fontSize: "2xl", fontWeight: "bold" })}>
          Proxy Print Setup
          <span
            className={css({
              display: "none",
              sm: { display: "inline" },
              fontSize: "xs",
              fontWeight: "normal",
              color: "fg.muted",
              marginLeft: "2",
            })}
          >
            by&nbsp;
            <Link
              asChild
              color="colorPalette.fg"
              className={css({
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
              })}
            >
              <a
                href="https://github.com/alex-taxiera"
                target="_blank"
                rel="noopener noreferrer"
              >
                Alex Taxiera
              </a>
            </Link>
          </span>
        </span>
        <SocialLinks />
      </h1>
      <CommunityBanner />
    </header>
  );
};
