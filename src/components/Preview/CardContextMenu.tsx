import { MenuSelectionDetails, Portal } from "@ark-ui/react";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faEllipsisV,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useMemo } from "react";

import { ImageSelectionContext } from "../../context/ImageSelectionContext";
import { Image, ImagesContext } from "../../context/ImagesContext";
import { usePreviewData } from "../../hooks/usePreviewData";
import { getKeybindLabels } from "../../utils/keybind-labels";
import { Kbd } from "../ui/kbd";
import { Menu } from "../ui/menu";

export type CardContextMenuProps = React.PropsWithChildren<{
  image: Image;
  add: (count: number) => void;
  currentPage: number;
  index: number;
  onSelectImageUuid: (uuid: string, selected: boolean) => void;
}>;

export const CardContextMenu = ({
  image,
  add,
  currentPage,
  children,
  index,
}: CardContextMenuProps) => {
  const { onSelectImageUuid, getIsSelected } = useContext(
    ImageSelectionContext,
  );
  const isSelected = getIsSelected(image.uuid);
  const { images, onRemove, onReorder } = useContext(ImagesContext);
  const keybindLabels = getKeybindLabels();
  const { imageMatrix, cardsPerPage } = usePreviewData();

  const absoluteIndex = useMemo(() => {
    return images.findIndex((img) => img.uuid === image.uuid);
  }, [images, image.uuid]);

  const buildOnAddClick = useCallback(
    (count: number) => () => {
      add(count);
    },
    [add],
  );

  const onRemoveClick = useCallback(() => {
    onRemove(image.uuid);
  }, [image, onRemove]);

  const isOnLastPage = useMemo(() => {
    return currentPage === imageMatrix.length;
  }, [currentPage, imageMatrix.length]);

  const isOnFirstPage = useMemo(() => {
    return currentPage === 1;
  }, [currentPage]);

  const onMoveToNextPage = useCallback(() => {
    const newIndex = absoluteIndex + cardsPerPage - index;
    onReorder([image], newIndex);
  }, [image, absoluteIndex, index, cardsPerPage, onReorder]);

  const onMoveToPreviousPage = useCallback(() => {
    const newIndex = absoluteIndex - index - 1;
    onReorder([image], newIndex);
  }, [image, absoluteIndex, index, onReorder]);

  const onMoveToPage = useCallback(
    (details: MenuSelectionDetails) => {
      const page = parseInt(details.value);
      const newIndex =
        page > currentPage
          ? (page - 1) * cardsPerPage
          : page * cardsPerPage - 1;
      onReorder([image], newIndex);
    },
    [image, currentPage, cardsPerPage, onReorder],
  );

  return (
    <Menu.Root>
      <Menu.ContextTrigger cursor="grab" tabIndex={-1}>
        {children}
      </Menu.ContextTrigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            <Menu.ItemGroup>
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
              <Menu.Item value="edit" color="fg.error" onSelect={onRemoveClick}>
                <Menu.ItemIndicator color="fg.error">
                  <FontAwesomeIcon icon={faTrash} />
                </Menu.ItemIndicator>
                <Menu.ItemText>Remove</Menu.ItemText>
                <Kbd size="sm">{keybindLabels.alt} + Click</Kbd>
              </Menu.Item>
            </Menu.ItemGroup>
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
                    Move to ...
                  </Menu.TriggerItem>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        {imageMatrix.map((_, index) => (
                          <Menu.Item
                            key={index}
                            disabled={index + 1 === currentPage}
                            value={(index + 1).toString()}
                          >
                            Page {index + 1}
                          </Menu.Item>
                        ))}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              ) : null}
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
