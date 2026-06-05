import { ark } from "@ark-ui/react/factory";

import { styled } from "styled-system/jsx";
import { button, type ButtonVariantProps } from "styled-system/recipes";
import type { ComponentProps } from "styled-system/types";

export type ButtonProps = ComponentProps<typeof Button>;
export const Button = styled(ark.button, button);

export type LinkProps = Omit<ComponentProps<typeof Link>, "variant">;
export const Link = styled(ark.button, button, {
  defaultProps: { size: "lg", variant: "link" } as ButtonVariantProps,
});

export type IconButtonProps = ComponentProps<typeof IconButton>;
export const IconButton = styled(ark.button, button, {
  defaultProps: { px: "0", variant: "ghost" } as ButtonVariantProps,
});
