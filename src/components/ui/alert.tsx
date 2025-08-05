import {
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { OverrideProperties } from "type-fest";
import * as Styled from "./styled/alert";
import { ComponentProps, forwardRef } from "react";
import { AlertProvider, useAlertContext } from "./alert-context";
import { AlertVariant, AlertVariantProps } from "styled-system/recipes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type RootProps = React.PropsWithChildren<
  OverrideProperties<AlertVariantProps, AlertVariant>
>;

const Root = forwardRef<HTMLDivElement, RootProps>(
  ({ children, ...props }, ref) => {
    return (
      <AlertProvider status={props.status}>
        <Styled.Root {...props} ref={ref}>
          {children}
        </Styled.Root>
      </AlertProvider>
    );
  },
);

Root.displayName = "Root";

const STATUS_ICON_MAP = {
  info: faInfoCircle,
  success: faCheckCircle,
  warning: faExclamationTriangle,
  error: faExclamationTriangle,
};

const StatusIcon = forwardRef<
  HTMLOrSVGElement,
  ComponentProps<typeof Styled.Icon>
>((props, ref) => {
  const { status } = useAlertContext();
  return (
    <Styled.Icon {...props} ref={ref}>
      <FontAwesomeIcon icon={STATUS_ICON_MAP[status]} />
    </Styled.Icon>
  );
});

StatusIcon.displayName = "StatusIcon";

export const Alert = {
  ...Styled,
  Root,
  StatusIcon,
};
