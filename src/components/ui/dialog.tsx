import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";

import { IconButton, type IconButtonProps } from "./icon-button";
import * as Styled from "./styled/dialog";

const CloseButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => (
    <Styled.CloseTrigger asChild>
      <IconButton
        ref={ref}
        position="absolute"
        right="2"
        top="2"
        size="xs"
        {...props}
      >
        <FontAwesomeIcon size="xl" icon={faXmark} />
      </IconButton>
    </Styled.CloseTrigger>
  ),
);

CloseButton.displayName = "CloseButton";

export type * as DialogType from "./styled/dialog";

export const Dialog = {
  ...Styled,
  CloseButton,
} as const;
