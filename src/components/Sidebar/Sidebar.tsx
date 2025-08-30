import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { css } from "styled-system/css";
import { vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { Collapsible } from "~/components/ui/collapsible";

import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";

export const Sidebar = () => {
  return (
    <Collapsible.Root
      defaultOpen
      direction="right"
      className={css({
        boxShadow: "sm",
        backgroundColor: "bg.subtle",
        zIndex: "2",
        gap: "1",
      })}
    >
      <Collapsible.Trigger asChild>
        <Button
          aria-label="Settings"
          variant="ghost"
          size="xs"
          colorPalette="gray"
          className={css({
            paddingX: "1",
            paddingY: "4",
            height: "full",
            alignItems: "flex-start",
            borderRadius: "0",
            _open: {
              "& svg": {
                transform: "rotate(180deg)",
              },
            },
          })}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className={css({
              transition: "transform 0.2s ease-in-out",
            })}
            size="lg"
          />
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <aside
          className={css({
            height: "full",
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: "12", // dont let edge go to bottom of page
            paddingLeft: "1",
          })}
          tabIndex={-1}
        >
          <div
            className={vstack({
              width: "64",
              gap: "4",
              paddingY: "2",
              paddingRight: "6",
              lg: {
                paddingY: "4",
                paddingRight: "8",
              },
            })}
          >
            <ImageUploader />
            <SettingsForm />
          </div>
        </aside>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
