import { Alert as ChakraAlert, useAlertStyles } from "@chakra-ui/react";
import * as React from "react";
import { LuInfo, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";

import { CloseButton } from "./close-button";

export type AlertStatus = "info" | "warning" | "success" | "error" | "neutral";

export interface AlertProps
  extends Omit<ChakraAlert.RootProps, "title" | "status"> {
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  title?: React.ReactNode;
  icon?: React.ReactElement;
  status?: AlertStatus; // remove conditional types to simplify usage
}

const STATUS_ICON_MAP = {
  info: <LuInfo />,
  neutral: <LuInfo />,
  success: <LuCircleCheck />,
  warning: <LuTriangleAlert />,
  error: <LuTriangleAlert />,
} as const;

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    const { title, children, icon, startElement, endElement, ...rest } = props;
    const statusIcon = STATUS_ICON_MAP[props.status || "info"];

    return (
      <ChakraAlert.Root ref={ref} {...rest}>
        {startElement || (
          <ChakraAlert.Indicator>{icon ?? statusIcon}</ChakraAlert.Indicator>
        )}
        {children ? (
          <ChakraAlert.Content>
            <ChakraAlert.Title>{title}</ChakraAlert.Title>
            <ChakraAlert.Description>{children}</ChakraAlert.Description>
          </ChakraAlert.Content>
        ) : (
          <ChakraAlert.Title flex="1">{title}</ChakraAlert.Title>
        )}
        {endElement}
      </ChakraAlert.Root>
    );
  },
);

export type AlertDismissButtonProps = React.ComponentProps<typeof CloseButton>;

export const AlertDismissButton = (props: AlertDismissButtonProps) => {
  const styles = useAlertStyles();

  return <CloseButton css={styles.dismissButton} {...props} />;
};
