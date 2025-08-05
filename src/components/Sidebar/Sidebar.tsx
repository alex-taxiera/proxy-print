import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Collapsible } from "../ui/collapsible";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { css } from "styled-system/css";
import { vstack } from "styled-system/patterns";
import { ImageUploader } from "./ImageUploader";
import { SettingsForm } from "./SettingsForm";
import { useCollapsible } from "@ark-ui/react";
import { Button } from "../ui/button";

export const Sidebar = () => {
  const collapse = useCollapsible({ defaultOpen: true });
  return (
    <Collapsible.RootProvider
      direction="right"
      value={collapse}
      className={css({
        boxShadow: "sm",
        backgroundColor: "bg.subtle",
        zIndex: "2",
        gap: "1",
        // position: "relative",
      })}
    >
      <Collapsible.Trigger
        asChild
        className={css({
          // position: "absolute",
          // top: "3",
          // left: "-4",
          // transform: !collapse.open ? 'translateX(-50%)' : 'translateX(0)',
          // transition: 'transform 0.2s ease-in-out',
        })}
      >
        <Button
          aria-label="Settings"
          // variant={collapse.open ? 'solid' : 'ghost'}
          variant="ghost"
          size="xs"
          colorPalette="gray"
          className={css({
            paddingX: "1",
            paddingY: "4",
            height: "full",
            alignItems: "flex-start",
            borderRadius: "0",
          })}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className={css({
              transform: collapse.open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease-in-out",
            })}
            size="lg"
          />
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content zIndex="2" overflow="auto">
        <aside
          className={css({
            // backgroundColor: "bg.subtle",
            // boxShadow: "sm",
            minHeight: "100%",
            paddingBottom: "12", // dont let edge go to bottom of page
          })}
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
    </Collapsible.RootProvider>
  );
};
