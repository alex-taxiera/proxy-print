import type {
  BoxProps,
  InputElementProps,
  InputAddonProps,
} from "@chakra-ui/react";
import { Group, InputElement, InputAddon } from "@chakra-ui/react";
import * as React from "react";

export interface InputGroupProps extends BoxProps {
  startElementProps?: InputElementProps;
  endElementProps?: InputElementProps;
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  startAddonProps?: InputAddonProps;
  endAddonProps?: InputAddonProps;
  startAddon?: React.ReactNode;
  endAddon?: React.ReactNode;
  children: React.ReactElement<InputElementProps>;
  startOffset?: `var(--${string})` | (string & {});
  endOffset?: `var(--${string})` | (string & {});
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup(props, ref) {
    const {
      startElement,
      startElementProps,
      endElement,
      endElementProps,
      startAddon,
      startAddonProps,
      endAddon,
      endAddonProps,
      children,
      startOffset = "6px",
      endOffset = "6px",
      ...rest
    } = props;

    const child =
      React.Children.only<React.ReactElement<InputElementProps>>(children);

    return (
      <Group ref={ref} attached {...rest}>
        {startAddon && (
          <InputAddon {...startAddonProps}>{startAddon}</InputAddon>
        )}
        {startElement && (
          <InputElement pointerEvents="none" {...startElementProps}>
            {startElement}
          </InputElement>
        )}
        {React.cloneElement(child, {
          ...(startElement && {
            ps: `calc(var(--input-height) - ${startOffset})`,
          }),
          ...(endElement && { pe: `calc(var(--input-height) - ${endOffset})` }),
          ...children.props,
        })}
        {endElement && (
          <InputElement placement="end" {...endElementProps}>
            {endElement}
          </InputElement>
        )}
        {endAddon && <InputAddon {...endAddonProps}>{endAddon}</InputAddon>}
      </Group>
    );
  },
);
