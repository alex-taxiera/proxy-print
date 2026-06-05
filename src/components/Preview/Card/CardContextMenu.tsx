import { MenuSelectionDetails, Portal } from "@ark-ui/react";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCompress,
  faEllipsisV,
  faExpand,
  faImagePortrait,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPlus,
  faTrash,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useRef } from "react";

import { Kbd } from "@/components/ui-old/kbd";
import { Menu } from "@/components/ui-old/menu";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { getIsLocalImage, Image, ImagesContext } from "@/context/ImagesContext";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useUpscaleImage } from "@/hooks/useUpscaleImage";
import { getQueryKeyForImage, ImageQueryData } from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import { addBleedEdge } from "@/utils/add-bleed";
import { createFileHash } from "@/utils/create-file-hash";
import { getKeybindLabels } from "@/utils/keybind-labels";

import { SelectionMenuContent } from "../Actions";

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
  const { onSelectImageUuid, getIsSelected, selectedImageUuids } = useContext(
    ImageSelectionContext,
  );
  const isSelected = getIsSelected(image.uuid);
  const { images, onRemove, onReorder, onAddBack, onRemoveBack } =
    useContext(ImagesContext);
  const keybindLabels = getKeybindLabels();
  const { imageMatrix, cardsPerPage } = usePreviewData();
  const settings = useSettingsStore((s) => s.settings);
  const backInputRef = useRef<HTMLInputElement>(null);

  const { upscaleImage } = useUpscaleImage();

  const isBackFace = face === "back";

  const absoluteIndex = images.findIndex((img) => img.uuid === image.uuid);

  const name = getIsLocalImage(image) ? image.file?.name : image.name;

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
    <Menu.Root>
      <input
        ref={backInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.bmp,.webp"
        style={{ display: "none" }}
        onChange={(e) => void onBackFileChange(e)}
      />
      <Menu.ContextTrigger cursor="grab" tabIndex={-1}>
        {children}
      </Menu.ContextTrigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {isSelected && selectedImageUuids.length > 1 ? (
              <SelectionMenuContent currentPage={currentPage} />
            ) : null}
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>
                {name && name.length > 40 ? name.slice(0, 40) + "…" : name}
              </Menu.ItemGroupLabel>
              <Menu.Item
                value="select"
                onSelect={() => onSelectImageUuid(image.uuid, !isSelected)}
              >
                <Menu.ItemIndicator>
                  <FontAwesomeIcon icon={faCheck} />
                </Menu.ItemIndicator>
                <Menu.ItemText>
                  {isSelected ? "Deselect" : "Select"}
                </Menu.ItemText>
                <Kbd size="sm">Click</Kbd>
              </Menu.Item>
              {!isBackFace && (
                <Menu.Item
                  value="remove"
                  color="fg.error"
                  onSelect={onRemoveClick}
                >
                  <Menu.ItemIndicator color="fg.error">
                    <FontAwesomeIcon icon={faTrash} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove</Menu.ItemText>
                  <Kbd size="sm">{keybindLabels.alt} + Click</Kbd>
                </Menu.Item>
              )}
              {canUpscale && !isBackFace ? (
                <Menu.Item
                  value="upscale"
                  onSelect={() => void onUpscaleClick()}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Upscale</Menu.ItemText>
                </Menu.Item>
              ) : null}
              {canRemoveUpscale && !isBackFace ? (
                <Menu.Item
                  value="remove-upscale"
                  onSelect={() => void onRemoveUpscaleClick()}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove upscale</Menu.ItemText>
                </Menu.Item>
              ) : null}
              {canAddBleed && !isBackFace ? (
                <Menu.Item
                  value="add-bleed"
                  onSelect={() => void onAddBleedClick()}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faExpand} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Add bleed</Menu.ItemText>
                </Menu.Item>
              ) : null}
              {canRemoveBleed && !isBackFace ? (
                <Menu.Item value="remove-bleed" onSelect={onRemoveBleedClick}>
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faCompress} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove bleed</Menu.ItemText>
                </Menu.Item>
              ) : null}
              {canRevertToOriginal && !isBackFace ? (
                <Menu.Item
                  value="revert-to-original"
                  onSelect={onRevertToOriginalClick}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faUndo} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Revert to original</Menu.ItemText>
                </Menu.Item>
              ) : null}
            </Menu.ItemGroup>
            {/* Back management — available for all faces when slotId is known */}
            {slotId ? (
              <Menu.ItemGroup>
                <Menu.Item value="set-back" onSelect={onSetBackClick}>
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faImagePortrait} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Set back…</Menu.ItemText>
                </Menu.Item>
                {hasBack || isBackFace ? (
                  <Menu.Item
                    value="remove-back"
                    color="fg.error"
                    onSelect={onRemoveBackClick}
                  >
                    <Menu.ItemIndicator color="fg.error">
                      <FontAwesomeIcon icon={faTrash} />
                    </Menu.ItemIndicator>
                    <Menu.ItemText>Remove back</Menu.ItemText>
                  </Menu.Item>
                ) : null}
              </Menu.ItemGroup>
            ) : null}
            {!isBackFace ? (
              <Menu.ItemGroup>
                <Menu.Item onSelect={buildOnAddClick(1)} value="add-1">
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faPlus} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Add 1</Menu.ItemText>
                  <Kbd size="sm">{keybindLabels.ctrl} + Click</Kbd>
                </Menu.Item>
                <Menu.Item onSelect={buildOnAddClick(5)} value="add-5">
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faPlus} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Add 5</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            ) : null}
            {!isBackFace ? (
              <Menu.ItemGroup>
                {!isOnLastPage ? (
                  <Menu.Item
                    onSelect={onMoveToNextPage}
                    value="move-to-next-page"
                  >
                    <Menu.ItemIndicator>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </Menu.ItemIndicator>
                    <Menu.ItemText>Move to next page</Menu.ItemText>
                  </Menu.Item>
                ) : null}
                {!isOnFirstPage ? (
                  <Menu.Item
                    onSelect={onMoveToPreviousPage}
                    value="move-to-previous-page"
                  >
                    <Menu.ItemIndicator>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </Menu.ItemIndicator>
                    <Menu.ItemText>Move to previous page</Menu.ItemText>
                  </Menu.Item>
                ) : null}
                {imageMatrix.length > 1 ? (
                  <Menu.Root
                    onSelect={onMoveToPage}
                    positioning={{ gutter: 10, placement: "right-start" }}
                  >
                    <Menu.TriggerItem>
                      <FontAwesomeIcon icon={faEllipsisV} />
                      Move to Page …
                    </Menu.TriggerItem>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content>
                          {imageMatrix.map((_, idx) => (
                            <Menu.Item
                              key={idx}
                              disabled={idx + 1 === currentPage}
                              value={(idx + 1).toString()}
                            >
                              Page {idx + 1}
                            </Menu.Item>
                          ))}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                ) : null}
              </Menu.ItemGroup>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
