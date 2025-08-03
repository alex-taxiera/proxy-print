'use client'
import type { Assign } from '@ark-ui/react'
import { Field, fieldAnatomy } from '@ark-ui/react/field'
import { styled } from 'styled-system/jsx'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { cva, sva } from 'styled-system/css'

const field = sva({
  className: 'field',
  slots: fieldAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5',
    },
    label: {
      color: 'fg.default',
      fontWeight: 'medium',
      textStyle: 'sm',
      _disabled: {
        color: 'fg.disabled',
      },
    },
    helperText: {
      color: 'fg.muted',
      textStyle: 'sm',
      _disabled: {
        color: 'fg.disabled',
      },
    },
    errorText: {
      alignItems: 'center',
      color: 'fg.error',
      display: 'inline-flex',
      gap: '2',
      textStyle: 'sm',
      _disabled: {
        color: 'fg.disabled',
      },
    },
  },
})

export type FieldVariants = RecipeVariantProps<typeof field>

const input = cva({
  // className: 'input',
  base: {
    appearance: 'none',
    background: 'none',
    borderColor: 'border.default',
    borderRadius: 'l2',
    borderWidth: '1px',
    color: 'fg.default',
    outline: 0,
    position: 'relative',
    transitionDuration: 'normal',
    transitionProperty: 'box-shadow, border-color',
    transitionTimingFunction: 'default',
    width: 'full',
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    _focus: {
      borderColor: 'colorPalette.default',
      boxShadow: '0 0 0 1px var(--colors-color-palette-default)',
    },
    _invalid: {
      borderColor: 'fg.error',
      _focus: {
        borderColor: 'fg.error',
        boxShadow: '0 0 0 1px var(--colors-border-error)',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      '2xs': { px: '1.5', h: '7', minW: '7', fontSize: 'xs' },
      xs: { px: '2', h: '8', minW: '8', fontSize: 'xs' },
      sm: { px: '2.5', h: '9', minW: '9', fontSize: 'sm' },
      md: { px: '3', h: '10', minW: '10', fontSize: 'md' },
      lg: { px: '3.5', h: '11', minW: '11', fontSize: 'md' },
      xl: { px: '4', h: '12', minW: '12', fontSize: 'lg' },
      '2xl': { px: '4.5', h: '16', minW: '16', textStyle: '3xl' },
    },
  },
})

export type InputVariants = RecipeVariantProps<typeof input>

const textarea = cva({
  // className: 'textarea',
  base: {
    appearance: 'none',
    background: 'none',
    borderColor: 'border.default',
    borderRadius: 'l2',
    borderWidth: '1px',
    minWidth: 0,
    outline: 0,
    position: 'relative',
    transitionDuration: 'normal',
    transitionProperty: 'border-color, box-shadow',
    width: 'full',
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
    _focus: {
      borderColor: 'colorPalette.default',
      boxShadow: '0 0 0 1px var(--colors-color-palette-default)',
    },
    _invalid: {
      borderColor: 'fg.error',
      _focus: {
        borderColor: 'fg.error',
        boxShadow: '0 0 0 1px var(--colors-border-error)',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: { p: '2.5', fontSize: 'sm' },
      md: { p: '3', fontSize: 'md' },
      lg: { p: '3.5', fontSize: 'md' },
      xl: { p: '4', fontSize: 'md' },
    },
  },
})

export type TextareaVariants = RecipeVariantProps<typeof textarea>

const { withProvider, withContext } = createStyleContext(field)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, Field.RootProviderBaseProps>, FieldVariants>
>(Field.RootProvider, 'root')

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, Field.RootBaseProps>, FieldVariants>
>(Field.Root, 'root')

export const ErrorText = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, Field.ErrorTextBaseProps>
>(Field.ErrorText, 'errorText')

export const HelperText = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, Field.HelperTextBaseProps>
>(Field.HelperText, 'helperText')

export const Label = withContext<
  HTMLLabelElement,
  Assign<HTMLStyledProps<'label'>, Field.LabelBaseProps>
>(Field.Label, 'label')

export const Select = withContext<
  HTMLSelectElement,
  Assign<HTMLStyledProps<'select'>, Field.SelectBaseProps>
>(Field.Select, 'select')

export type InputProps = ComponentProps<typeof Input>
export const Input = styled(Field.Input, input)

export type TextareaProps = ComponentProps<typeof Textarea>
export const Textarea = styled(Field.Textarea, textarea)

export { FieldContext as Context } from '@ark-ui/react/field'
