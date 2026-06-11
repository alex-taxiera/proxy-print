import { MenuSelectionDetails } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuEllipsis,
  LuExpand,
  LuImage,
  LuImageDown,
  LuImageUpscale,
  LuPlus,
  LuShrink,
  LuTrash,
  LuUndo,
} from "react-icons/lu";

import {
  MenuContent,
  MenuContextTrigger,
  MenuItem,
  MenuItemCommand,
  MenuItemGroup,
  MenuItemText,
  MenuRoot,
  MenuTriggerItem,
} from "@/components/ui/menu";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { getIsLocalImage, Image, ImagesContext } from "@/context/ImagesContext";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import { getQueryKeyForImage, ImageQueryData } from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import { addBleedEdge } from "@/utils/add-bleed";
import { createFileHash } from "@/utils/create-file-hash";
import { getKeybindLabels } from "@/utils/keybind-labels";

import { AddMoreDialog } from "./AddMoreDialog";

export type CardContextMenuProps = React.PropsWithChildren<{
  image: Image;
  add: (count: number) => void;
  currentPage: number;
  index: number;
  queryData?: ImageQueryData;
  onSelectImageUuid: (uuid: string, selected: boolean) => void;
  slotId?: string | null;
  face?: "front" | "back";
}>;

export const CardContextMenu = ({
  image,
  add,
  currentPage,
  children,
  index,
  queryData,
  slotId = null,
  face = "front",
}: CardContextMenuProps) => {
  const queryClient = useQueryClient();
  const { onSelectImageUuid, getIsSelected } = useContext(
    ImageSelectionContext,
  );
  const isSelected = getIsSelected(image.uuid);
  const { images, onRemove, onReorder, onAddBack, onRemoveBack, isLoadingProject } =
    useContext(ImagesContext);
  const keybindLabels = getKeybindLabels();
  const { imageMatrix, cardsPerPage } = usePreviewData();
  const settings = useSettingsStore((s) => s.settings);
  const backInputRef = useRef<HTMLInputElement>(null);

  const { upscaleImage } = useUpscaleImage();

  const isBackFace = face === "back";

  const absoluteIndex = images.findIndex((img) => img.uuid === image.uuid);

  const name = getIsLocalImage(image) ? image.file?.name : image.name;

  const [isAddMoreOpen, setIsAddMoreOpen] = useState(false);

  const buildOnAddClick = (count: number) => () => {
    add(count);
  };

  const onRemoveClick = () => {
    onRemove(image.uuid);
  };

  const hasOriginalData = queryData && "original" in queryData;

  const canAddBleed = hasOriginalData ? !queryData.hasBleed : false;
  const canRemoveBleed = hasOriginalData ? queryData.hasBleed : false;
  const canUpscale = hasOriginalData ? !queryData.isUpscaled : false;
  const canRemoveUpscale = hasOriginalData ? queryData.isUpscaled : false;
  const canRevertToOriginal = hasOriginalData
    ? queryData.isUpscaled || queryData.hasBleed
    : false;

  const setProcessing = (processing: boolean) => {
    if (queryData && "original" in queryData) {
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({ ...queryData, isProcessing: processing }),
      );
    }
  };

  const onAddBleedClick = async () => {
    if (queryData && "original" in queryData && !queryData.hasBleed) {
      setProcessing(true);
      const base = queryData.upscaledOriginal ?? queryData.original;
      const data = await addBleedEdge(
        base,
        queryData.mimeType,
        Number(settings.cardWidth),
        Number(settings.cardHeight),
      );
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({ ...queryData, data, hasBleed: true }),
      );
    }
  };

  const onRemoveBleedClick = () => {
    if (queryData && "original" in queryData && queryData.hasBleed) {
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({
          ...queryData,
          data: queryData.upscaledOriginal ?? queryData.original,
          hasBleed: false,
        }),
      );
    }
  };

  const onUpscaleClick = async () => {
    if (queryData && "original" in queryData && !queryData.isUpscaled) {
      setProcessing(true);
      const upscaledOriginal = await upscaleImage(queryData.original);
      let data: Blob;
      if (queryData.hasBleed) {
        data = await addBleedEdge(
          upscaledOriginal,
          queryData.mimeType,
          Number(settings.cardWidth),
          Number(settings.cardHeight),
        );
      } else {
        data = upscaledOriginal;
      }
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({ ...queryData, data, upscaledOriginal, isUpscaled: true }),
      );
    }
  };

  const onRemoveUpscaleClick = async () => {
    if (queryData && "original" in queryData && queryData.isUpscaled) {
      setProcessing(true);
      let data: Blob;
      if (queryData.hasBleed) {
        data = await addBleedEdge(
          queryData.original,
          queryData.mimeType,
          Number(settings.cardWidth),
          Number(settings.cardHeight),
        );
      } else {
        data = queryData.original;
      }
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({
          ...queryData,
          data,
          upscaledOriginal: undefined,
          isUpscaled: false,
        }),
      );
    }
  };

  const onRevertToOriginalClick = () => {
    if (canRevertToOriginal && queryData && "original" in queryData) {
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({
          ...queryData,
          data: queryData.original,
          upscaledOriginal: undefined,
          isUpscaled: false,
          hasBleed: false,
        }),
      );
    }
  };

  const isOnLastPage = currentPage === imageMatrix.length;

  const isOnFirstPage = currentPage === 1;

  const onMoveToNextPage = () => {
    const newIndex = absoluteIndex + cardsPerPage - index;
    onReorder([image], newIndex);
  };

  const onMoveToPreviousPage = () => {
    const newIndex = absoluteIndex - index - 1;
    onReorder([image], newIndex);
  };

  const onMoveToPage = (details: MenuSelectionDetails) => {
    const page = parseInt(details.value);
    const newIndex =
      page > currentPage ? (page - 1) * cardsPerPage : page * cardsPerPage - 1;
    onReorder([image], newIndex);
  };

  const onSetBackClick = () => {
    backInputRef.current?.click();
  };

  const onBackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slotId) return;
    const hash = await createFileHash(file);
    onAddBack(slotId, { file, hash });
    e.target.value = "";
  };

  const onRemoveBackClick = () => {
    if (slotId) onRemoveBack(slotId);
  };

  const hasBack = isBackFace ? image.uuid.endsWith(":back") : false; // only meaningful when shown on back face

  return (
    <MenuRoot>
      <input
        ref={backInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.bmp,.webp"
        style={{ display: "none" }}
        onChange={(e) => void onBackFileChange(e)}
      />
      <MenuContextTrigger cursor="grab" tabIndex={-1}>
        {children}
      </MenuContextTrigger>
      <MenuContent
        onDragStart={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItemGroup
          title={name && name.length > 30 ? name.slice(0, 30) + "…" : name}
        >
          <MenuItem
            value="select"
            onSelect={() => onSelectImageUuid(image.uuid, !isSelected)}
          >
            <LuCheck />
            <MenuItemText>{isSelected ? "Deselect" : "Select"}</MenuItemText>
            <MenuItemCommand>Click</MenuItemCommand>
          </MenuItem>
          {!isBackFace && (
            <MenuItem
              value="remove"
              color="fg.error"
              onSelect={onRemoveClick}
              disabled={isLoadingProject}
            >
              <LuTrash />
              <MenuItemText>Remove</MenuItemText>
              <MenuItemCommand>{keybindLabels.alt} + Click</MenuItemCommand>
            </MenuItem>
          )}
          {canUpscale && !isBackFace ? (
            <MenuItem
              value="upscale"
              onSelect={() => void onUpscaleClick()}
              disabled={isLoadingProject}
            >
              <LuImageUpscale />
              <MenuItemText>Upscale</MenuItemText>
            </MenuItem>
          ) : null}
          {canRemoveUpscale && !isBackFace ? (
            <MenuItem
              value="remove-upscale"
              onSelect={() => void onRemoveUpscaleClick()}
              disabled={isLoadingProject}
            >
              <LuImageDown />
              <MenuItemText>Remove upscale</MenuItemText>
            </MenuItem>
          ) : null}
          {canAddBleed && !isBackFace ? (
            <MenuItem
              value="add-bleed"
              onSelect={() => void onAddBleedClick()}
              disabled={isLoadingProject}
            >
              <LuExpand />
              <MenuItemText>Add bleed</MenuItemText>
            </MenuItem>
          ) : null}
          {canRemoveBleed && !isBackFace ? (
            <MenuItem
              value="remove-bleed"
              onSelect={onRemoveBleedClick}
              disabled={isLoadingProject}
            >
              <LuShrink />
              <MenuItemText>Remove bleed</MenuItemText>
            </MenuItem>
          ) : null}
          {canRevertToOriginal && !isBackFace ? (
            <MenuItem
              value="revert-to-original"
              onSelect={onRevertToOriginalClick}
              disabled={isLoadingProject}
            >
              <LuUndo />
              <MenuItemText>Revert to original</MenuItemText>
            </MenuItem>
          ) : null}
        </MenuItemGroup>
        {/* Back management — available for all faces when slotId is known */}
        {slotId ? (
          <>
            <MenuItem
              value="set-back"
              onSelect={onSetBackClick}
              disabled={isLoadingProject}
            >
              <LuImage />
              <MenuItemText>Set back…</MenuItemText>
            </MenuItem>
            {hasBack || isBackFace ? (
              <MenuItem
                value="remove-back"
                color="fg.error"
                onSelect={onRemoveBackClick}
                disabled={isLoadingProject}
              >
                <LuTrash />
                <MenuItemText>Remove back</MenuItemText>
              </MenuItem>
            ) : null}
          </>
        ) : null}
        {!isBackFace ? (
          <>
            <MenuItem
              onSelect={buildOnAddClick(1)}
              value="add-1"
              disabled={isLoadingProject}
            >
              <LuPlus />
              <MenuItemText>Add 1</MenuItemText>
              <MenuItemCommand>{keybindLabels.ctrl} + Click</MenuItemCommand>
            </MenuItem>
            <MenuItem
              onSelect={buildOnAddClick(3)}
              value="add-3"
              disabled={isLoadingProject}
            >
              <LuPlus />
              <MenuItemText>Add 3</MenuItemText>
            </MenuItem>
            <MenuItem
              onSelect={() => {
                setIsAddMoreOpen(true);
              }}
              value="add-more"
              disabled={isLoadingProject}
            >
              <LuPlus />
              <MenuItemText>Add more...</MenuItemText>
            </MenuItem>
            {!isOnLastPage ? (
              <MenuItem
                onSelect={onMoveToNextPage}
                value="move-to-next-page"
                disabled={isLoadingProject}
              >
                <LuArrowRight />
                <MenuItemText>Move to next page</MenuItemText>
              </MenuItem>
            ) : null}
            {!isOnFirstPage ? (
              <MenuItem
                onSelect={onMoveToPreviousPage}
                value="move-to-previous-page"
                disabled={isLoadingProject}
              >
                <LuArrowLeft />
                <MenuItemText>Move to previous page</MenuItemText>
              </MenuItem>
            ) : null}
            {imageMatrix.length > 1 ? (
              <MenuRoot
                onSelect={onMoveToPage}
                positioning={{ gutter: 10, placement: "right-start" }}
              >
                <MenuTriggerItem
                  value="move-to-page"
                  startIcon={<LuEllipsis />}
                  disabled={isLoadingProject}
                >
                  <MenuItemText>Move to Page …</MenuItemText>
                </MenuTriggerItem>
                <MenuContent>
                  {imageMatrix.map((_, idx) => (
                    <MenuItem
                      key={idx}
                      disabled={idx + 1 === currentPage || isLoadingProject}
                      value={(idx + 1).toString()}
                    >
                      Page {idx + 1}
                    </MenuItem>
                  ))}
                </MenuContent>
              </MenuRoot>
            ) : null}
          </>
        ) : null}
      </MenuContent>
      <AddMoreDialog
        add={add}
        open={isAddMoreOpen}
        onOpenChange={({ open }) => setIsAddMoreOpen(open)}
      />
    </MenuRoot>
  );
};
