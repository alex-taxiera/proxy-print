'use client'
import type { Assign } from '@ark-ui/react'
import { Toast, toastAnatomy } from '@ark-ui/react/toast'
import type { HTMLStyledProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const toast = sva({
  className: "toast",
  slots: toastAnatomy.keys(),
  base: {
    root: {
      background: "bg.default",
      borderRadius: "l3",
      minWidth: "xs",
      height: "var(--height)",
      opacity: "var(--opacity)",
      overflowWrap: "anywhere",
      p: "4",
      display: "grid",
      gridTemplateAreas: `
        "progress title"
        "progress description"
        "progress action"
      `,
      columnGap: "4",
      position: "relative",
      scale: "var(--scale)",
      translate: "var(--x) var(--y) 0",
      willChange: "translate, opacity, scale",
      zIndex: "var(--z-index)",
      transitionDuration: "slow",
      transitionProperty: "translate, scale, opacity, height",
      transitionTimingFunction: "default",
      '&[data-type="info"], &[data-type="loading"]': {
        background: "bg.info",
      },
      '&[data-type="success"]': {
        background: "bg.success",
      },
      '&[data-type="warning"]': {
        background: "bg.warning",
      },
      '&[data-type="error"]': {
        background: "bg.error",
      },
    },
    title: {
      color: "fg.default",
      fontWeight: "semibold",
      textStyle: "sm",
      gridArea: "title",
      whiteSpace: "nowrap",
    },
    description: {
      color: "fg.muted",
      textStyle: "sm",
      gridArea: "description",
    },
    actionTrigger: {
      mt: "2",
      gridArea: "action",
    },
    closeTrigger: {
      position: "absolute",
      top: "1",
      right: "1",
    },
  },
});

const { withProvider, withContext } = createStyleContext(toast)

export const Root = withProvider<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Toast.RootProps>
>(Toast.Root, 'root')

export const ActionTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Toast.ActionTriggerProps>
>(Toast.ActionTrigger, 'actionTrigger')

export const CloseTrigger = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Toast.CloseTriggerProps>
>(Toast.CloseTrigger, 'closeTrigger')

export const Description = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Toast.DescriptionProps>
>(Toast.Description, 'description')

export const Title = withContext<HTMLDivElement, Assign<HTMLStyledProps<'div'>, Toast.TitleProps>>(
  Toast.Title,
  'title',
)

export {
  ToastContext as Context,
  Toaster,
  createToaster,
  type ToastContextProps as ContextProps,
  type ToasterProps,
} from '@ark-ui/react/toast'
