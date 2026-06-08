import { Fieldset as ChakraFieldset, Stack } from "@chakra-ui/react";
import * as React from "react";

export interface FieldsetProps extends Omit<
  ChakraFieldset.RootProps,
  "legend"
> {
  legend?: React.ReactNode;
  helperText?: React.ReactNode;
}

export const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset(props, ref) {
    const { legend, children, helperText, ...rest } = props;
    return (
      <ChakraFieldset.Root ref={ref} {...rest}>
        <Stack>
          {legend && <ChakraFieldset.Legend>{legend}</ChakraFieldset.Legend>}
          {helperText && (
            <ChakraFieldset.HelperText>{helperText}</ChakraFieldset.HelperText>
          )}
        </Stack>
        <ChakraFieldset.Content>{children}</ChakraFieldset.Content>
      </ChakraFieldset.Root>
    );
  },
);
