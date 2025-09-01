import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { css, cx } from "styled-system/css";
import { center, visuallyHidden } from "styled-system/patterns";

import { Checkbox } from "~/components/ui/checkbox";
import { Spinner } from "~/components/ui/spinner";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import {
  getIsLocalImage,
  ImagesContext,
  getIsDownloadableImage,
  PossiblyEmptyImage,
  getIsEmptyImage,
} from "~/context/ImagesContext";
import { useSortableCard } from "~/hooks/useSortableCard";
import { getQueryKeyForImage, ImageQueryData } from "~/queries/images";
import { ctrlOrMeta } from "~/utils/ctrl-or-meta";

import { CardContextMenu } from "./CardContextMenu";
import { Guides } from "./Guides";
import { useCardClassName } from "./useCardClassName";

const useDownloadedSrc = (image: PossiblyEmptyImage) => {
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => (!getIsEmptyImage(image) ? getQueryKeyForImage(image) : null),
    [image],
  );

  // Manually subscribe to cache updates without triggering fetches
  const [downloadedSrc, setDownloadedSrc] = useState<Blob | undefined>(() => {
    if (!queryKey) return undefined;
    return queryClient.getQueryData<ImageQueryData>(queryKey)?.data;
  });

  useEffect(() => {
    if (!queryKey) return;

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
        const { data } = queryClient.getQueryData<ImageQueryData>(queryKey)!;
        setDownloadedSrc(data);
      }
    });

    return unsubscribe;
  }, [queryClient, queryKey]);

  return downloadedSrc;
};

export type CardProps = {
  image: PossiblyEmptyImage;
  index: number;
  currentPage: number;
  onImageLoad?: () => void;
};

export const Card = ({ image, index, currentPage, onImageLoad }: CardProps) => {
  const { images, onAdd, onRemove, isRendering } = useContext(ImagesContext);
  const { onSelectImageUuid, getIsSelected } = useContext(
    ImageSelectionContext,
  );

  const isSelected = useMemo(() => {
    return getIsSelected(image.uuid);
  }, [getIsSelected, image.uuid]);

  const absoluteIndex = useMemo(() => {
    return images.findIndex((img) => img.uuid === image.uuid);
  }, [images, image.uuid]);

  const [src, setSrc] = useState<string>("");
  const downloadedSrc = useDownloadedSrc(image);

  const isFetching = useMemo(
    () => getIsDownloadableImage(image) && !downloadedSrc,
    [image, downloadedSrc],
  );

  const isEmpty = getIsEmptyImage(image);

  const [isLoading, setIsLoading] = useState(true);
  const isPending = isLoading || isFetching;

  const imageSrc = src;

  const sortable = useSortableCard({
    image,
    index,
    isPending,
    imageSrc,
    absoluteIndex,
  });

  const className = useCardClassName({
    isEmpty,
    isPending,
    index,
    isDragging: sortable.isDragging,
  });

  const add = useCallback(
    (count: number) => {
      if (isEmpty) {
        return;
      }

      onAdd(
        Array.from({ length: count }, () => image),
        images.indexOf(image) + 1,
      );
    },
    [image, images, onAdd, isEmpty],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
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
    },
    [
      isEmpty,
      isPending,
      isRendering,
      onRemove,
      image.uuid,
      onSelectImageUuid,
      isSelected,
      add,
    ],
  );

  const name = useMemo(() => {
    if (getIsLocalImage(image)) {
      return image.file?.name;
    }
    return image.name;
  }, [image]);

  useEffect(() => {
    let url: string | undefined;

    if (downloadedSrc) {
      url = URL.createObjectURL(downloadedSrc);
      setSrc(url);
    }

    return () => {
      if (url) {
        setSrc("");
        URL.revokeObjectURL(url);
      }
    };
  }, [downloadedSrc, image]);

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
                backgroundColor: "white",
              })}
            >
              <Spinner size="xl" />
            </span>
          )}
        </>
      </div>
      {!isEmpty && !isPending ? (
        <Checkbox
          className={css({
            visibility: isSelected ? "visible" : "hidden",
            position: "absolute",
            top: 2,
            left: 2,
            backgroundColor: "bg.emphasized",
            gap: 0,
            _groupHover: {
              visibility: "visible",
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
      <Guides />
    </div>
  );
};
