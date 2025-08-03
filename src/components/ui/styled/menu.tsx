'use client'
import type { Assign } from '@ark-ui/react'
import { Menu, menuAnatomy } from '@ark-ui/react/menu'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const itemStyle = {
  alignItems: 'center',
  borderRadius: 'l1',
  cursor: 'pointer',
  display: 'flex',
  fontWeight: 'medium',
  textStyle: 'sm',
  transitionDuration: 'fast',
  transitionProperty: 'background, color',
  transitionTimingFunction: 'default',
  _hover: {
    background: 'bg.muted',
    '& :where(svg)': {
      color: 'fg.default',
    },
  },
  _highlighted: {
    background: 'bg.muted',
  },
  '& :where(svg)': {
    color: 'fg.muted',
  },
  _disabled: {
    color: 'fg.disabled',
    cursor: 'not-allowed',
    _hover: {
      color: 'fg.disabled',
      background: 'none',
    },
  },
}

const menu = sva({
  className: 'menu',
  slots: menuAnatomy.keys(),
  base: {
    itemGroupLabel: {
      fontWeight: 'semibold',
      textStyle: 'sm',
    },
    content: {
      background: 'bg.default',
      borderRadius: 'l2',
      boxShadow: 'lg',
      display: 'flex',
      flexDirection: 'column',
      outline: 'none',
      width: 'calc(100% + 2rem)',
      zIndex: 'var(--layer-index)',
      _hidden: {
        display: 'none',
      },
      _open: {
        animation: 'fadeIn 0.25s ease-out',
      },
      _closed: {
        animation: 'fadeOut 0.2s ease-out',
      },
    },
    itemGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    positioner: {
      zIndex: 'var(--layer-index)',
    },
    item: itemStyle,
    triggerItem: itemStyle,
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: {
        itemGroup: {
          gap: '1',
        },
        itemGroupLabel: {
          py: '1.5',
          px: '1.5',
          mx: '1',
        },
        content: {
          py: '1',
          gap: '1',
        },
        item: {
          h: '8',
          px: '1.5',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        optionItem: {
          h: '8',
          px: '1.5',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        triggerItem: {
          h: '8',
          px: '1.5',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
      },
      sm: {
        itemGroup: {
          gap: '1',
        },
        itemGroupLabel: {
          py: '2',
          px: '2',
          mx: '1',
        },
        content: {
          py: '1',
          gap: '1',
        },
        item: {
          h: '9',
          px: '2',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        optionItem: {
          h: '9',
          px: '2',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        triggerItem: {
          h: '9',
          px: '2',
          mx: '1.5',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
      },
      md: {
        itemGroup: {
          gap: '1',
        },
        itemGroupLabel: {
          py: '2.5',
          px: '2.5',
          mx: '1',
        },
        content: {
          py: '1',
          gap: '1',
        },
        item: {
          h: '10',
          px: '2.5',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        optionItem: {
          h: '10',
          px: '2.5',
          mx: '1',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
        triggerItem: {
          h: '10',
          px: '2.5',
          mx: '1.5',
          '& :where(svg)': {
            width: '4',
            height: '4',
          },
        },
      },
      lg: {
        itemGroup: {
          gap: '1',
        },
        itemGroupLabel: {
          py: '2.5',
          px: '2.5',
          mx: '1',
        },
        content: {
          py: '1',
          gap: '1',
        },
        item: {
          h: '11',
          px: '2.5',
          mx: '1',
          '& :where(svg)': {
            width: '5',
            height: '5',
          },
        },
        optionItem: {
          h: '11',
          px: '2.5',
          mx: '1',
          '& :where(svg)': {
            width: '5',
            height: '5',
          },
        },
        triggerItem: {
          h: '11',
          px: '2.5',
          mx: '1.5',
          '& :where(svg)': {
            width: '5',
            height: '5',
          },
        },
      },
    },
  },
})

export type MenuVariants = RecipeVariantProps<typeof menu>

const { withRootProvider, withContext } = createStyleContext(menu)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withRootProvider<Assign<Menu.RootProviderProps, MenuVariants>>(
  Menu.RootProvider,
)

export type RootProps = ComponentProps<typeof Root>
export const Root = withRootProvider<Assign<Menu.RootProps, MenuVariants>>(Menu.Root)

export const Arrow = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ArrowBaseProps>
>(Menu.Arrow, 'arrow')

export const ArrowTip = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ArrowTipBaseProps>
>(Menu.ArrowTip, 'arrowTip')

export const CheckboxItem = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.CheckboxItemBaseProps>
>(Menu.CheckboxItem, 'item')

export const Content = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ContentBaseProps>
>(Menu.Content, 'content')

export const ContextTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Menu.ContextTriggerBaseProps>
>(Menu.ContextTrigger, 'contextTrigger')

export const Indicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.IndicatorBaseProps>
>(Menu.Indicator, 'indicator')

export const ItemGroupLabel = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ItemGroupLabelBaseProps>
>(Menu.ItemGroupLabel, 'itemGroupLabel')

export const ItemGroup = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ItemGroupBaseProps>
>(Menu.ItemGroup, 'itemGroup')

export const ItemIndicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ItemIndicatorBaseProps>
>(Menu.ItemIndicator, 'itemIndicator')

export const Item = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Menu.ItemBaseProps>>(
  Menu.Item,
  'item',
)

export const ItemText = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.ItemTextBaseProps>
>(Menu.ItemText, 'itemText')

export const Positioner = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.PositionerBaseProps>
>(Menu.Positioner, 'positioner')

export const RadioItemGroup = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.RadioItemGroupBaseProps>
>(Menu.RadioItemGroup, 'itemGroup')

export const RadioItem = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.RadioItemBaseProps>
>(Menu.RadioItem, 'item')

export const Separator = withContext<
  HTMLHRElement,
  Assign<HTMLStyledProps<'hr'>, Menu.SeparatorBaseProps>
>(Menu.Separator, 'separator')

export const TriggerItem = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Menu.TriggerItemBaseProps>
>(Menu.TriggerItem, 'triggerItem')

export const Trigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Menu.TriggerBaseProps>
>(Menu.Trigger, 'trigger')

export { MenuContext as Context } from '@ark-ui/react/menu'
