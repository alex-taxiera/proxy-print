'use client'
import type { Assign } from '@ark-ui/react'
import { Tooltip, tooltipAnatomy } from '@ark-ui/react/tooltip'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const tooltip = sva({
  className: 'tooltip',
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      background: 'gray.a12',
      borderRadius: 'l2',
      boxShadow: 'sm',
      color: 'bg.default',
      fontWeight: 'semibold',
      px: '3',
      py: '2',
      textStyle: 'xs',
      maxWidth: '2xs',
      zIndex: 'tooltip',
      _open: {
        animation: 'fadeIn 0.25s ease-out',
      },
      _closed: {
        animation: 'fadeOut 0.2s ease-out',
      },
    },
  },
})

export type TooltipVariants = RecipeVariantProps<typeof tooltip>

const { withRootProvider, withContext } = createStyleContext(tooltip)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withRootProvider<
  Assign<Tooltip.RootProviderProps, TooltipVariants>
>(Tooltip.RootProvider)

export type RootProps = ComponentProps<typeof Root>
export const Root = withRootProvider<Assign<Tooltip.RootProps, TooltipVariants>>(Tooltip.Root)

export const Arrow = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Tooltip.ArrowBaseProps>
>(Tooltip.Arrow, 'arrow')

export const ArrowTip = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Tooltip.ArrowTipBaseProps>
>(Tooltip.ArrowTip, 'arrowTip')

export const Content = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Tooltip.ContentBaseProps>
>(Tooltip.Content, 'content')

export const Positioner = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Tooltip.PositionerBaseProps>
>(Tooltip.Positioner, 'positioner')

export const Trigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Tooltip.TriggerBaseProps>
>(Tooltip.Trigger, 'trigger')

export { TooltipContext as Context } from '@ark-ui/react/tooltip'
