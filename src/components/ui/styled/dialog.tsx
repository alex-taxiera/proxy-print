'use client'
import type { Assign } from '@ark-ui/react'
import { Dialog, dialogAnatomy } from '@ark-ui/react/dialog'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const dialog = sva({
  className: 'dialog',
  slots: dialogAnatomy.keys(),
  base: {
    backdrop: {
      backdropFilter: 'blur(4px)',
      background: {
        _light: 'white.a10',
        _dark: 'black.a10',
      },
      height: '100vh',
      left: '0',
      position: 'fixed',
      top: '0',
      width: '100vw',
      zIndex: 'overlay',
      _open: {
        animation: 'backdrop-in',
      },
      _closed: {
        animation: 'backdrop-out',
      },
    },
    positioner: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      left: '0',
      overflow: 'auto',
      position: 'fixed',
      top: '0',
      width: '100vw',
      height: '100dvh',
      zIndex: 'modal',
    },
    content: {
      background: 'bg.default',
      borderRadius: 'l3',
      boxShadow: 'lg',
      minW: 'sm',
      padding: '6',
      position: 'relative',
      _open: {
        animation: 'dialog-in',
      },
      _closed: {
        animation: 'dialog-out',
      },
    },
    title: {
      fontWeight: 'semibold',
      textStyle: 'lg',
    },
    description: {
      color: 'fg.muted',
      textStyle: 'sm',
    },
  },
})

export type DialogVariants = RecipeVariantProps<typeof dialog>

const { withRootProvider, withContext } = createStyleContext(dialog)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withRootProvider<Assign<Dialog.RootProviderProps, DialogVariants>>(
  Dialog.RootProvider,
)

export type RootProps = ComponentProps<typeof Root>
export const Root = withRootProvider<Assign<Dialog.RootProps, DialogVariants>>(Dialog.Root)

export const Backdrop = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Dialog.BackdropBaseProps>
>(Dialog.Backdrop, 'backdrop')

export const CloseTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Dialog.CloseTriggerBaseProps>
>(Dialog.CloseTrigger, 'closeTrigger')

export const Content = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Dialog.ContentBaseProps>
>(Dialog.Content, 'content')

export const Description = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Dialog.DescriptionBaseProps>
>(Dialog.Description, 'description')

export const Positioner = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Dialog.PositionerBaseProps>
>(Dialog.Positioner, 'positioner')

export const Title = withContext<
  HTMLHeadingElement,
  Assign<HTMLStyledProps<'h2'>, Dialog.TitleBaseProps>
>(Dialog.Title, 'title')

export const Trigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, Dialog.TriggerBaseProps>
>(Dialog.Trigger, 'trigger')

export { DialogContext as Context } from '@ark-ui/react/dialog'
