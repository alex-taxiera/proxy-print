import { defineSlotRecipe } from "@pandacss/dev";
import { collapsibleAnatomy } from "@ark-ui/react/collapsible";

export const collapsible = defineSlotRecipe({
  className: 'collapsible',
  slots: collapsibleAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
    },
    content: {
      overflow: 'hidden',
      // width: 'full',
      // _open: {
      //   animation: 'collapse-in',
      // },
      // _closed: {
      //   animation: 'collapse-out',
      // },
    },
  },
  variants: {
    direction: {
      down: {
        root: {
          alignItems: 'flex-start',
          flexDirection: 'column',
          width: 'full',
        },
        content: {
          width: 'full',
          _open: {
            animation: 'collapse-in',
          },
          _closed: {
            animation: 'collapse-out',
          },
        }
      },
      right: {
        root: {
          alignItems: 'stretch',
          flexDirection: 'row',
          height: 'full',
        },
        content: {
          height: 'full',
          _open: {
            animation: 'collapse-in-right',
          },
          _closed: {
            animation: 'collapse-out-right',
          },
        }
      },
      left: {
        root: {
          flexDirection: 'row',
          height: 'full',
        },
        content: {
          height: 'full',
          _open: {
            animation: 'collapse-in-left',
          },
          _closed: {
            animation: 'collapse-out-left',
          },
        }
      }
    }
  },
  defaultVariants: {
    direction: 'down',
  },
})
