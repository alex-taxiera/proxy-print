import { css } from "styled-system/css";
import { center, hstack } from "styled-system/patterns";

import { Link } from "@/components/ui-old/link";

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
        <span
          className={hstack({
            gap: "2",
            fontSize: "2xl",
            fontWeight: "bold",
            alignItems: "flex-end",
            display: "inline-flex",
          })}
        >
          Proxy Print Setup
          <span
            className={hstack({
              gap: "0",
              display: "none",
              sm: { display: "inline-flex" },
              fontSize: "xs",
              lineHeight: "1.75rem",
              fontWeight: "normal",
              color: "fg.muted",
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
