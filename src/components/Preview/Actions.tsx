import {
  Button,
  Spinner,
  IconButton,
  Link,
  MenuSelectionDetails,
  VisuallyHidden,
  createListCollection,
  HStack,
  VStack,
  Box,
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
  MenuItemGroup,
  MenuItemText,
  MenuRoot,
  MenuTriggerItem,
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
import { formatCount, formatSelectionCount } from "@/utils/pluralize";
import { progressEvents } from "@/utils/progress-events";

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

export const SelectionMenuContent = ({
  currentPage,
}: {
  currentPage: number;
}) => {
  const { images, isRendering } = useContext(ImagesContext);
  const { pages } = usePreviewData();
  const { selectedImageUuids } = useContext(ImageSelectionContext);
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
    <>
      <MenuItemGroup
        title={formatSelectionCount(selectedImageUuids.length, "card")}
      >
        <MenuItem
          value="clear-all"
          onSelect={() => remove()}
          disabled={isRendering}
          color="fg.error"
        >
          <LuTrash />
          <MenuItemText>Remove all</MenuItemText>
        </MenuItem>
        <MenuItem
          value="download-all"
          onSelect={() => downloadImages()}
          disabled={isLoadingImages || isDownloading}
        >
          {isDownloading ? <Spinner size="sm" mr="1px" /> : <LuDownload />}
          <MenuItemText>Download all (ZIP)</MenuItemText>
        </MenuItem>
        {canUpscale ? (
          <MenuItem value="upscale-all" onSelect={() => upscale()}>
            <LuImageUpscale />
            <MenuItemText>Upscale all</MenuItemText>
          </MenuItem>
        ) : null}
        {canRemoveUpscale ? (
          <MenuItem value="remove-upscale-all" onSelect={() => removeUpscale()}>
            <LuImageDown />
            <MenuItemText>Remove upscale from all</MenuItemText>
          </MenuItem>
        ) : null}
        {canAddBleed ? (
          <MenuItem value="add-bleed-all" onSelect={() => addBleed()}>
            <LuExpand />
            <MenuItemText>Add bleed to all</MenuItemText>
          </MenuItem>
        ) : null}
        {canRemoveBleed ? (
          <MenuItem value="remove-bleed-all" onSelect={() => removeBleed()}>
            <LuShrink />
            <MenuItemText>Remove bleed from all</MenuItemText>
          </MenuItem>
        ) : null}
        {canRevertToOriginal ? (
          <MenuItem value="revert-to-original-all" onSelect={revertToOriginal}>
            <LuUndo />
            <MenuItemText>Revert all to original</MenuItemText>
          </MenuItem>
        ) : null}
      </MenuItemGroup>
      <>
        {!canMoveToNextPage ? (
          <MenuItem onSelect={moveToNextPage} value="move-to-next-page-all">
            <LuArrowRight />
            <MenuItemText>Move all to next page</MenuItemText>
          </MenuItem>
        ) : null}
        {!canMoveToPreviousPage ? (
          <MenuItem
            onSelect={moveToPreviousPage}
            value="move-to-previous-page-all"
          >
            <LuArrowLeft />
            <MenuItemText>Move all to previous page</MenuItemText>
          </MenuItem>
        ) : null}
        {pages.length > 1 ? (
          <MenuRoot
            onSelect={onMoveToPage}
            positioning={{ gutter: 10, placement: "right-start" }}
          >
            <MenuTriggerItem
              value="move-to-page-all"
              startIcon={<LuEllipsis />}
            >
              <MenuItemText>Move all to ...</MenuItemText>
            </MenuTriggerItem>
            <MenuContent>
              {pages.map((_, index) => (
                <MenuItem
                  key={index}
                  disabled={index + 1 === currentPage}
                  value={`${(index + 1).toString()}-all`}
                >
                  Page {index + 1}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuRoot>
        ) : null}
      </>
    </>
  );
};

const SelectionActions = ({ currentPage }: { currentPage: number }) => {
  const { onSelectAllImages, selectedImageUuids } = useContext(
    ImageSelectionContext,
  );
  const selectedImageCount = selectedImageUuids.length;

  return (
    <HStack gap="2">
      <MenuRoot onSelect={() => onSelectAllImages(false)}>
        <MenuTrigger asChild>
          <Button colorPalette="gray" type="button">
            Actions
          </Button>
        </MenuTrigger>
        <MenuContent>
          <SelectionMenuContent currentPage={currentPage} />
        </MenuContent>
      </MenuRoot>
      <span>{formatCount(selectedImageCount, "card")} selected</span>
      <Link onClick={() => onSelectAllImages(false)}>Deselect all</Link>
    </HStack>
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
  const { selectedImageUuids } = useContext(ImageSelectionContext);

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
        backgroundColor={selectedImageUuids.length > 0 ? "bg.info" : "unset"}
      >
        {selectedImageUuids.length === 0 ? (
          <NoSelectionActions
            isReferenceCardLoaded={isReferenceCardLoaded}
            contentRef={contentRef}
          />
        ) : (
          <SelectionActions currentPage={currentPage} />
        )}
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
    </VStack>
  );
};
