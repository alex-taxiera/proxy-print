import { menuAnatomy } from "@ark-ui/react/menu";
import { defineSlotRecipe } from "@pandacss/dev";

const itemStyle = {
  alignItems: "center",
  borderRadius: "l1",
  cursor: "pointer",
  display: "flex",
  gap: "2",
  fontWeight: "medium",
  textStyle: "sm",
  transitionDuration: "fast",
  transitionProperty: "background, color",
  transitionTimingFunction: "default",
  _hover: {
    background: "bg.muted",
  },
  _highlighted: {
    background: "bg.muted",
  },
  _disabled: {
    color: "fg.disabled",
    cursor: "not-allowed",
    _hover: {
      color: "fg.disabled",
      background: "none",
    },
  },
};

export const menu = defineSlotRecipe({
  className: "menu",
  slots: menuAnatomy.keys(),
  base: {
    itemGroupLabel: {
      fontWeight: "semibold",
      textStyle: "sm",
      color: "fg.muted",
    },
    content: {
      background: "bg.default",
      borderRadius: "l2",
      boxShadow: "lg",
      display: "flex",
      flexDirection: "column",
      outline: "none",
      width: "calc(100% + 2rem)",
      maxHeight: "95vh",
      overflowY: "auto",
      zIndex: "calc(var(--layer-index) + var(--z-index-popover))",
      _hidden: {
        display: "none",
      },
      _open: {
        animation: "fadeIn 0.25s ease-out",
      },
      _closed: {
        animation: "fadeOut 0.2s ease-out",
      },
    },
    itemGroup: {
      display: "flex",
      flexDirection: "column",
    },
    item: itemStyle,
    triggerItem: {
      ...itemStyle,
      "& :where(svg)": {
        color: "fg.muted",
      },
    },
    itemText: {
      flex: 1,
    },
    itemIndicator: {
      color: "fg.muted",
    },
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      xs: {
        itemGroup: {
          gap: "1",
        },
        itemGroupLabel: {
          py: "1.5",
          px: "1.5",
          mx: "1",
        },
        content: {
          py: "1",
          gap: "1",
        },
        item: {
          minH: "8",
          px: "1.5",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        optionItem: {
          minH: "8",
          px: "1.5",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        triggerItem: {
          minH: "8",
          px: "1.5",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
      },
      sm: {
        itemGroup: {
          gap: "1",
        },
        itemGroupLabel: {
          py: "2",
          px: "2",
          mx: "1",
        },
        content: {
          py: "1",
          gap: "1",
        },
        item: {
          minH: "9",
          px: "2",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        optionItem: {
          minH: "9",
          px: "2",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        triggerItem: {
          minH: "9",
          px: "2",
          mx: "1.5",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
      },
      md: {
        itemGroup: {
          gap: "1",
        },
        itemGroupLabel: {
          py: "2.5",
          px: "2.5",
          mx: "1",
        },
        content: {
          py: "1",
          gap: "1",
        },
        item: {
          minH: "10",
          px: "2.5",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        optionItem: {
          minH: "10",
          px: "2.5",
          mx: "1",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
        triggerItem: {
          minH: "10",
          px: "2.5",
          mx: "1.5",
          "& :where(svg)": {
            width: "4",
            height: "4",
          },
        },
      },
      lg: {
        itemGroup: {
          gap: "1",
        },
        itemGroupLabel: {
          py: "2.5",
          px: "2.5",
          mx: "1",
        },
        content: {
          py: "1",
          gap: "1",
        },
        item: {
          minH: "11",
          px: "2.5",
          mx: "1",
          "& :where(svg)": {
            width: "5",
            height: "5",
          },
        },
        optionItem: {
          minH: "11",
          px: "2.5",
          mx: "1",
          "& :where(svg)": {
            width: "5",
            height: "5",
          },
        },
        triggerItem: {
          minH: "11",
          px: "2.5",
          mx: "1.5",
          "& :where(svg)": {
            width: "5",
            height: "5",
          },
        },
      },
    },
  },
});
