import { forwardRef } from "react";

import {
  IconButton as StyledIconButton,
  type IconButtonProps as StyledIconButtonProps,
} from "./styled/button";

export interface IconButtonProps extends StyledIconButtonProps {
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const { disabled, ...rest } = props;

    return <StyledIconButton ref={ref} aria-disabled={disabled} {...rest} />;
  },
);

IconButton.displayName = "IconButton";
