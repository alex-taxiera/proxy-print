'use client'
import type { Assign } from '@ark-ui/react'
import { Checkbox, checkboxAnatomy } from '@ark-ui/react/checkbox'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const checkbox = sva({
  className: 'checkbox',
  slots: checkboxAnatomy.keys(),
  base: {
    root: {
      alignItems: 'center',
      display: 'flex',
    },
    label: {
      color: 'fg.default',
      fontWeight: 'medium',
    },
    control: {
      alignItems: 'center',
      borderColor: 'border.default',
      borderWidth: '1px',
      color: 'colorPalette.fg',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      transitionDuration: 'normal',
      transitionProperty: 'border-color, background',
      transitionTimingFunction: 'default',
      _hover: {
        background: 'bg.subtle',
      },
      _checked: {
        background: 'colorPalette.default',
        borderColor: 'colorPalette.default',
        _hover: {
          background: 'colorPalette.default',
        },
      },
      _indeterminate: {
        background: 'colorPalette.default',
        borderColor: 'colorPalette.default',
        _hover: {
          background: 'colorPalette.default',
        },
      },
      '&:has(+ :focus-visible)': {
        outlineOffset: '2px',
        outline: '2px solid',
        outlineColor: 'border.outline',
        _checked: {
          outlineColor: 'colorPalette.default',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        root: {
          gap: '2',
        },
        control: {
          width: '4',
          height: '4',
          borderRadius: 'l1',
          '& svg': {
            width: '3',
            height: '3',
          },
        },
        label: {
          textStyle: 'sm',
        },
      },
      md: {
        root: {
          gap: '3',
        },
        control: {
          width: '5',
          height: '5',
          borderRadius: 'l1',
          '& svg': {
            width: '3.5',
            height: '3.5',
          },
        },
        label: {
          textStyle: 'md',
        },
      },
      lg: {
        root: {
          gap: '4',
        },
        control: {
          width: '6',
          height: '6',
          borderRadius: 'l1',
          '& svg': {
            width: '4',
            height: '4',
          },
        },
        label: {
          textStyle: 'lg',
        },
      },
    },
  },
})

export type CheckboxVariants = RecipeVariantProps<typeof checkbox>

const { withProvider, withContext } = createStyleContext(checkbox)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withProvider<
  HTMLLabelElement,
  Assign<Assign<HTMLStyledProps<'label'>, Checkbox.RootProviderBaseProps>, CheckboxVariants>
>(Checkbox.RootProvider, 'root')

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider<
  HTMLLabelElement,
  Assign<Assign<HTMLStyledProps<'label'>, Checkbox.RootBaseProps>, CheckboxVariants>
>(Checkbox.Root, 'root')

export const Control = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Checkbox.ControlBaseProps>
>(Checkbox.Control, 'control')

export const Group = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Checkbox.GroupBaseProps>
>(Checkbox.Group, 'group')

export const Indicator = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Checkbox.IndicatorBaseProps>
>(Checkbox.Indicator, 'indicator')

export const Label = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, Checkbox.LabelBaseProps>
>(Checkbox.Label, 'label')

export {
  CheckboxContext as Context,
  CheckboxHiddenInput as HiddenInput,
} from '@ark-ui/react/checkbox'
