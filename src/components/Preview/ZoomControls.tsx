import { Button, HStack, IconButton } from "@chakra-ui/react";
import { useContext } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";

import {
  MenuContent,
  MenuRadioItem,
  MenuRadioItemGroup,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";

import { PreviewContext, ZOOM_LEVELS } from "@/context/PreviewContext";

const FIT_VALUE = "fit";

/** Keeps stepping off a fitted value from landing back on the same level. */
const EPSILON = 0.005;

/** Floats over the bottom-right of the preview. The selection action bar sits
 * above it and is allowed to cover it. */
export const ZoomControls = () => {
  const { zoom, isZoomFitted, setZoom, fitZoom } = useContext(PreviewContext);

  const nextLevelUp = ZOOM_LEVELS.find((level) => level > zoom + EPSILON);
  const nextLevelDown = ZOOM_LEVELS.filter(
    (level) => level < zoom - EPSILON,
  ).at(-1);

  return (
    <HStack
      position="absolute"
      bottom="4"
      right="4"
      zIndex="2"
      gap="1"
      padding="1"
      borderWidth="1px"
      borderColor="border"
      borderRadius="l3"
      backgroundColor="bg.panel"
      boxShadow="md"
    >
      <Tooltip content="Zoom out">
        <IconButton
          aria-label="Zoom out"
          variant="ghost"
          colorPalette="gray"
          size="xs"
          disabled={nextLevelDown === undefined}
          onClick={() => nextLevelDown && setZoom(nextLevelDown)}
        >
          <LuMinus />
        </IconButton>
      </Tooltip>
      <MenuRoot positioning={{ placement: "top" }}>
        <MenuTrigger asChild>
          <Button
            aria-label={`Zoom level, ${Math.round(zoom * 100)}%`}
            variant="ghost"
            colorPalette="gray"
            size="xs"
            minWidth="12"
            fontVariantNumeric="tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </Button>
        </MenuTrigger>
        <MenuContent minWidth="40">
          <MenuRadioItemGroup
            value={isZoomFitted ? FIT_VALUE : String(zoom)}
            onValueChange={({ value }) =>
              value === FIT_VALUE ? fitZoom() : setZoom(Number(value))
            }
          >
            <MenuRadioItem value={FIT_VALUE}>Fit to screen</MenuRadioItem>
            {ZOOM_LEVELS.map((level) => (
              <MenuRadioItem key={level} value={String(level)}>
                {Math.round(level * 100)}%
              </MenuRadioItem>
            ))}
          </MenuRadioItemGroup>
        </MenuContent>
      </MenuRoot>
      <Tooltip content="Zoom in">
        <IconButton
          aria-label="Zoom in"
          variant="ghost"
          colorPalette="gray"
          size="xs"
          disabled={nextLevelUp === undefined}
          onClick={() => nextLevelUp && setZoom(nextLevelUp)}
        >
          <LuPlus />
        </IconButton>
      </Tooltip>
    </HStack>
  );
};
