import type { Assign } from "@ark-ui/react";
import type { ComponentProps, RecipeVariantProps } from "styled-system/types";
import { createStyleContext } from "./utils/create-style-context";
import { Alert } from "../custom/alert";
import { sva } from "styled-system/css";

const alert = sva({
  className: "alert",
  slots: ["root", "content", "description", "icon", "title", "dismissButton"],
  base: {
    root: {
      borderWidth: "1px",
      borderRadius: "l3",
      display: "flex",
      gap: "3",
      p: "4",
      width: "full",
    },
    content: {
      display: "flex",
      flexDirection: "column",
      gap: "1",
    },
    description: {
      textStyle: "sm",
    },
    icon: {
      flexShrink: "0",
      width: "5!",
      height: "5!",
    },
    title: {
      fontWeight: "semibold",
      textStyle: "sm",
    },
    dismissButton: {
      position: "absolute",
      top: "3",
      right: "3",
      zIndex: "1",
      color: "fg.muted",
    },
  },
  variants: {
    status: {
      info: {
        root: {
          background: "bg.info",
          borderColor: "border.info",
        },
        icon: {
          color: "fg.info",
        },
        title: {
          color: "fg.default",
        },
        description: {
          color: "fg.muted",
        },
      },
      success: {
        root: {
          background: "bg.success",
          borderColor: "border.success",
        },
        icon: {
          color: "fg.success",
        },
        title: {
          color: "fg.default",
        },
        description: {
          color: "fg.muted",
        },
      },
      warning: {
        root: {
          background: "bg.warning",
          borderColor: "border.warning",
        },
        icon: {
          color: "fg.warning",
        },
        title: {
          color: "fg.default",
        },
        description: {
          color: "fg.muted",
        },
      },
      error: {
        root: {
          background: "bg.error",
          borderColor: "border.error",
        },
        icon: {
          color: "fg.error",
        },
        title: {
          color: "fg.default",
        },
        description: {
          color: "fg.muted",
        },
      },
    },
  },
  defaultVariants: {
    status: "info",
  },
});

export type AlertVariants = RecipeVariantProps<typeof alert>;

const { withProvider, withContext } = createStyleContext(alert);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider<
  HTMLDivElement,
  Assign<Alert.RootProps, AlertVariants>
>(Alert.Root, "root");

export const Content = withContext<HTMLDivElement, Alert.ContentProps>(
  Alert.Content,
  "content"
);

export const Description = withContext<HTMLDivElement, Alert.DescriptionProps>(
  Alert.Description,
  "description"
);

export const Icon = withContext<HTMLOrSVGElement, Alert.IconProps>(
  Alert.Icon,
  "icon"
);

export const Title = withContext<HTMLHeadingElement, Alert.TitleProps>(
  Alert.Title,
  "title"
);

export const DismissButton = withContext<
  HTMLButtonElement,
  Alert.DismissButtonProps
>(Alert.DismissButton, "dismissButton");
