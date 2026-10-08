import { IconButton, MenuSelectionDetails } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuContrast,
  LuEllipsis,
  LuExpand,
  LuGalleryVerticalEnd,
  LuImage,
  LuImageDown,
  LuPlus,
  LuShrink,
  LuSunDim,
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
  MenuTrigger,
  MenuTriggerItem,
} from "@/components/ui/menu";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import {
  getIsLocalImage,
  getIsScryfallImage,
  Image,
  ImagesContext,
} from "@/context/ImagesContext";
import { useHasCoarsePointer } from "@/hooks/useHasCoarsePointer";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import { getQueryKeyForImage, ImageQueryData } from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import { renderCardImage } from "@/utils/card-image";
import { createFileHash } from "@/utils/create-file-hash";
import { getKeybindLabels } from "@/utils/keybind-labels";
import { UpscaleMethod } from "@/utils/upscale-methods";

import { AddMoreDialog } from "./AddMoreDialog";
import { ChangePrintDialog } from "./ChangePrintDialog";
import { UpscaleMenuItems } from "./UpscaleMenuItems";

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
  const {
    images,
    onRemove,
    onReorder,
    onAddBack,
    onReplaceScryfallPrinting,
    onRemoveBack,
    isLoadingProject,
  } = useContext(ImagesContext);
  const keybindLabels = getKeybindLabels();
  const { imageMatrix, cardsPerPage } = usePreviewData();
  const hasCoarsePointer = useHasCoarsePointer();
  const settings = useSettingsStore((s) => s.settings);
  const backInputRef = useRef<HTMLInputElement>(null);

  const { upscaleImage } = useUpscaleImage();

  const isBackFace = face === "back";

  const absoluteIndex = images.findIndex((img) => img.uuid === image.uuid);

  const name = getIsLocalImage(image) ? image.file?.name : image.name;

  const [isAddMoreOpen, setIsAddMoreOpen] = useState(false);
  const [isChangePrintOpen, setIsChangePrintOpen] = useState(false);

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
  const canDarkenEdges = hasOriginalData ? !queryData.hasDarkenedEdges : false;
  const canRemoveEdgeDarkening = hasOriginalData
    ? Boolean(queryData.hasDarkenedEdges)
    : false;
  const canRevertToOriginal = hasOriginalData
    ? queryData.isUpscaled ||
      queryData.hasBleed ||
      Boolean(queryData.hasDarkenedEdges)
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
      const data = await renderCardImage(
        base,
        queryData.mimeType,
        Number(settings.cardWidth),
        Number(settings.cardHeight),
        { hasBleed: true, hasDarkenedEdges: queryData.hasDarkenedEdges },
      );
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({ ...queryData, data, hasBleed: true }),
      );
    }
  };

  const onRemoveBleedClick = async () => {
    if (queryData && "original" in queryData && queryData.hasBleed) {
      setProcessing(true);
      const base = queryData.upscaledOriginal ?? queryData.original;
      const data = await renderCardImage(
        base,
        queryData.mimeType,
        Number(settings.cardWidth),
        Number(settings.cardHeight),
        { hasBleed: false, hasDarkenedEdges: queryData.hasDarkenedEdges },
      );
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({ ...queryData, data, hasBleed: false }),
      );
    }
  };

  const onSetEdgeDarkeningClick = async (hasDarkenedEdges: boolean) => {
    if (
      queryData &&
      "original" in queryData &&
      Boolean(queryData.hasDarkenedEdges) !== hasDarkenedEdges
    ) {
      setProcessing(true);
      try {
        const base = queryData.upscaledOriginal ?? queryData.original;
        const data = await renderCardImage(
          base,
          queryData.mimeType,
          Number(settings.cardWidth),
          Number(settings.cardHeight),
          { hasBleed: queryData.hasBleed, hasDarkenedEdges },
        );
        queryClient.setQueryData<ImageQueryData>(
          getQueryKeyForImage(image),
          () => ({ ...queryData, data, hasDarkenedEdges }),
        );
      } catch (error) {
        setProcessing(false);
        console.error("Edge darkening failed for image", image.uuid, error);
      }
    }
  };

  const onUpscaleClick = async (method: UpscaleMethod) => {
    if (queryData && "original" in queryData && !queryData.isUpscaled) {
      setProcessing(true);
      const upscaledOriginal = await upscaleImage(queryData.original, method);
      const data = await renderCardImage(
        upscaledOriginal,
        queryData.mimeType,
        Number(settings.cardWidth),
        Number(settings.cardHeight),
        queryData,
      );
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({
          ...queryData,
          data,
          upscaledOriginal,
          isUpscaled: true,
          upscaleMethod: method,
        }),
      );
    }
  };

  const onRemoveUpscaleClick = async () => {
    if (queryData && "original" in queryData && queryData.isUpscaled) {
      setProcessing(true);
      const data = await renderCardImage(
        queryData.original,
        queryData.mimeType,
        Number(settings.cardWidth),
        Number(settings.cardHeight),
        queryData,
      );
      queryClient.setQueryData<ImageQueryData>(
        getQueryKeyForImage(image),
        () => ({
          ...queryData,
          data,
          upscaledOriginal: undefined,
          isUpscaled: false,
          upscaleMethod: undefined,
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
          upscaleMethod: undefined,
          hasBleed: false,
          hasDarkenedEdges: false,
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
      {/* Exactly one trigger, never both. A touch long-press is already
          dnd-kit's drag gesture, so touch opens the menu from a button
          instead — and zag skips its trackPositioning effect whenever a
          context trigger exists, so a button in the same menu would open
          unplaced, off screen. */}
      {hasCoarsePointer ? (
        <>
          {children}
          <MenuTrigger asChild>
            <IconButton
              aria-label={`Actions for ${name ?? "card"}`}
              variant="solid"
              colorPalette="gray"
              size="xs"
              position="absolute"
              bottom="2"
              right="2"
              zIndex="1"
              // Otherwise holding the button starts a card drag underneath it
              onPointerDown={(event) => event.preventDefault()}
            >
              <LuEllipsis />
            </IconButton>
          </MenuTrigger>
        </>
      ) : (
        <MenuContextTrigger cursor="grab" tabIndex={-1}>
          {children}
        </MenuContextTrigger>
      )}
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
            <UpscaleMenuItems
              onUpscale={(method) => void onUpscaleClick(method)}
              disabled={isLoadingProject}
            />
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
              onSelect={() => void onRemoveBleedClick()}
              disabled={isLoadingProject}
            >
              <LuShrink />
              <MenuItemText>Remove bleed</MenuItemText>
            </MenuItem>
          ) : null}
          {canDarkenEdges && !isBackFace ? (
            <MenuItem
              value="darken-edges"
              onSelect={() => void onSetEdgeDarkeningClick(true)}
              disabled={isLoadingProject}
            >
              <LuContrast />
              <MenuItemText>Darken edges</MenuItemText>
            </MenuItem>
          ) : null}
          {canRemoveEdgeDarkening && !isBackFace ? (
            <MenuItem
              value="remove-edge-darkening"
              onSelect={() => void onSetEdgeDarkeningClick(false)}
              disabled={isLoadingProject}
            >
              <LuSunDim />
              <MenuItemText>Remove edge darkening</MenuItemText>
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
          {getIsScryfallImage(image) && !isBackFace && slotId ? (
            <MenuItem
              value="change-print"
              onSelect={() => setIsChangePrintOpen(true)}
              disabled={isLoadingProject}
            >
              <LuGalleryVerticalEnd />
              <MenuItemText>Change print...</MenuItemText>
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
      {getIsScryfallImage(image) && slotId ? (
        <ChangePrintDialog
          cardName={image.name}
          currentUri={image.uri}
          open={isChangePrintOpen}
          onOpenChange={({ open }) => setIsChangePrintOpen(open)}
          onSelect={(printing) => onReplaceScryfallPrinting(slotId, printing)}
        />
      ) : null}
    </MenuRoot>
  );
};
