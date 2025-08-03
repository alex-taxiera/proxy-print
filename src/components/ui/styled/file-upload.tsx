'use client'
import type { Assign } from '@ark-ui/react'
import { FileUpload, fileUploadAnatomy } from '@ark-ui/react/file-upload'
import type { ComponentProps, HTMLStyledProps, RecipeVariantProps } from 'styled-system/types'
import { createStyleContext } from './utils/create-style-context'
import { sva } from 'styled-system/css'

const fileUpload = sva({
  className: 'fileUpload',
  slots: fileUploadAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4',
      width: '100%',
    },
    label: {
      fontWeight: 'medium',
      textStyle: 'sm',
      pointerEvents: 'none',
    },
    dropzone: {
      alignItems: 'center',
      background: 'bg.default',
      borderColor: 'border.default',
      borderRadius: 'l3',
      borderWidth: '1px',
      borderStyle: 'dashed',
      display: 'flex',
      flexDirection: 'column',
      gap: '3',
      justifyContent: 'center',
      px: '6',
      py: '4',
      _hover: {
        backgroundColor: 'bg.info',
      },
      _active: {
        backgroundColor: 'border.info',
      },
      '&[data-dragging="true"]': {
        backgroundColor: 'border.info',
      },
    },
    item: {
      animation: 'fadeIn 0.25s ease-out',
      background: 'bg.default',
      borderRadius: 'l3',
      borderWidth: '1px',
      columnGap: '3',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gridTemplateAreas: `
        "preview name delete"
        "preview size delete"
        `,
      p: '4',
    },
    itemGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3',
    },
    itemName: {
      color: 'fg.default',
      fontWeight: 'medium',
      gridArea: 'name',
      textStyle: 'sm',
    },
    itemSizeText: {
      color: 'fg.muted',
      gridArea: 'size',
      textStyle: 'sm',
    },
    itemDeleteTrigger: {
      alignSelf: 'flex-start',
      gridArea: 'delete',
    },
    itemPreview: {
      gridArea: 'preview',
    },
    itemPreviewImage: {
      aspectRatio: '1',
      height: '10',
      objectFit: 'scale-down',
      width: '10',
    },
  },
})

export type FileUploadVariants = RecipeVariantProps<typeof fileUpload>

const { withProvider, withContext } = createStyleContext(fileUpload)

export type RootProviderProps = ComponentProps<typeof RootProvider>
export const RootProvider = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, FileUpload.RootProviderBaseProps>, FileUploadVariants>
>(FileUpload.RootProvider, 'root')

export type RootProps = ComponentProps<typeof Root>
export const Root = withProvider<
  HTMLDivElement,
  Assign<Assign<HTMLStyledProps<'div'>, FileUpload.RootBaseProps>, FileUploadVariants>
>(FileUpload.Root, 'root')

export const Dropzone = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, FileUpload.DropzoneBaseProps>
>(FileUpload.Dropzone, 'dropzone')

export const ItemDeleteTrigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, FileUpload.ItemDeleteTriggerBaseProps>
>(FileUpload.ItemDeleteTrigger, 'itemDeleteTrigger')

export const ItemGroup = withContext<
  HTMLUListElement,
  Assign<HTMLStyledProps<'ul'>, FileUpload.ItemGroupBaseProps>
>(FileUpload.ItemGroup, 'itemGroup')

export const ItemName = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, FileUpload.ItemNameBaseProps>
>(FileUpload.ItemName, 'itemName')

export const ItemPreviewImage = withContext<
  HTMLImageElement,
  Assign<HTMLStyledProps<'img'>, FileUpload.ItemPreviewImageBaseProps>
>(FileUpload.ItemPreviewImage, 'itemPreviewImage')

export const ItemPreview = withContext<
  HTMLImageElement,
  Assign<HTMLStyledProps<'div'>, FileUpload.ItemPreviewBaseProps>
>(FileUpload.ItemPreview, 'itemPreview')

export const Item = withContext<
  HTMLLIElement,
  Assign<HTMLStyledProps<'li'>, FileUpload.ItemBaseProps>
>(FileUpload.Item, 'item')

export const ItemSizeText = withContext<
  HTMLDivElement,
  Assign<HTMLStyledProps<'div'>, FileUpload.ItemSizeTextBaseProps>
>(FileUpload.ItemSizeText, 'itemSizeText')

export const Label = withContext<
  HTMLLabelElement,
  Assign<HTMLStyledProps<'label'>, FileUpload.LabelBaseProps>
>(FileUpload.Label, 'label')

export const Trigger = withContext<
  HTMLButtonElement,
  Assign<HTMLStyledProps<'button'>, FileUpload.TriggerBaseProps>
>(FileUpload.Trigger, 'trigger')

export {
  FileUploadContext as Context,
  FileUploadHiddenInput as HiddenInput,
} from '@ark-ui/react/file-upload'
