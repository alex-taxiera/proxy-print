import {
  Box,
  Flex,
  Spinner,
  Image,
  Center,
  VisuallyHidden,
  SystemStyleObject,
  Badge,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { LuExpand, LuWandSparkles } from "react-icons/lu";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import {
  getIsLocalImage,
  ImagesContext,
  getIsDownloadableImage,
  PossiblyEmptyImage,
  getIsEmptyImage,
} from "@/context/ImagesContext";
import { useCardPositionMeta } from "@/hooks/useCardClassNames";
import { useSortableCard } from "@/hooks/useSortableCard";
import {
  getQueryKeyForImage,
  ImageQueryData,
  LocalImageQueryData,
  ScryfallImageQueryData,
} from "@/queries/images";
import { useSettingsStore } from "@/store/settingsStore";
import { ctrlOrMeta } from "@/utils/ctrl-or-meta";

import { CardContextMenu } from "./CardContextMenu";
import { Guides } from "./Guides";

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

  // react-hooks/refs: useSortableCard calls @dnd-kit/react's useSortable, which
  // returns getter properties (isDragging, isDropTarget, isDropping, ref) backed
  // by useDeepSignal — a ref-based reactive primitive that dnd-kit intentionally
  // exposes for render-time access. The library tracks which getters are read and
  // schedules re-renders on change, so these ARE safe to access during render.
  // Fixing these errors would require replacing dnd-kit's built-in reactive state
  // with manual useDragDropMonitor subscriptions — a significant refactor.
  const sortable = useSortableCard({
    image,
    index,
    isPending,
    imageSrc,
    absoluteIndex,
    slotId,
    face,
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

  // react-hooks/set-state-in-effect: setSrc is called synchronously inside this
  // effect. The alternative (useMemo) is unsafe here because URL.createObjectURL
  // is a side effect — React may speculatively call useMemo multiple times in
  // concurrent mode, leaking object URLs with no cleanup path. The effect pattern
  // is the only correct way to pair URL creation with its revocation on cleanup.
  useEffect(() => {
    let url: string | undefined;

    if (queryData) {
      url = URL.createObjectURL(queryData.data);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSrc(url);
    }

    return () => {
      if (url) {
        setSrc("");
        URL.revokeObjectURL(url);
      }
    };
  }, [queryData, image]);

  const positions = useCardPositionMeta();

  const { isFirstColumn, isFirstRow, isLastColumn, isLastRow } =
    positions[index];

  const cardBeforeAfter: SystemStyleObject = {
    pointerEvents: "none",
    display: sortable.isDragging ? "none" : "var(--guide-display)",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "0",
  };

  const cardBefore: SystemStyleObject = {
    ...cardBeforeAfter,
    ...(isFirstColumn || isLastColumn
      ? {
          content: '""',
          position: "absolute",
          width: "var(--horizontal-guide-length)",
          top: "var(--guide-corner-offset)",
          bottom: "var(--guide-corner-offset)",
          borderTopWidth: "var(--guide-border-width)",
          borderBottomWidth: "var(--guide-border-width)",
        }
      : {}),
    right: isFirstColumn ? "100%" : undefined,
    left: isLastColumn ? "100%" : undefined,
  };

  const cardAfter: SystemStyleObject = {
    ...cardBeforeAfter,
    ...(isFirstRow || isLastRow
      ? {
          content: '""',
          position: "absolute",
          height: "var(--vertical-guide-length)",
          left: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
          borderLeftWidth: "var(--guide-border-width)",
          borderRightWidth: "var(--guide-border-width)",
        }
      : {}),
    bottom: isFirstRow ? "100%" : undefined,
    top: isLastRow ? "100%" : undefined,
  };

  const cardHighlightStyles: SystemStyleObject = {
    outlineWidth: "4",
    outlineColor: "accent.solid",
    outlineStyle: "solid",
    zIndex: "1",
  };

  /* eslint-disable react-hooks/refs */
  return (
    <Box
      className="card group"
      ref={sortable.ref}
      id={image.uuid}
      tabIndex={isEmpty || isPending || isRendering ? -1 : 0}
      position="relative"
      transitionProperty="common"
      transitionDuration="moderate"
      outlineColor="transparent"
      opacity={sortable.isDragging ? 0.5 : 1}
      css={{
        "--horizontal-guide-length":
          "calc(calc(var(--page-width) - calc(var(--item-width) * var(--columns-per-page))) / 2)",
        "--vertical-guide-length":
          "calc(calc(var(--page-height) - calc(var(--item-height) * var(--rows-per-page))) / 2)",
      }}
      _before={cardBefore}
      _after={cardAfter}
      _hover={!isEmpty && !isPending ? cardHighlightStyles : undefined}
      _focusVisible={!isEmpty && !isPending ? cardHighlightStyles : undefined}
    >
      <Center
        className="image-container"
        overflow="hidden"
        width="var(--item-width, 63mm)"
        height="var(--item-height, 88mm)"
        _after={
          sortable.isDropTarget && !sortable.isDragging && !sortable.isDropping
            ? {
                content: "''",
                position: "absolute",
                top: "0",
                left: "0",
                height: "full",
                width: "full",
                background: "accent.emphasized/50",
                zIndex: 5,
              }
            : {}
        }
      >
        <>
          {isEmpty ? (
            <Box
              as="span"
              _after={{
                content: '""',
                position: "absolute",
                top: "var(--guide-corner-offset)",
                left: "var(--guide-corner-offset)",
                right: "var(--guide-corner-offset)",
                bottom: "var(--guide-corner-offset)",
                borderColor: "black",
                borderStyle: "solid",
                borderWidth: "var(--guide-border-width)",
              }}
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
              <Image
                src={imageSrc}
                alt={name}
                width="calc(var(--card-width, 63mm) + var(--image-zoom-width))"
                maxWidth="unset"
                objectFit="cover"
                position="relative"
                onClick={handleClick}
                onLoad={() => {
                  setIsLoading(false);
                  onImageLoad?.();
                }}
              />
            </CardContextMenu>
          ) : !isPending ? (
            <Box
              as="span"
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              color="fg.error"
              fontSize="3"
              userSelect="none"
            >
              Error!
            </Box>
          ) : (
            <Center
              as="span"
              position="absolute"
              top="0"
              left="0"
              width="full"
              height="full"
              bg="white/50"
            >
              <Spinner color="accent.solid" size="xl" />
            </Center>
          )}
        </>
      </Center>
      {!settings.extendedGuidesOnly && <Guides />}
      {!isEmpty &&
      !isPending &&
      !isRendering &&
      queryData &&
      hasTransformFlags(queryData) &&
      (queryData.isUpscaled || queryData.hasBleed) ? (
        <Flex position="absolute" top="1" right="2" gap="1" zIndex="1">
          {queryData.isUpscaled && (
            <Tooltip
              content="Upscaled"
              positioning={{ placement: "top" }}
              openDelay={200}
            >
              <Badge boxSize="6" colorPalette="accent">
                <LuWandSparkles />
              </Badge>
            </Tooltip>
          )}
          {queryData.hasBleed && (
            <Tooltip
              content="Has generated bleed"
              positioning={{ placement: "top" }}
              openDelay={200}
            >
              <Badge boxSize="6" colorPalette="accent">
                <LuExpand />
              </Badge>
            </Tooltip>
          )}
        </Flex>
      ) : null}
      {!isEmpty && !isPending ? (
        <Checkbox
          visibility={isSelected ? "visible" : "hidden"}
          position="absolute"
          top="2"
          left="2"
          zIndex="1"
          gap="0"
          _groupHover={{
            visibility: "visible",
          }}
          css={{
            "& [data-part='control'][data-state='unchecked']": {
              backgroundColor: "bg.emphasized",
            },
          }}
          checked={isSelected}
          onCheckedChange={(details) =>
            onSelectImageUuid(image.uuid, details.checked === true)
          }
          size="md"
        >
          <VisuallyHidden>Select {name}</VisuallyHidden>
        </Checkbox>
      ) : null}
    </Box>
  );
  /* eslint-enable react-hooks/refs */
};
