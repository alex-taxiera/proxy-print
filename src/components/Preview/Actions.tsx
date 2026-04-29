import { MenuSelectionDetails, Portal } from "@ark-ui/react";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCompress,
  faDownload,
  faEllipsisV,
  faExpand,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faRotateLeft,
  faTrash,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";

import { css } from "styled-system/css";
import { VisuallyHidden } from "styled-system/jsx";
import { hstack, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import { Link } from "~/components/ui/link";
import { Menu } from "~/components/ui/menu";
import { Pagination } from "~/components/ui/pagination";
import { createListCollection, Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Tooltip } from "~/components/ui/tooltip";

import { ImageErrors } from "~/components/ImageErrors";

import { ImageSelectionContext } from "~/context/ImageSelectionContext";
import { ImagesContext } from "~/context/ImagesContext";
import { PrintMode } from "~/context/SettingsContext";
import { useGeneratePdf } from "~/hooks/useGeneratePdf";
import { usePreviewData } from "~/hooks/usePreviewData";
import { useDownloadProgressStore } from "~/store/downloadProgressStore";
import { useSettingsStore } from "~/store/settingsStore";
import { formatCount, formatSelectionCount } from "~/utils/pluralize";
import { progressEvents } from "~/utils/progress-events";

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
    <Select.Root
      collection={printModeCollection}
      value={[printMode]}
      onValueChange={handleChange}
      size="md"
      width="44"
    >
      <Select.Label asChild>
        <VisuallyHidden>Card Size</VisuallyHidden>
      </Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
          <Select.Indicator asChild>
            <Select.IndicatorIcon />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            <Select.List>
              {printModeCollection.items.map((opt) => (
                <Select.Item key={opt.value} item={opt}>
                  <Select.ItemText>{opt.label}</Select.ItemText>
                  <Select.ItemIndicator asChild>
                    <Select.ItemIndicatorIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
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
    <div className={hstack({ gap: "2", flexWrap: "wrap" })}>
      <PrintModeToggle />
      <Tooltip.Root
        disabled={!isRendering && !isLoadingImages && isReferenceCardLoaded}
        positioning={{
          placement: "top",
        }}
      >
        <Tooltip.Trigger asChild>
          <Button
            disabled={isRendering || isLoadingImages || !isReferenceCardLoaded}
            onClick={() => handleSave()}
          >
            Generate PDF
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Arrow>
            <Tooltip.ArrowTip />
          </Tooltip.Arrow>
          <Tooltip.Content>
            {isRendering
              ? "Generating PDF..."
              : isLoadingImages
                ? "Downloading images..."
                : !isReferenceCardLoaded
                  ? "Loading images..."
                  : ""}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="outline"
            colorPalette="gray"
            aria-label="Actions"
            type="button"
          >
            <FontAwesomeIcon icon={faEllipsisV} size="lg" />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item
                  value="select-all"
                  onSelect={() => onSelectAllImages(true)}
                >
                  <Menu.ItemIndicator>
                    <FontAwesomeIcon icon={faCheck} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Select all</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="remove-all"
                  onSelect={() => remove()}
                  disabled={isRendering}
                  color="fg.error"
                >
                  <Menu.ItemIndicator color="fg.error">
                    <FontAwesomeIcon icon={faTrash} />
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Remove all</Menu.ItemText>
                </Menu.Item>
                <Menu.Item
                  value="downloadZip"
                  onSelect={() => downloadImages()}
                  disabled={isLoadingImages || isDownloading}
                >
                  <Menu.ItemIndicator>
                    {isDownloading ? (
                      <Spinner size="sm" mr="1px" />
                    ) : (
                      <FontAwesomeIcon icon={faDownload} />
                    )}
                  </Menu.ItemIndicator>
                  <Menu.ItemText>Download all (ZIP)</Menu.ItemText>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
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
      <Menu.ItemGroup>
        <Menu.ItemGroupLabel>
          {formatSelectionCount(selectedImageUuids.length, "card")}
        </Menu.ItemGroupLabel>
        <Menu.Item
          value="clear-all"
          onSelect={() => remove()}
          disabled={isRendering}
          color="fg.error"
        >
          <Menu.ItemIndicator color="fg.error">
            <FontAwesomeIcon icon={faTrash} />
          </Menu.ItemIndicator>
          <Menu.ItemText>Remove all</Menu.ItemText>
        </Menu.Item>
        <Menu.Item
          value="download-all"
          onSelect={() => downloadImages()}
          disabled={isLoadingImages || isDownloading}
        >
          <Menu.ItemIndicator>
            {isDownloading ? (
              <Spinner size="sm" mr="1px" />
            ) : (
              <FontAwesomeIcon icon={faDownload} />
            )}
          </Menu.ItemIndicator>
          <Menu.ItemText>Download all (ZIP)</Menu.ItemText>
        </Menu.Item>
        {canUpscale ? (
          <Menu.Item value="upscale-all" onSelect={() => upscale()}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Upscale all</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {canRemoveUpscale ? (
          <Menu.Item value="remove-upscale-all" onSelect={() => removeUpscale()}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Remove upscale from all</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {canAddBleed ? (
          <Menu.Item value="add-bleed-all" onSelect={() => addBleed()}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faExpand} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Add bleed to all</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {canRemoveBleed ? (
          <Menu.Item value="remove-bleed-all" onSelect={() => removeBleed()}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faCompress} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Remove bleed from all</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {canRevertToOriginal ? (
          <Menu.Item value="revert-to-original-all" onSelect={revertToOriginal}>
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faUndo} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Revert all to original</Menu.ItemText>
          </Menu.Item>
        ) : null}
      </Menu.ItemGroup>
      <Menu.ItemGroup>
        {!canMoveToNextPage ? (
          <Menu.Item onSelect={moveToNextPage} value="move-to-next-page-all">
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faArrowRight} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Move all to next page</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {!canMoveToPreviousPage ? (
          <Menu.Item
            onSelect={moveToPreviousPage}
            value="move-to-previous-page-all"
          >
            <Menu.ItemIndicator>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Menu.ItemIndicator>
            <Menu.ItemText>Move all to previous page</Menu.ItemText>
          </Menu.Item>
        ) : null}
        {pages.length > 1 ? (
          <Menu.Root
            onSelect={onMoveToPage}
            positioning={{ gutter: 10, placement: "right-start" }}
          >
            <Menu.TriggerItem>
              <FontAwesomeIcon icon={faEllipsisV} />
              Move all to ...
            </Menu.TriggerItem>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {pages.map((_, index) => (
                    <Menu.Item
                      key={index}
                      disabled={index + 1 === currentPage}
                      value={`${(index + 1).toString()}-all`}
                    >
                      Page {index + 1}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        ) : null}
      </Menu.ItemGroup>
    </>
  );
};

const SelectionActions = ({ currentPage }: { currentPage: number }) => {
  const { onSelectAllImages, selectedImageUuids } = useContext(
    ImageSelectionContext,
  );
  const selectedImageCount = selectedImageUuids.length;

  return (
    <div className={hstack({ gap: "2" })}>
      <Menu.Root onSelect={() => onSelectAllImages(false)}>
        <Menu.Trigger asChild>
          <Button colorPalette="gray" type="button">
            Actions
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <SelectionMenuContent currentPage={currentPage} />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
      <span>{formatCount(selectedImageCount, "card")} selected</span>
      <Link onClick={() => onSelectAllImages(false)}>Deselect all</Link>
    </div>
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
    <div
      className={vstack({
        gap: "2",
        width: "var(--page-width)",
        minWidth: "max",
        maxWidth: "full",
        alignItems: "stretch",
        position: "sticky",
        left: "0",
      })}
    >
      <div
        className={hstack({
          gap: "2",
          paddingLeft: "2",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "3",
          borderTopRadius: "md",
          backgroundColor: selectedImageUuids.length > 0 ? "bg.info" : "unset",
        })}
      >
        {selectedImageUuids.length === 0 ? (
          <NoSelectionActions
            isReferenceCardLoaded={isReferenceCardLoaded}
            contentRef={contentRef}
          />
        ) : (
          <SelectionActions currentPage={currentPage} />
        )}
        <div
          className={vstack({
            alignItems: "center",
            gap: "2",
            visibility: pages.length > 1 ? "visible" : "hidden",
          })}
        >
          <span className={css({ fontSize: "xs", color: "fg.muted" })}>
            Page {currentPage} of {pages.length}
          </span>
          <Pagination
            siblingCount={0}
            count={pages.length * cardsPerPage}
            page={currentPage}
            pageSize={cardsPerPage}
            onPageChange={({ page }) => changePage(page)}
          />
        </div>
      </div>
      <ImageErrors
        onDismiss={onClearErrors}
        imagesWithError={imagesWithError}
      />
    </div>
  );
};
