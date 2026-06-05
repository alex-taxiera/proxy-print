import {
  faExpand,
  faMagicWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";

import { css, cx } from "styled-system/css";
import { center, visuallyHidden } from "styled-system/patterns";

import { Checkbox } from "~/components/ui-old/checkbox";
import { Spinner } from "~/components/ui-old/spinner";
import { Tooltip } from "~/components/ui-old/tooltip";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import {
  getIsLocalImage,
  ImagesContext,
  getIsDownloadableImage,
  PossiblyEmptyImage,
  getIsEmptyImage,
} from "~/context/ImagesContext";
import { useSortableCard } from "~/hooks/useSortableCard";
import {
  getQueryKeyForImage,
  ImageQueryData,
  LocalImageQueryData,
  ScryfallImageQueryData,
} from "~/queries/images";
import { useSettingsStore } from "~/store/settingsStore";
import { ctrlOrMeta } from "~/utils/ctrl-or-meta";

import { CardContextMenu } from "./CardContextMenu";
import { Guides } from "./Guides";
import { useCardClassName } from "./useCardClassName";

const hasTransformFlags = (
  d: ImageQueryData,
): d is ScryfallImageQueryData | LocalImageQueryData =>
  "isUpscaled" in d && "hasBleed" in d;

const useQueryData = (image: PossiblyEmptyImage) => {
  const queryClient = useQueryClient();

  const queryKey = !getIsEmptyImage(image) ? getQueryKeyForImage(image) : null;

  // Manually subscribe to cache updates without triggering fetches
  const [queryData, setQueryData] = useState(() => {
    if (!queryKey) return undefined;
    return queryClient.getQueryData<ImageQueryData>(queryKey);
  });

  useEffect(() => {
    if (!queryKey) return;

    const currentQueryData = queryClient.getQueryData<ImageQueryData>(queryKey);
    if (currentQueryData && !queryData) {
      setTimeout(() => setQueryData(currentQueryData));
    }

    // Subscribe to cache updates for this specific query
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if this event is related to our specific image query
      const isOurQuery =
        event.query &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey.length > 0 &&
        // Compare the actual query key arrays, not hash vs string
        JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey);

      if ((event.type === "updated" || event.type === "added") && isOurQuery) {
        const queryData = queryClient.getQueryData<ImageQueryData>(queryKey)!;
        setQueryData(queryData);
      }
    });

    return unsubscribe;
  }, [queryClient, queryData, queryKey]);

  return queryData;
};

export type CardProps = {
  image: PossiblyEmptyImage;
  index: number;
  currentPage: number;
  onImageLoad?: () => void;
  /** Slot this card belongs to (null for filler/padding) */
  slotId?: string | null;
  /** Whether this card is displaying a front or back face */
  face?: "front" | "back";
};

