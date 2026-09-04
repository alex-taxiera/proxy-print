import {
  Box,
  Button,
  HStack,
  IconButton,
  Spinner,
  VisuallyHidden,
  createListCollection,
} from "@chakra-ui/react";
import { useContext } from "react";
import { LuCheck, LuDownload, LuEllipsis, LuTrash } from "react-icons/lu";

import {
  MenuContent,
  MenuItem,
  MenuItemText,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  SelectContent,
  SelectControl,
  SelectIndicatorGroup,
  SelectItem,
  SelectItemText,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

import { DownloadDialog } from "@/components/Preview/Card/DownloadDialog";
import { useCardActions } from "@/components/Preview/Card/useCardActions";
import { useDownloadPrompt } from "@/components/Preview/Card/useDownloadPrompt";

import { ImageSelectionContext } from "@/context/ImageSelectionContext";
import { ImagesContext } from "@/context/ImagesContext";
import { PreviewContext } from "@/context/PreviewContext";
import { PrintMode } from "@/context/SettingsContext";
import { useGeneratePdf } from "@/hooks/useGeneratePdf";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { useSettingsStore } from "@/store/settingsStore";
import { progressEvents } from "@/utils/progress-events";

const PRINT_MODE_OPTIONS: { value: PrintMode; label: string }[] = [
  { value: "duplex", label: "Duplex" },
  { value: "inline-faces", label: "Inline" },
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
      size={{ base: "xs", md: "md" }}
      width={{ base: "20", md: "44" }}
      flexShrink={0}
    >
      <SelectLabel asChild>
        <VisuallyHidden>Print Mode</VisuallyHidden>
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

export const PreviewActions = () => {
  const { isRendering, isLoadingProject, setIsRendering, images } =
    useContext(ImagesContext);
  const { isReferenceCardLoaded, contentRef } = useContext(PreviewContext);
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

  const { remove, isDownloading, downloadImages, pairedBackCount } =
    useCardActions({
      images,
      currentPage: 0,
    });

  const { isDialogOpen, setIsDialogOpen, requestDownload } = useDownloadPrompt(
    pairedBackCount,
    downloadImages,
  );

  return (
    <HStack gap={{ base: "1", md: "2" }} minWidth="0">
      <PrintModeToggle />
      <Tooltip
        disabled={
          !isRendering &&
          !isLoadingProject &&
          !isLoadingImages &&
          isReferenceCardLoaded
        }
        positioning={{
          placement: "top",
        }}
        content={
          isRendering
            ? "Generating PDF..."
            : isLoadingProject
              ? "Loading project..."
              : isLoadingImages
                ? "Downloading images..."
                : !isReferenceCardLoaded
                  ? "Loading images..."
                  : ""
        }
      >
        <Button
          size={{ base: "xs", md: "md" }}
          flexShrink={0}
          disabled={
            isRendering ||
            isLoadingProject ||
            isLoadingImages ||
            !isReferenceCardLoaded
          }
          onClick={() => handleSave()}
        >
          <Box as="span" hideBelow="sm">
            Generate PDF
          </Box>
          <Box as="span" hideFrom="sm">
            PDF
          </Box>
        </Button>
      </Tooltip>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton
            variant="outline"
            colorPalette="gray"
            aria-label="Actions"
            type="button"
            size={{ base: "xs", md: "md" }}
            flexShrink={0}
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
              disabled={isRendering || isLoadingProject}
              color="fg.error"
            >
              <LuTrash />
              <MenuItemText>Remove all</MenuItemText>
            </MenuItem>
            <MenuItem
              value="downloadZip"
              onSelect={() => requestDownload()}
              disabled={isLoadingImages || isLoadingProject || isDownloading}
            >
              {isDownloading ? <Spinner size="sm" mr="1px" /> : <LuDownload />}
              <MenuItemText>Download all (ZIP)</MenuItemText>
            </MenuItem>
          </>
        </MenuContent>
      </MenuRoot>
      <DownloadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        pairedBackCount={pairedBackCount}
        onConfirm={(includeBacks) => downloadImages({ includeBacks })}
      />
    </HStack>
  );
};
