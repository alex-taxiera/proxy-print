import type { Assign } from "@ark-ui/react";

import { alert, type AlertVariantProps } from "styled-system/recipes";
import type { ComponentProps } from "styled-system/types";

import { Alert } from "../custom/alert";
import { createStyleContext } from "./utils/create-style-context";

const { withProvider, withContext } = createStyleContext(alert);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider<
  HTMLDivElement,
  Assign<Alert.RootProps, AlertVariantProps>
>(Alert.Root, "root");

export const Content = withContext<HTMLDivElement, Alert.ContentProps>(
  Alert.Content,
  "content",
);

export const Description = withContext<HTMLDivElement, Alert.DescriptionProps>(
  Alert.Description,
  "description",
);

export const Icon = withContext<HTMLOrSVGElement, Alert.IconProps>(
  Alert.Icon,
  "icon",
);

export const Title = withContext<HTMLHeadingElement, Alert.TitleProps>(
  Alert.Title,
  "title",
);

export const DismissButton = withContext<
  HTMLButtonElement,
  Alert.DismissButtonProps
>(Alert.DismissButton, "dismissButton");
