import { Portal } from "@ark-ui/react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { css, cx, RecipeVariantProps, Styles, sva } from "styled-system/css";
import { center } from "styled-system/patterns";

import { Kbd } from "./components/ui/kbd";
import { Menu } from "./components/ui/menu";
import { Spinner } from "./components/ui/spinner";
import { GoogleImageData, Image, ImagesContext } from "./context/ImagesContext";
import { useCardPositionMeta } from "./hooks/useCardClassNames";

const useCardClassName = (props: {
  isEmpty: boolean;
  isPending: boolean;
  index: number;
}) => {
  const { isEmpty, isPending, index } = props;
  const positions = useCardPositionMeta();
  const beforeAfterBase: Styles = {
    pointerEvents: "none",
    display: "var(--guide-display)",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "0",
  };

  const classes: string[] = [
    "card",
    css({
      position: "relative",
      transition: "outline-color 0.1s ease-in-out",
      outlineColor: "transparent",
      _before: beforeAfterBase,
      _after: beforeAfterBase,
    }),
  ];

  if (!isEmpty && !isPending) {
    classes.push(
      css({
        _hover: {
          outlineWidth: "4",
          outlineColor: "colorPalette.default",
          outlineStyle: "solid",
          zIndex: "1",
        },
      }),
    );
  }

  const { isFirstColumn, isFirstRow, isLastColumn, isLastRow } =
    positions[index];

  if (isFirstColumn) {
    classes.push(
      css({
        _before: {
          content: '""',
          position: "absolute",
          width: "100%",
          right: "100%",
          top: "var(--guide-corner-offset)",
          bottom: "var(--guide-corner-offset)",
          borderTopWidth: "var(--guide-border-width)",
          borderBottomWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isFirstRow) {
    classes.push(
      css({
        _after: {
          content: '""',
          position: "absolute",
          height: "100%",
          bottom: "100%",
          left: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
          borderLeftWidth: "var(--guide-border-width)",
          borderRightWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isLastColumn) {
    classes.push(
      css({
        _before: {
          content: '""',
          position: "absolute",
          width: "100%",
          left: "100%",
          top: "var(--guide-corner-offset)",
          bottom: "var(--guide-corner-offset)",
          borderTopWidth: "var(--guide-border-width)",
          borderBottomWidth: "var(--guide-border-width)",
        },
      }),
    );
  }
  if (isLastRow) {
    classes.push(
      css({
        _after: {
          content: '""',
          position: "absolute",
          height: "100%",
          top: "100%",
          left: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
          borderLeftWidth: "var(--guide-border-width)",
          borderRightWidth: "var(--guide-border-width)",
        },
      }),
    );
  }

  return cx(...classes);
};

export type CardProps = {
  image: Image;
  index: number;
  showImage?: boolean;
  onImageLoad?: () => void;
};

export const Card = ({
  image,
  index,
  showImage = true,
  onImageLoad,
}: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const { images, onAdd, onRemove, isRendering, getCachedImage } =
    useContext(ImagesContext);

  const [src, setSrc] = useState<string>("");
  const downloadedSrc = image.id ? getCachedImage(image.id) : undefined;
  const isFetching = useMemo(
    () => !!image.id && !downloadedSrc,
    [image.id, downloadedSrc],
  );

  const isEmpty = !image.file && !image.id;
  const [isLoading, setIsLoading] = useState(true);
  const isPending = (isLoading || isFetching) && !isEmpty;

  const imageSrc = downloadedSrc ?? src;

  const className = useCardClassName({
    isEmpty,
    isPending,
    index,
  });

  const add = useCallback(
    (count: number) => {
      const index = images.indexOf(image);
      onAdd(
        new Array<File | GoogleImageData>(count).fill(
          image.file ?? {
            id: image.id,
            name: image.name,
          },
        ),
        index + 1,
      );
    },
    [image, images, onAdd],
  );

  const buildOnAddClick = useCallback(
    (count: number) => () => {
      add(count);
    },
    [add],
  );

  const onRemoveClick = useCallback(() => {
    onRemove(image.uuid);
  }, [image, onRemove]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isEmpty || isPending || isRendering) {
        return;
      }

      if (event.altKey) {
        onRemove(image.uuid);
      } else {
        add(1);
      }
    },
    [isEmpty, isPending, isRendering, onRemove, image.uuid, add],
  );

  useEffect(() => {
    let url: string | undefined;

    if (image.file) {
      url = URL.createObjectURL(image.file);
      setSrc(url);
    }

    return () => {
      if (url) {
        setSrc("");
        URL.revokeObjectURL(url);
      }
    };
  }, [image.file]);

  return (
    <div
      className={className}
      ref={cardRef}
      onClick={handleClick}
      id={image.uuid}
    >
      <div
        className={cx(
          "image-container",
          center({
            overflow: "hidden",
            width:
              "calc(var(--card-width, 63mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
            height:
              "calc(var(--card-height, 88mm) + calc(var(--bleed-edge-width) * 2) + var(--image-container-buffer-width))",
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
          ) : imageSrc && showImage ? (
            <Menu.Root>
              <Menu.ContextTrigger>
                <img
                  src={imageSrc}
                  alt={image.file?.name ?? image.name}
                  className={css({
                    width:
                      "calc(var(--card-width, 63mm) + var(--image-zoom-width))",
                    maxWidth: "unset",
                    objectFit: "cover",
                  })}
                  onLoad={() => {
                    setIsLoading(false);
                    onImageLoad?.();
                  }}
                />
              </Menu.ContextTrigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content onClick={(e) => e.stopPropagation()}>
                    <Menu.Item
                      value="edit"
                      color="fg.error"
                      justifyContent="space-between"
                      onSelect={onRemoveClick}
                    >
                      <Menu.ItemText>Remove</Menu.ItemText>
                      <Kbd size="sm">Alt + Click</Kbd>
                    </Menu.Item>
                    <Menu.Item
                      onSelect={buildOnAddClick(1)}
                      value="add-1"
                      justifyContent="space-between"
                    >
                      <Menu.ItemText>Add 1</Menu.ItemText>
                      <Kbd size="sm">Click</Kbd>
                    </Menu.Item>
                    <Menu.Item
                      onSelect={buildOnAddClick(5)}
                      value="add-5"
                      justifyContent="space-between"
                    >
                      <Menu.ItemText>Add 5</Menu.ItemText>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
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
      <Guides />
    </div>
  );
};

const guide = sva({
  slots: ["root", "horizontal", "vertical"],
  base: {
    root: {
      position: "absolute",
      display: "var(--guide-display)",
      zIndex: "2",
    },
    horizontal: {
      position: "absolute",
      height: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color)",
      backgroundImage:
        "repeating-linear-gradient(to right, var(--guide-border-color-inverted) 0, var(--guide-border-color-inverted) 2px, transparent 2px, transparent 4px)",
    },
    vertical: {
      position: "absolute",
      width: "var(--guide-border-width)",
      backgroundColor: "var(--guide-border-color)",
      backgroundImage:
        "repeating-linear-gradient(to bottom, var(--guide-border-color-inverted) 0, var(--guide-border-color-inverted) 2px, transparent 2px, transparent 4px)",
    },
  },
  variants: {
    position: {
      topLeft: {
        root: {
          top: "var(--guide-corner-offset)",
          left: "var(--guide-corner-offset)",
        },
        horizontal: {
          top: "0",
          left: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          top: "calc(-1 * var(--bleed-edge-width))",
          left: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      topRight: {
        root: {
          top: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          top: "0",
          right: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          top: "calc(-1 * var(--bleed-edge-width))",
          right: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      bottomLeft: {
        root: {
          bottom: "var(--guide-corner-offset)",
          left: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          left: "calc(-1 *var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          bottom: "calc(-1 * var(--bleed-edge-width))",
          left: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
      bottomRight: {
        root: {
          bottom: "var(--guide-corner-offset)",
          right: "var(--guide-corner-offset)",
        },
        horizontal: {
          bottom: "0",
          right: "calc(-1 * var(--bleed-edge-width))",
          width: "calc(var(--bleed-edge-width) + 8px)",
        },
        vertical: {
          bottom: "calc(-1 * var(--bleed-edge-width))",
          right: "0",
          height: "calc(var(--bleed-edge-width) + 8px)",
        },
      },
    },
  },
});

export type GuideVariants = RecipeVariantProps<typeof guide>;

type GuideProps = NonNullable<GuideVariants>;

const Guide = ({ position = "topLeft" }: GuideProps) => {
  const styles = guide({ position });
  return (
    <div className={styles.root}>
      <div className={styles.horizontal} />
      <div className={styles.vertical} />
    </div>
  );
};

const Guides = () => {
  return (
    <>
      <Guide position="topLeft" />
      <Guide position="topRight" />
      <Guide position="bottomLeft" />
      <Guide position="bottomRight" />
    </>
  );
};
