import { useContext, useMemo, useRef } from "react";

import { SettingsContext } from "./context/SettingsContext";
import { Card } from "./Card";
import { ImagesContext } from "./context/ImagesContext";
import { ImageErrors } from "./components/ImageErrors";
import { ProgressOverlay } from "./components/ProgressOverlay";
import { progressEvents } from "./utils/progress-events";

import { usePreviewData } from "./hooks/usePreviewData";
import { useGeneratePdf } from "./hooks/useGeneratePdf";
import { TruncatedPreviewWarning } from "./components/TruncatedPreviewWarning";
import { center, flex, grid, vstack } from "styled-system/patterns";
import { css, cx } from "styled-system/css";
import { Button } from "./components/ui/button";
import { Link } from "./components/ui/link";
import { Tooltip } from "./components/ui/tooltip";

const containerStyles = flex.raw({
  marginTop: "2.5",
  direction: "column",
  alignItems: "center",
  flex: 1,
  minWidth: 0,
  maxWidth: "var(--page-width, 8.5 var(--page-unit, in))",
});

export const PrintableImages = () => {
  const { cssVars } = useContext(SettingsContext);

  const {
    images,
    onClear,
    isRendering,
    setIsRendering,
    isFetching,
    isLoadingLocalImages,
    onClearErrors,
    imagesWithError,
  } = useContext(ImagesContext);

  const contentRef = useRef<HTMLDivElement>(null);

  const { imageMatrix, maxPages } = usePreviewData();

  const generatePdf = useGeneratePdf(contentRef);

  const cardCount = useMemo(() => {
    const totalCards = images.length;
    const cardString = totalCards === 1 ? "card" : "cards";
    return `${totalCards} total ${cardString}`;
  }, [images]);

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit("progress", {
      progress: 0,
      phase: "Initializing",
    });
    generatePdf();
  };

  if (images.length === 0) {
    return (
      <div
        className={css(containerStyles, {
          alignSelf: "stretch",
          justifyContent: "center",
          gap: "6",
        })}
      >
        <p>Add images to get started.</p>
        <p>
          Upload an XML from{" "}
          <Link asChild>
            <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
              MPC Autofill
            </a>
          </Link>{" "}
          &quot;Download XML&quot; option.
        </p>
        <p>
          You can download images from your{" "}
          <Link asChild>
            <a href="https://mpcfill.com/" target="_blank" rel="noreferrer">
              MPC Autofill
            </a>
          </Link>{" "}
          project with their &quot;Download Card Images&quot; option.
        </p>
      </div>
    );
  }

  return (
    <div className={css(containerStyles)} style={cssVars}>
      <ProgressOverlay />
      <div className={center({ gap: "2" })}>
        <div>{cardCount}</div>
        <Button
          colorPalette="gray"
          disabled={isRendering}
          onClick={() => onClear()}
        >
          Remove all cards
        </Button>
        <Tooltip.Root
          disabled={!isRendering && !isFetching && !isLoadingLocalImages}
          positioning={{
            placement: "top",
          }}
        >
          <Tooltip.Trigger asChild>
            <Button
              disabled={isRendering || isFetching || isLoadingLocalImages}
              onClick={() => handleSave()}
            >
              Save
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Arrow>
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
            <Tooltip.Content>
              {isRendering
                ? "Generating PDF..."
                : isFetching
                  ? "Downloading images..."
                  : isLoadingLocalImages
                    ? "Loading images..."
                    : ""}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </div>
      <TruncatedPreviewWarning
        maxPages={maxPages}
        totalPages={imageMatrix.length}
      />
      <ImageErrors
        onDismiss={onClearErrors}
        imagesWithError={imagesWithError}
      />
      <div
        ref={contentRef}
        className={vstack({
          marginY: "2.5",
          rowGap: "5",
          maxWidth: "100%",
          overflowX: "auto",
          "--bleed-edge-width": "var(--bleed-edge, 0mm)",
          "--image-zoom-width": "var(--image-zoom, 6.2mm)",
          "--guide-display": "var(--guides-display, block)",
          "--guide-border-color": "var(--guides-color, #adff2f)",
          "--guide-border-color-inverted":
            "var(--guides-color-inverted, #ff0000)",
          "--guide-border-width": "var(--guides-thickness, 1px)",
          "--image-container-buffer-width":
            "var(--image-container-buffer, var(--guide-border-width))",
          "--guide-corner-offset":
            "calc(calc(-0.5 * var(--guide-border-width)) + calc(var(--bleed-edge-width) * var(--guides-at-bleed-edge, 1)))",
        })}
      >
        {imageMatrix.map((row, pageIndex) => (
          <div
            className={css(
              {
                position: "relative",
                width: "100%",
                display: pageIndex < maxPages ? "block" : "none",
              },
              isRendering ? { pointerEvents: "none" } : {}
            )}
            key={pageIndex}
          >
            <div
              className={cx(
                "page",
                center({
                  flexDirection: "column",
                  height: "var(--page-height, 11 var(--page-unit, in))",
                  width: "var(--page-width, 8.5 var(--page-unit, in))",
                  background: "white",
                  overflow: "hidden",
                })
              )}
            >
              <div
                className={grid({
                  gap: "0",
                  gridTemplateColumns:
                    "repeat(var(--grid-columns, 3), min-content)",
                  pageBreakAfter: "always",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                })}
              >
                {row.map((image, index) => (
                  <Card
                    key={image.uuid || `empty-${index}`}
                    image={image}
                    index={index}
                    showImage={pageIndex < maxPages}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
