import { ark } from '@ark-ui/react/factory'
import { cva } from 'styled-system/css'
import { styled } from 'styled-system/jsx'
import type { ComponentProps } from 'styled-system/types'

const spinner = cva({
  // className: 'spinner',
  base: {
    display: 'inline-block',
    borderWidth: '2px',
    borderColor: 'colorPalette.default',
    borderStyle: 'solid',
    borderRadius: 'full',
    width: 'var(--size)',
    height: 'var(--size)',
    animation: 'spin',
    animationDuration: 'slowest',
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      xs: { '--size': 'sizes.3' },
      sm: { '--size': 'sizes.4' },
      md: { '--size': 'sizes.6' },
      lg: { '--size': 'sizes.8' },
      xl: { '--size': 'sizes.12' },
    },
  },
})

export type SpinnerProps = ComponentProps<typeof Spinner>
export const Spinner = styled(ark.div, spinner)
