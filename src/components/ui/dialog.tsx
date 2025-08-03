import { forwardRef } from "react";
import * as Styled from "./styled/dialog";
import { IconButton, type IconButtonProps } from "./icon-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

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
  )
);

CloseButton.displayName = "CloseButton";

export const Dialog = {
  ...Styled,
  CloseButton,
};
