import { forwardRef } from "react";
import * as StyledCheckbox from "./styled/checkbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";

export type CheckboxProps = StyledCheckbox.RootProps;

export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  (props, ref) => {
    const { children, ...rootProps } = props;

    return (
      <StyledCheckbox.Root ref={ref} {...rootProps}>
        <StyledCheckbox.Control>
          <StyledCheckbox.Indicator>
            <FontAwesomeIcon icon={faCheck} size="xs" />
          </StyledCheckbox.Indicator>
          <StyledCheckbox.Indicator indeterminate>
            <FontAwesomeIcon icon={faMinus} size="xs" />
          </StyledCheckbox.Indicator>
        </StyledCheckbox.Control>
        {children && <StyledCheckbox.Label>{children}</StyledCheckbox.Label>}
        <StyledCheckbox.HiddenInput />
      </StyledCheckbox.Root>
    );
  },
);

Checkbox.displayName = "Checkbox";
