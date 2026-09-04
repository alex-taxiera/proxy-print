import {
  ButtonGroup,
  IconButton,
  MenuSelectionDetails,
} from "@chakra-ui/react";
import { useContext, useId, useRef } from "react";
import {
  LuDownload,
  LuEllipsis,
  LuExpand,
  LuImage,
  LuImageDown,
  LuImageUpscale,
  LuMove,
  LuPlus,
  LuShrink,
  LuTrash,
  LuUndo,
} from "react-icons/lu";

import {
  ActionBarCloseTrigger,
  ActionBarContent,
  ActionBarRoot,
  ActionBarSelectionTrigger,
  ActionBarSeparator,
} from "@/components/ui/action-bar";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  MenuContent,
  MenuItem,
  MenuItemText,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";

import { AddMoreDialog } from "@/components/Preview/Card/AddMoreDialog";
import { DownloadDialog } from "@/components/Preview/Card/DownloadDialog";
import { useCardActions } from "@/components/Preview/Card/useCardActions";
import { useDownloadPrompt } from "@/components/Preview/Card/useDownloadPrompt";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { ImagesContext } from "@/context/ImagesContext";
import { PreviewContext } from "@/context/PreviewContext";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { createFileHash } from "@/utils/create-file-hash";

export const SelectionActionBar = () => {
  const { images, isRendering, isLoadingProject } = useContext(ImagesContext);
  const { selectedImageUuids, onSelectAllImages } = useContext(
    ImageSelectionContext,
  );
  const { currentPage } = useContext(PreviewContext);
  const { pages } = usePreviewData();
  const isLoadingImages = useDownloadProgressStore((s) => s.pending > 0);

  const addMoreTriggerId = useId();
  const moveTriggerId = useId();
  const moreActionsTriggerId = useId();
  const backInputRef = useRef<HTMLInputElement>(null);

  const selectedImages = images.filter((image) =>
    selectedImageUuids.includes(image.uuid),
  );

  const {
    remove,
    setBack,
    removeBacks,
    addMore,
    canAddBleed,
    canRemoveBleed,
    canRemoveUpscale,
    canUpscale,
    canRevertToOriginal,
    addBleed,
    removeBleed,
    upscale,
    removeUpscale,
    revertToOriginal,
    moveToPage,
    isDownloading,
    downloadImages,
    pairedBackCount,
  } = useCardActions({
    images: selectedImages,
    currentPage,
  });

  const onSetBackClick = () => {
    backInputRef.current?.click();
  };

  const onBackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const hash = await createFileHash(file);
    setBack({ file, hash });
    e.target.value = "";
  };

  const { isDialogOpen, setIsDialogOpen, requestDownload } = useDownloadPrompt(
    pairedBackCount,
    downloadImages,
  );

  const onMoveToPage = (details: MenuSelectionDetails) =>
    moveToPage(parseInt(details.value));

  return (
    <ActionBarRoot open={selectedImageUuids.length > 0}>
      {/* Anchored to the docked bar rather than the viewport so the two never
          stack on top of each other. */}
      <ActionBarContent
        portalled={false}
        positionerProps={{
          position: "absolute",
          bottom: "100%",
          paddingBottom: "3",
        }}
      >
        <ActionBarSelectionTrigger
          display={{ base: "none", sm: "inline-flex" }}
        >
          {selectedImageUuids.length} selected
        </ActionBarSelectionTrigger>
        <ActionBarSeparator display={{ base: "none", sm: "inline-flex" }} />
        <input
          ref={backInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.bmp,.webp"
          style={{ display: "none" }}
          onChange={(e) => void onBackFileChange(e)}
        />
        <ButtonGroup variant="outline" size={{ base: "xs", md: "md" }}>
          <Tooltip
            content={
              isRendering
                ? "Generating PDF..."
                : isLoadingProject
                  ? "Loading project..."
                  : "Remove"
            }
          >
            <IconButton
              aria-label="Remove"
              color="fg.error"
              onClick={() => remove()}
              disabled={isRendering || isLoadingProject}
            >
              <LuTrash />
            </IconButton>
          </Tooltip>
          <Tooltip
            content={
              isLoadingProject
                ? "Loading project..."
                : isLoadingImages
                  ? "Loading images..."
                  : isDownloading
                    ? "Downloading images..."
                    : "Download"
            }
          >
            <IconButton
              aria-label="Download"
              onClick={() => requestDownload()}
              disabled={isLoadingImages || isLoadingProject}
              loading={isDownloading}
            >
              <LuDownload />
            </IconButton>
          </Tooltip>
          <AddMoreDialog add={addMore} ids={{ trigger: addMoreTriggerId }}>
            <Tooltip content="Add more" ids={{ trigger: addMoreTriggerId }}>
              <DialogTrigger asChild>
                <IconButton aria-label="Add more" disabled={isLoadingProject}>
                  <LuPlus />
                </IconButton>
              </DialogTrigger>
            </Tooltip>
          </AddMoreDialog>
          {pages.length > 1 ? (
            <MenuRoot onSelect={onMoveToPage} ids={{ trigger: moveTriggerId }}>
              <Tooltip
                content="Move to page ..."
                ids={{ trigger: moveTriggerId }}
              >
                <MenuTrigger asChild>
                  <IconButton
                    aria-label="Move to page ..."
                    disabled={isLoadingProject}
                  >
                    <LuMove />
                  </IconButton>
                </MenuTrigger>
              </Tooltip>
              <MenuContent>
                {pages.map((_, index) => (
                  <MenuItem
                    key={index}
                    disabled={index + 1 === currentPage || isLoadingProject}
                    value={`${(index + 1).toString()}`}
                  >
                    Page {index + 1}
                  </MenuItem>
                ))}
              </MenuContent>
            </MenuRoot>
          ) : null}
          <MenuRoot ids={{ trigger: moreActionsTriggerId }}>
            <Tooltip
              content="More actions"
              ids={{ trigger: moreActionsTriggerId }}
            >
              <MenuTrigger asChild>
                <IconButton
                  aria-label="More actions"
                  disabled={isLoadingProject}
                >
                  <LuEllipsis />
                </IconButton>
              </MenuTrigger>
            </Tooltip>
            <MenuContent>
              <MenuItem
                value="set-back"
                onSelect={() => onSetBackClick()}
                disabled={isLoadingProject}
              >
                <LuImage />
                <MenuItemText>Set back…</MenuItemText>
              </MenuItem>
              {pairedBackCount > 0 ? (
                <MenuItem
                  value="remove-back"
                  onSelect={() => removeBacks()}
                  disabled={isLoadingProject}
                  color="fg.error"
                >
                  <LuTrash />
                  <MenuItemText>Remove back</MenuItemText>
                </MenuItem>
              ) : null}
              {canUpscale ? (
                <MenuItem
                  value="upscale"
                  onSelect={() => upscale()}
                  disabled={isLoadingProject}
                >
                  <LuImageUpscale />
                  <MenuItemText>Upscale</MenuItemText>
                </MenuItem>
              ) : null}
              {canRemoveUpscale ? (
                <MenuItem
                  value="remove-upscale"
                  onSelect={() => removeUpscale()}
                  disabled={isLoadingProject}
                >
                  <LuImageDown />
                  <MenuItemText>Remove Upscale</MenuItemText>
                </MenuItem>
              ) : null}
              {canAddBleed ? (
                <MenuItem
                  value="add-bleed"
                  onSelect={() => addBleed()}
                  disabled={isLoadingProject}
                >
                  <LuExpand />
                  <MenuItemText>Add bleed</MenuItemText>
                </MenuItem>
              ) : null}
              {canRemoveBleed ? (
                <MenuItem
                  value="remove-bleed"
                  onSelect={() => removeBleed()}
                  disabled={isLoadingProject}
                >
                  <LuShrink />
                  <MenuItemText>Remove bleed</MenuItemText>
                </MenuItem>
              ) : null}
              {canRevertToOriginal ? (
                <MenuItem
                  value="revert-to-original"
                  onSelect={() => revertToOriginal()}
                  disabled={isLoadingProject}
                >
                  <LuUndo />
                  <MenuItemText>Revert to original</MenuItemText>
                </MenuItem>
              ) : null}
            </MenuContent>
          </MenuRoot>
          <ActionBarCloseTrigger onClick={() => onSelectAllImages(false)} />
        </ButtonGroup>
        <DownloadDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          pairedBackCount={pairedBackCount}
          onConfirm={(includeBacks) => downloadImages({ includeBacks })}
        />
      </ActionBarContent>
    </ActionBarRoot>
  );
};
