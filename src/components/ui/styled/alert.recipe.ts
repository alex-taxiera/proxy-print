import { defineSlotRecipe } from "@pandacss/dev";

export const alert = defineSlotRecipe({
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
