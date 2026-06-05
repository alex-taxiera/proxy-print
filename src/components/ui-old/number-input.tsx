import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";

import * as StyledNumberInput from "./styled/number-input";

export type NumberInputProps = StyledNumberInput.RootProps;

export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(
  (props, ref) => {
    const { children, ...rootProps } = props;
    return (
      <StyledNumberInput.Root ref={ref} {...rootProps}>
        {children && (
          <StyledNumberInput.Label>{children}</StyledNumberInput.Label>
        )}
        <StyledNumberInput.Control>
          <StyledNumberInput.Input />
          <StyledNumberInput.IncrementTrigger>
            <FontAwesomeIcon icon={faChevronUp} />
          </StyledNumberInput.IncrementTrigger>
          <StyledNumberInput.DecrementTrigger>
            <FontAwesomeIcon icon={faChevronDown} />
          </StyledNumberInput.DecrementTrigger>
        </StyledNumberInput.Control>
      </StyledNumberInput.Root>
    );
  },
);

NumberInput.displayName = "NumberInput";
