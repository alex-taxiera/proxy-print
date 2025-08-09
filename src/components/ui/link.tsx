import { forwardRef } from "react";

import {
  Link as StyledLink,
  type LinkProps as StyledLinkProps,
} from "./styled/button";

export const Link = forwardRef<HTMLButtonElement, StyledLinkProps>(
  (props, ref) => {
    const { disabled, ...rest } = props;
    return <StyledLink ref={ref} aria-disabled={disabled} {...rest} />;
  },
);

Link.displayName = "Link";
