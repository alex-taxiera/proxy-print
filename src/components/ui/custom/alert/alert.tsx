import type { Assign, PolymorphicProps } from "@ark-ui/react";
import { ark } from "@ark-ui/react/factory";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";
import { OverrideProperties } from "type-fest";

import type { HTMLStyledProps } from "styled-system/types";

import { IconButton, IconButtonProps } from "../../icon-button";

export type RootProps = Assign<HTMLStyledProps<"div">, PolymorphicProps>;
export const Root = ark.div;

export type ContentProps = Assign<HTMLStyledProps<"div">, PolymorphicProps>;
export const Content = ark.div;

export type DescriptionProps = Assign<HTMLStyledProps<"div">, PolymorphicProps>;
export const Description = ark.div;

export type IconProps = Assign<HTMLStyledProps<"svg">, PolymorphicProps>;
export const Icon = ark.svg;

export type TitleProps = Assign<HTMLStyledProps<"h5">, PolymorphicProps>;
export const Title = ark.h5;

export type DismissButtonProps = OverrideProperties<
  IconButtonProps,
  { "aria-label"?: string }
>;
export const DismissButton = forwardRef<HTMLButtonElement, DismissButtonProps>(
  ({ "aria-label": ariaLabel = "Dismiss", ...props }, ref) => {
    return (
      <IconButton aria-label={ariaLabel} {...props} ref={ref} size="xs">
        <FontAwesomeIcon icon={faXmark} size="lg" />
      </IconButton>
    );
  },
);
DismissButton.displayName = "DismissButton";

export const Alert = {
  Root,
  Content,
  Description,
  Icon,
  Title,
  DismissButton,
};
