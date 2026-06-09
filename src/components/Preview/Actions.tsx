import {
  Button,
  Spinner,
  IconButton,
  MenuSelectionDetails,
  VisuallyHidden,
  createListCollection,
  HStack,
  VStack,
  Box,
  ButtonGroup,
} from "@chakra-ui/react";
import { useContext } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuDownload,
  LuExpand,
  LuImageDown,
  LuImageUpscale,
  LuShrink,
  LuTrash,
  LuUndo,
  LuEllipsis,
  LuCheck,
} from "react-icons/lu";

import {
  MenuItem,
  MenuContent,
  MenuItemText,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import {
  SelectRoot,
  SelectLabel,
  SelectTrigger,
  SelectControl,
  SelectValueText,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectIndicatorGroup,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

import { ImageErrors } from "@/components/ImageErrors";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { ImagesContext } from "@/context/ImagesContext";
import { PrintMode } from "@/context/SettingsContext";
import { useGeneratePdf } from "@/hooks/useGeneratePdf";
import { usePreviewData } from "@/hooks/usePreviewData";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { useSettingsStore } from "@/store/settingsStore";
import { progressEvents } from "@/utils/progress-events";

import {
  ActionBarCloseTrigger,
  ActionBarContent,
  ActionBarRoot,
  ActionBarSelectionTrigger,
  ActionBarSeparator,
} from "../ui/action-bar";
import { useCardActions } from "./Card/useCardActions";

const PRINT_MODE_OPTIONS: { value: PrintMode; label: string }[] = [
  { value: "duplex", label: "Duplex" },
  { value: "inline-faces", label: "Inline faces" },
  { value: "fronts-only", label: "Fronts only" },
  { value: "backs-only", label: "Backs only" },
  { value: "side-by-side", label: "Side by side" },
];

const printModeCollection = createListCollection({
  items: PRINT_MODE_OPTIONS,
  itemToValue: (item) => item.value,
  itemToString: (item) => item.label,
});

const PrintModeToggle = () => {
  const printMode = useSettingsStore((s) => s.settings.printMode);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const handleChange = (details: { value: string[] }) => {
    const mode = details.value[0] as PrintMode;
    if (mode) setSettings((s) => ({ ...s, printMode: mode }));
  };

  return (
    <SelectRoot
      collection={printModeCollection}
      value={[printMode]}
      onValueChange={handleChange}
      size="md"
      width="44"
    >
      <SelectLabel asChild>
        <VisuallyHidden>Card Size</VisuallyHidden>
      </SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText />
        </SelectTrigger>
        <SelectIndicatorGroup />
      </SelectControl>
      <SelectContent>
        {printModeCollection.items.map((opt) => (
          <SelectItem key={opt.value} item={opt}>
            <SelectItemText>{opt.label}</SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
};

const NoSelectionActions = ({
  isReferenceCardLoaded,
  contentRef,
}: {
  isReferenceCardLoaded: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const { isRendering, setIsRendering, images } = useContext(ImagesContext);
  const isLoadingImages = useDownloadProgressStore((s) => s.pending > 0);
  const generatePdf = useGeneratePdf(contentRef);
  const { onSelectAllImages } = useContext(ImageSelectionContext);

  const handleSave = () => {
    setIsRendering(true);
    console.time("save");
    progressEvents.emit("progress", {
      progress: 0,
      phase: "Initializing",
    });
    generatePdf();
  };

  const { remove, isDownloading, downloadImages } = useCardActions({
    images,
    currentPage: 0,
  });

  return (
    <HStack gap="2" flexWrap="wrap">
      <PrintModeToggle />
      <Tooltip
        disabled={!isRendering && !isLoadingImages && isReferenceCardLoaded}
        positioning={{
          placement: "top",
        }}
        content={
          isRendering
            ? "Generating PDF..."
            : isLoadingImages
              ? "Downloading images..."
              : !isReferenceCardLoaded
                ? "Loading images..."
                : ""
        }
      >
        <Button
          disabled={isRendering || isLoadingImages || !isReferenceCardLoaded}
          onClick={() => handleSave()}
        >
          Generate PDF
        </Button>
      </Tooltip>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton
            variant="outline"
            colorPalette="gray"
            aria-label="Actions"
            type="button"
          >
            <LuEllipsis />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          <>
            <MenuItem
              value="select-all"
              onSelect={() => onSelectAllImages(true)}
            >
              <LuCheck />
              <MenuItemText>Select all</MenuItemText>
            </MenuItem>
            <MenuItem
              value="remove-all"
              onSelect={() => remove()}
              disabled={isRendering}
              color="fg.error"
            >
              <LuTrash />
              <MenuItemText>Remove all</MenuItemText>
            </MenuItem>
            <MenuItem
              value="downloadZip"
              onSelect={() => downloadImages()}
              disabled={isLoadingImages || isDownloading}
            >
              {isDownloading ? <Spinner size="sm" mr="1px" /> : <LuDownload />}
              <MenuItemText>Download all (ZIP)</MenuItemText>
            </MenuItem>
          </>
        </MenuContent>
      </MenuRoot>
    </HStack>
  );
};

interface SelectionActionBarProps {
  currentPage: number;
}

const SelectionActionBar = ({ currentPage }: SelectionActionBarProps) => {
  const { images, isRendering } = useContext(ImagesContext);
  const { selectedImageUuids, onSelectAllImages } = useContext(
    ImageSelectionContext,
  );
  const { pages } = usePreviewData();
  const isLoadingImages = useDownloadProgressStore((s) => s.pending > 0);
  const selectedImages = images.filter((image) =>
    selectedImageUuids.includes(image.uuid),
  );

  const {
    remove,
    canAddBleed,
    addBleed,
    canRemoveBleed,
    removeBleed,
    canUpscale,
    upscale,
    canRemoveUpscale,
    removeUpscale,
    canRevertToOriginal,
    revertToOriginal,
    moveToPage,
    canMoveToNextPage,
    canMoveToPreviousPage,
    moveToNextPage,
    moveToPreviousPage,
    isDownloading,
    downloadImages,
  } = useCardActions({
    images: selectedImages,
    currentPage,
  });

  const onMoveToPage = (details: MenuSelectionDetails) =>
    moveToPage(parseInt(details.value));

  return (
    <ActionBarRoot open={selectedImageUuids.length > 0}>
      <ActionBarContent>
        <ActionBarSelectionTrigger display={{ base: "none", sm: "inline-flex" }}>
          {selectedImageUuids.length} selected
        </ActionBarSelectionTrigger>
        <ActionBarSeparator display={{ base: "none", sm: "inline-flex" }} />
        <ButtonGroup variant="outline" size={{ base: "xs", md: "md" }}>
          <Tooltip content={isRendering ? "Generating PDF..." : "Remove"}>
            <IconButton
              aria-label="Remove"
              color="fg.error"
              onClick={() => remove()}
              disabled={isRendering}
            >
              <LuTrash />
            </IconButton>
          </Tooltip>
          <Tooltip
            content={
              isLoadingImages
                ? "Loading images..."
                : isDownloading
                  ? "Downloading images..."
                  : "Download"
            }
          >
            <IconButton
              aria-label="Download"
              onClick={() => downloadImages()}
              disabled={isLoadingImages}
              loading={isDownloading}
            >
              <LuDownload />
            </IconButton>
          </Tooltip>
          {canUpscale ? (
            <Tooltip content="Upscale">
              <IconButton aria-label="Upscale" onClick={() => upscale()}>
                <LuImageUpscale />
              </IconButton>
            </Tooltip>
          ) : null}
          {canRemoveUpscale ? (
            <Tooltip content="Remove upscale">
              <IconButton
                aria-label="Remove upscale"
                onClick={() => removeUpscale()}
              >
                <LuImageDown />
              </IconButton>
            </Tooltip>
          ) : null}
          {canAddBleed ? (
            <Tooltip content="Add bleed">
              <IconButton aria-label="Add bleed" onClick={() => addBleed()}>
                <LuExpand />
              </IconButton>
            </Tooltip>
          ) : null}
          {canRemoveBleed ? (
            <Tooltip content="Remove bleed">
              <IconButton
                aria-label="Remove bleed"
                onClick={() => removeBleed()}
              >
                <LuShrink />
              </IconButton>
            </Tooltip>
          ) : null}
          {canRevertToOriginal ? (
            <Tooltip content="Revert to original">
              <IconButton
                aria-label="Revert to original"
                onClick={revertToOriginal}
              >
                <LuUndo />
              </IconButton>
            </Tooltip>
          ) : null}
          {!canMoveToPreviousPage ? (
            <Tooltip content="Move to previous page">
              <IconButton
                aria-label="Move to previous page"
                onClick={moveToPreviousPage}
              >
                <LuArrowLeft />
              </IconButton>
            </Tooltip>
          ) : null}
          {!canMoveToNextPage ? (
            <Tooltip content="Move to next page">
              <IconButton
                aria-label="Move to next page"
                onClick={moveToNextPage}
              >
                <LuArrowRight />
              </IconButton>
            </Tooltip>
          ) : null}
          {pages.length > 1 ? (
            <MenuRoot onSelect={onMoveToPage}>
              <Tooltip content="Move to page ...">
                <div>
                  <MenuTrigger asChild>
                    <IconButton aria-label="Move to page ...">
                      <LuEllipsis />
                    </IconButton>
                  </MenuTrigger>
                </div>
              </Tooltip>
              <MenuContent>
                {pages.map((_, index) => (
                  <MenuItem
                    key={index}
                    disabled={index + 1 === currentPage}
                    value={`${(index + 1).toString()}`}
                  >
                    Page {index + 1}
                  </MenuItem>
                ))}
              </MenuContent>
            </MenuRoot>
          ) : null}
          <ActionBarCloseTrigger onClick={() => onSelectAllImages(false)} />
        </ButtonGroup>
      </ActionBarContent>
    </ActionBarRoot>
  );
};

export type ActionsProps = {
  isReferenceCardLoaded: boolean;
  currentPage: number;
  changePage: (page: number) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

export const Actions = ({
  isReferenceCardLoaded,
  currentPage,
  changePage,
  contentRef,
}: ActionsProps) => {
  const { onClearErrors, imagesWithError } = useContext(ImagesContext);

  const { pages, cardsPerPage } = usePreviewData();

  return (
    <VStack
      gap="2"
      width="var(--page-width)"
      minWidth="max"
      maxWidth="full"
      alignItems="stretch"
      position="sticky"
      left="0"
    >
      <HStack
        gap="2"
        paddingLeft="2"
        justifyContent="space-between"
        alignItems="flex-end"
        paddingBottom="3"
        borderTopRadius="md"
      >
        <NoSelectionActions
          isReferenceCardLoaded={isReferenceCardLoaded}
          contentRef={contentRef}
        />
        <VStack
          alignItems="center"
          gap="2"
          visibility={pages.length > 1 ? "visible" : "hidden"}
        >
          <Box as="span" fontSize="xs" color="fg.muted">
            Page {currentPage} of {pages.length}
          </Box>
          <PaginationRoot
            siblingCount={0}
            count={pages.length * cardsPerPage}
            page={currentPage}
            pageSize={cardsPerPage}
            onPageChange={({ page }) => changePage(page)}
          >
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </PaginationRoot>
        </VStack>
      </HStack>
      <ImageErrors
        onDismiss={onClearErrors}
        imagesWithError={imagesWithError}
      />
      <SelectionActionBar currentPage={currentPage} />
    </VStack>
  );
};