export const Card = ({
  image,
  index,
  currentPage,
  onImageLoad,
  slotId = null,
  face = "front",
}: CardProps) => {
  const { images, onAdd, onRemove, isRendering } = useContext(ImagesContext);
  const { onSelectImageUuid, getIsSelected } = useContext(
    ImageSelectionContext,
  );
  const settings = useSettingsStore((s) => s.settings);

  const isSelected = getIsSelected(image.uuid);

  const absoluteIndex = images.findIndex((img) => img.uuid === image.uuid);

  const [src, setSrc] = useState<string>("");
  const queryData = useQueryData(image);

  const isFetching = getIsDownloadableImage(image) && !queryData;

  const isEmpty = getIsEmptyImage(image);

  const [isLoading, setIsLoading] = useState(true);
  const isTransformProcessing =
    !!queryData && hasTransformFlags(queryData) && !!queryData.isProcessing;
  const isPending = isLoading || isFetching || isTransformProcessing;

  const imageSrc = src;

  const sortable = useSortableCard({
    image,
    index,
    isPending,
    imageSrc,
    absoluteIndex,
    slotId,
    face,
  });

  const className = useCardClassName({
    isEmpty,
    isPending,
    index,
    isDragging: sortable.isDragging,
  });

  const add = (count: number) => {
    if (isEmpty) {
      return;
    }

    onAdd(
      Array.from({ length: count }, () => image),
      images.indexOf(image) + 1,
    );
  };

  const handleClick = (event: React.MouseEvent) => {
    if (isEmpty || isPending || isRendering) {
      return;
    }

    if (event.altKey) {
      onRemove(image.uuid);
    } else if (ctrlOrMeta(event)) {
      add(1);
    } else {
      onSelectImageUuid(image.uuid, !isSelected);
    }
  };

  const name = getIsLocalImage(image) ? image.file?.name : image.name;

  useEffect(() => {
    let url: string | undefined;

    if (queryData) {
      url = URL.createObjectURL(queryData.data);
      setSrc(url);
    }

    return () => {
      if (url) {
        setSrc("");
        URL.revokeObjectURL(url);
      }
    };
  }, [queryData, image]);

  return (
    <div
      className={className}
      ref={sortable.ref}
      id={image.uuid}
      tabIndex={isEmpty || isPending || isRendering ? -1 : 0}
    >
      <div
        className={cx(
          "image-container",
          center({
            overflow: "hidden",
            width: "var(--item-width, 63mm)",
            height: "var(--item-height, 88mm)",
            ...(sortable.isDropTarget &&
            !sortable.isDragging &&
            !sortable.isDropping
              ? {
                  _after: {
                    content: "''",
                    position: "absolute",
                    top: "0",
                    left: "0",
                    height: "full",
                    width: "full",
                    background: "accent.a4",
                    zIndex: 5,
                  },
                }
              : null),
          }),
        )}
      >
        <>
          {isEmpty ? (
            <span
              className={css({
                _after: {
                  content: '""',
                  position: "absolute",
                  top: "var(--guide-corner-offset)",
                  left: "var(--guide-corner-offset)",
                  right: "var(--guide-corner-offset)",
                  bottom: "var(--guide-corner-offset)",
                  borderColor: "black",
                  borderStyle: "solid",
                  borderWidth: "var(--guide-border-width)",
                },
              })}
            />
          ) : imageSrc ? (
            <CardContextMenu
              image={image}
              add={add}
              onSelectImageUuid={onSelectImageUuid}
              currentPage={currentPage}
              index={index}
              queryData={queryData}
              slotId={slotId}
              face={face}
            >
              <img
                src={imageSrc}
                alt={name}
                className={css({
                  width:
                    "calc(var(--card-width, 63mm) + var(--image-zoom-width))",
                  maxWidth: "unset",
                  objectFit: "cover",
                  position: "relative",
                })}
                onClick={handleClick}
                onLoad={() => {
                  setIsLoading(false);
                  onImageLoad?.();
                }}
              />
            </CardContextMenu>
          ) : (
            <span
              className={css({
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "error.fg",
                fontSize: "3",
                userSelect: "none",
              })}
            >
              Error!
            </span>
          )}
          {isPending && !isEmpty && (
            <span
              className={center({
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "white/50",
              })}
            >
              <Spinner size="xl" />
            </span>
          )}
        </>
      </div>
      {!settings.extendedGuidesOnly && <Guides />}
      {!isEmpty &&
      !isPending &&
      !isRendering &&
      queryData &&
      hasTransformFlags(queryData) &&
      (queryData.isUpscaled || queryData.hasBleed) ? (
        <div
          className={css({
            position: "absolute",
            top: 1,
            right: 2,
            display: "flex",
            gap: 1,
            zIndex: 1,
          })}
        >
          {queryData.isUpscaled && (
            <Tooltip.Root positioning={{ placement: "top" }} openDelay={200}>
              <Tooltip.Trigger
                height="6"
                aspectRatio="1/1"
                color="fg.default"
                bg="bg.subtle/75"
                borderRadius="sm"
              >
                <FontAwesomeIcon icon={faMagicWandSparkles} size="sm" />
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>Upscaled</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
          {queryData.hasBleed && (
            <Tooltip.Root positioning={{ placement: "top" }} openDelay={200}>
              <Tooltip.Trigger
                height="6"
                aspectRatio="1/1"
                color="fg.default"
                bg="bg.subtle/75"
                borderRadius="sm"
              >
                <FontAwesomeIcon icon={faExpand} size="sm" />
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>Has generated bleed</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
        </div>
      ) : null}
      {!isEmpty && !isPending ? (
        <Checkbox
          className={css({
            visibility: isSelected ? "visible" : "hidden",
            position: "absolute",
            top: 2,
            left: 2,
            zIndex: 1,
            gap: 0,
            _groupHover: {
              visibility: "visible",
            },
            "& [data-part='control'][data-state='unchecked']": {
              backgroundColor: "bg.emphasized",
            },
          })}
          checked={isSelected}
          onCheckedChange={(details) =>
            onSelectImageUuid(image.uuid, details.checked === true)
          }
          size="md"
        >
          <span className={visuallyHidden()}>Select {name}</span>
        </Checkbox>
      ) : null}
    </div>
  );
};
