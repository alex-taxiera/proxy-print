'use client'
import type { Assign } from '@ark-ui/react'
import { Progress, progressAnatomy } from '@ark-ui/react/progress'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const progress = sva({
  className: 'progress',
  slots: progressAnatomy.keys(),
  base: {
    root: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5',
      width: 'full',
    },
    label: {
      color: 'fg.default',
      fontWeight: 'medium',
      textStyle: 'sm',
    },
    track: {
      backgroundColor: 'bg.emphasized',
      borderRadius: 'l2',
      overflow: 'hidden',
      width: '100%',
    },
    range: {
      backgroundColor: 'colorPalette.default',
      height: '100%',
      transition: 'width 0.2s ease-in-out',
      '--translate-x': '-100%',
      background: 'linear-gradient(90deg, transparent 25%, rgba(255, 255, 255, 0.3) 50%, transparent 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite',
      '&[data-state="indeterminate"]': {
        backgroundColor: 'transparent',
      },
    },
    circleTrack: {
      stroke: 'bg.emphasized',
    },
    circleRange: {
      stroke: 'colorPalette.default',
      transitionProperty: 'stroke-dasharray, stroke',
      transitionDuration: '0.6s',
      '&[data-state="indeterminate"]': {
        animation: 'spin 1s linear infinite',
      },
    },
    valueText: {
      textStyle: 'sm',
    },
  },
  defaultVariants: {
    size: 'md',
  },
  variants: {
    size: {
      sm: {
        circle: {
          '--size': '36px',
          '--thickness': '4px',
        },
        track: {
          height: '1.5',
        },
      },
      md: {
        track: {
          height: '2',
        },
        circle: {
          '--size': '40px',
          '--thickness': '4px',
        },
      },
      lg: {
        track: {
          height: '2.5',
        },
        circle: {
          '--size': '44px',
          '--thickness': '4px',
        },
      },
    },
  },
})

export type ProgressVariants = RecipeVariantProps<typeof progress>

const { withProvider, withContext } = createStyleContext(progress)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, Progress.RootProviderBaseProps>, ProgressVariants>
>(Progress.RootProvider, 'root')

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, Progress.RootBaseProps>, ProgressVariants>
>(Progress.Root, 'root')

export const Circle = withContext<
  SVGSVGElement,
  Assign<HTMLStyledProps<'svg'>, Progress.CircleBaseProps>
>(Progress.Circle, 'circle')

export const CircleRange = withContext<
  SVGCircleElement,
  Assign<HTMLStyledProps<'circle'>, Progress.CircleRangeBaseProps>
>(Progress.CircleRange, 'circleRange')

export const CircleTrack = withContext<
  SVGCircleElement,
  Assign<HTMLStyledProps<'circle'>, Progress.CircleTrackBaseProps>
>(Progress.CircleTrack, 'circleTrack')

export const Label = withContext<
  HTMLLabelElement,
  Assign<HTMLStyledProps<'label'>, Progress.LabelBaseProps>
>(Progress.Label, 'label')

export const Range = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Progress.RangeBaseProps>
>(Progress.Range, 'range')

export const Track = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, Progress.TrackBaseProps>
>(Progress.Track, 'track')

export const ValueText = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, Progress.ValueTextBaseProps>
>(Progress.ValueText, 'valueText')

export const View = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, Progress.ViewBaseProps>
>(Progress.View, 'view')

export { ProgressContext as Context } from '@ark-ui/react/progress'
