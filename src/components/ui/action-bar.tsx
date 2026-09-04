import { ActionBar, Portal } from "@chakra-ui/react";
import * as React from "react";

import { CloseButton } from "./close-button";

interface ActionBarContentProps extends ActionBar.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement | null>;
  positionerProps?: ActionBar.PositionerProps;
}

export const ActionBarContent = React.forwardRef<
  HTMLDivElement,
  ActionBarContentProps
>(function ActionBarContent(props, ref) {
  const {
    children,
    portalled = true,
    portalRef,
    positionerProps,
    ...rest
  } = props;

  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ActionBar.Positioner zIndex="popover" {...positionerProps}>
        <ActionBar.Content ref={ref} {...rest} asChild={false}>
          {children}
        </ActionBar.Content>
      </ActionBar.Positioner>
    </Portal>
  );
});

export const ActionBarCloseTrigger = React.forwardRef<
  HTMLButtonElement,
  ActionBar.CloseTriggerProps
>(function ActionBarCloseTrigger(props, ref) {
  return (
    <ActionBar.CloseTrigger {...props} asChild ref={ref}>
      <CloseButton size={{ base: "2xs", md: "xs" }} />
    </ActionBar.CloseTrigger>
  );
});

export const ActionBarRoot = ActionBar.Root;
export const ActionBarSelectionTrigger = ActionBar.SelectionTrigger;
export const ActionBarSeparator = ActionBar.Separator;
