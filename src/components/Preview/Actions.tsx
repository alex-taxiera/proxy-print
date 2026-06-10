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
import { useContext, useId } from "react";
import {
  LuDownload,
  LuExpand,
  LuImageDown,
  LuImageUpscale,
  LuShrink,
  LuTrash,
  LuUndo,
  LuEllipsis,
  LuCheck,
  LuMove,
  LuPlus,
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
import { DialogTrigger } from "../ui/dialog";
import { AddMoreDialog } from "./Card/AddMoreDialog";
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

  const addMoreTriggerId = useId();
  const moveTriggerId = useId();
  const moreActionsTriggerId = useId();

  const selectedImages = images.filter((image) =>
    selectedImageUuids.includes(image.uuid),
  );

  const {
    remove,
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
  } = useCardActions({
    images: selectedImages,
    currentPage,
  });

  const onMoveToPage = (details: MenuSelectionDetails) =>
    moveToPage(parseInt(details.value));

  return (
    <ActionBarRoot open={selectedImageUuids.length > 0}>
      <ActionBarContent>
        <ActionBarSelectionTrigger
          display={{ base: "none", sm: "inline-flex" }}
        >
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
          <AddMoreDialog add={addMore} ids={{ trigger: addMoreTriggerId }}>
            <Tooltip content="Add more" ids={{ trigger: addMoreTriggerId }}>
              <DialogTrigger asChild>
                <IconButton aria-label="Add more">
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
                  <IconButton aria-label="Move to page ...">
                    <LuMove />
                  </IconButton>
                </MenuTrigger>
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
          <MenuRoot ids={{ trigger: moreActionsTriggerId }}>
            <Tooltip
              content="More actions"
              ids={{ trigger: moreActionsTriggerId }}
            >
              <MenuTrigger asChild>
                <IconButton aria-label="More actions">
                  <LuEllipsis />
                </IconButton>
              </MenuTrigger>
            </Tooltip>
            <MenuContent>
              {canUpscale ? (
                <MenuItem value="upscale" onSelect={() => upscale()}>
                  <LuImageUpscale />
                  <MenuItemText>Upscale</MenuItemText>
                </MenuItem>
              ) : null}
              {canRemoveUpscale ? (
                <MenuItem
                  value="remove-upscale"
                  onSelect={() => removeUpscale()}
                >
                  <LuImageDown />
                  <MenuItemText>Remove Upscale</MenuItemText>
                </MenuItem>
              ) : null}
              {canAddBleed ? (
                <MenuItem value="add-bleed" onSelect={() => addBleed()}>
                  <LuExpand />
                  <MenuItemText>Add bleed</MenuItemText>
                </MenuItem>
              ) : null}
              {canRemoveBleed ? (
                <MenuItem value="remove-bleed" onSelect={() => removeBleed()}>
                  <LuShrink />
                  <MenuItemText>Remove bleed</MenuItemText>
                </MenuItem>
              ) : null}
              {canRevertToOriginal ? (
                <MenuItem
                  value="revert-to-original"
                  onSelect={() => revertToOriginal()}
                >
                  <LuUndo />
                  <MenuItemText>Revert to original</MenuItemText>
                </MenuItem>
              ) : null}
            </MenuContent>
          </MenuRoot>
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
