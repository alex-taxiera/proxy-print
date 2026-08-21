import {
  Box,
  Button,
  Center,
  createListCollection,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { ScryfallCard } from "@scryfall/api-types";
import { useMemo, useState } from "react";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { ScryfallImageData } from "@/context/ImagesContext";
import { getScryfallUris } from "@/queries/images";
import { useScryfallPrintings } from "@/queries/useScryfallPrintings";
import { useSettingsStore } from "@/store/settingsStore";
import {
  SCRYFALL_LANGUAGES,
  ScryfallLanguageFilter,
} from "@/utils/scryfall-languages";

type PrintingImages = {
  front: ScryfallImageData & { previewUri: string };
  back: ScryfallImageData | null;
};

const languageFilterCollection = createListCollection({
  items: [{ value: "all", label: "All languages" }, ...SCRYFALL_LANGUAGES],
});

const getPrintingImages = (card: ScryfallCard.Any): PrintingImages | null => {
  if ("image_uris" in card && card.image_uris?.png) {
    return {
      front: {
        uri: card.image_uris.png,
        name: card.name,
        previewUri:
          (card.image_uris as Record<string, string>).grid ??
          card.image_uris.png,
      },
      back: null,
    };
  }

  if ("card_faces" in card) {
    const [frontFace, backFace] = card.card_faces;
    const front =
      frontFace && "image_uris" in frontFace && frontFace.image_uris?.png
        ? {
            uri: frontFace.image_uris.png,
            name: frontFace.name,
            previewUri:
              (frontFace.image_uris as Record<string, string>).grid ??
              frontFace.image_uris.png,
          }
        : null;
    const back =
      backFace && "image_uris" in backFace && backFace.image_uris?.png
        ? { uri: backFace.image_uris.png, name: backFace.name }
        : null;

    return front
      ? {
          front,
          back,
        }
      : null;
  }

  return null;
};

const getLanguageLabel = (language: string) =>
  SCRYFALL_LANGUAGES.find((option) => option.value === language)?.label ??
  language;
const getLanguageFilterLabel = (language: ScryfallLanguageFilter) =>
  language === "all" ? "any language" : getLanguageLabel(language);

const ScryfallPrintingImage = ({ uri, alt }: { uri: string; alt: string }) => {
  const [uriIndex, setUriIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const uris = getScryfallUris(uri);

  const handleError = () => {
    if (uriIndex < uris.length - 1) {
      setUriIndex((index) => index + 1);
      return;
    }

    setIsLoading(false);
    setHasFailed(true);
  };

  return (
    <Box
      position="relative"
      borderRadius="lg"
      width="full"
      aspectRatio="0.714"
      overflow="hidden"
      bg="bg.subtle"
    >
      {hasFailed ? (
        <Center height="full" padding="2">
          <Text fontSize="xs" color="fg.error">
            Image unavailable
          </Text>
        </Center>
      ) : (
        <Image
          src={uris[uriIndex]}
          alt={alt}
          width="full"
          height="full"
          objectFit="cover"
          opacity={isLoading ? 0 : 1}
          transition="opacity 0.2s ease-in-out"
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
      )}
      {isLoading && !hasFailed ? (
        <Center position="absolute" inset="0">
          <Spinner size="sm" color="accent.solid" />
        </Center>
      ) : null}
    </Box>
  );
};

export type ChangePrintDialogProps = {
  cardName: string;
  currentUri: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (printing: PrintingImages) => Promise<void>;
};

export const ChangePrintDialog = ({
  cardName,
  currentUri,
  open,
  onOpenChange,
  onSelect,
}: ChangePrintDialogProps) => {
  const defaultImportLanguage = useSettingsStore(
    (state) => state.settings.defaultImportLanguage,
  );
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useScryfallPrintings(cardName);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<ScryfallLanguageFilter>(
    defaultImportLanguage,
  );

  const allPrintings = useMemo(
    () =>
      data?.pages
        .map((page) => page.data)
        .flat()
        .map((card) => ({ card, images: getPrintingImages(card) }))
        .filter(
          (
            printing,
          ): printing is {
            card: ScryfallCard.Any;
            images: PrintingImages;
          } => printing.images !== null,
        ) ?? [],
    [data],
  );
  const printings =
    languageFilter === "all"
      ? allPrintings
      : allPrintings.filter(({ card }) => card.lang === languageFilter);

  const handleSelect = async (printing: PrintingImages) => {
    setSelectionError(null);
    setSelectedUri(printing.front.uri);

    try {
      await onSelect(printing);
      handleOpenChange({ open: false });
    } catch (error) {
      setSelectionError(
        error instanceof Error
          ? error.message
          : "Unable to replace this card printing.",
      );
      setSelectedUri(null);
    }
  };

  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open) {
      setSelectedUri(null);
      setSelectionError(null);
      setLanguageFilter(defaultImportLanguage);
    }
    onOpenChange(details);
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={handleOpenChange}
      size={{ base: "full", md: "xl" }}
      scrollBehavior="inside"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change print: {cardName}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <HStack justifyContent="center" paddingY="8">
              <Spinner size="lg" />
              <Text>Loading printings...</Text>
            </HStack>
          ) : error ? (
            <Text color="fg.error">
              {error instanceof Error
                ? error.message
                : "Unable to load card printings."}
            </Text>
          ) : (
            <Stack gap="4">
              {selectionError ? (
                <Text color="fg.error">{selectionError}</Text>
              ) : null}
              <SelectRoot
                collection={languageFilterCollection}
                value={[languageFilter]}
                onValueChange={(details) =>
                  setLanguageFilter(details.value[0] as ScryfallLanguageFilter)
                }
              >
                <SelectLabel>Language</SelectLabel>
                <SelectControl>
                  <SelectTrigger>
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectIndicatorGroup />
                </SelectControl>
                <SelectContent>
                  {languageFilterCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap="3">
                {printings.map(({ card, images }) => {
                  const isCurrent = images.front.uri === currentUri;
                  const isSelecting = selectedUri === images.front.uri;

                  return (
                    <Button
                      key={card.id}
                      variant={isCurrent ? "solid" : "outline"}
                      colorPalette={isCurrent ? "accent" : undefined}
                      height="auto"
                      padding="1"
                      whiteSpace="normal"
                      disabled={isCurrent || selectedUri !== null}
                      loading={isSelecting}
                      onClick={() => void handleSelect(images)}
                    >
                      <Stack gap="1" width="full">
                        <ScryfallPrintingImage
                          key={images.front.previewUri}
                          uri={images.front.previewUri}
                          alt={`${card.name}, ${card.set.toUpperCase()} ${card.collector_number}`}
                        />
                        <Text fontSize="xs" fontWeight="semibold">
                          {card.set.toUpperCase()} #{card.collector_number}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {getLanguageLabel(card.lang)}
                        </Text>
                      </Stack>
                    </Button>
                  );
                })}
              </SimpleGrid>
              {printings.length === 0 ? (
                <Text color="fg.muted">
                  No printings are available in{" "}
                  {getLanguageFilterLabel(languageFilter)}.
                </Text>
              ) : null}
            </Stack>
          )}
        </DialogBody>
        <DialogFooter>
          {hasNextPage ? (
            <Button
              variant="outline"
              loading={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              Load more
            </Button>
          ) : null}
        </DialogFooter>
        <DialogCloseTrigger aria-label="Close" />
      </DialogContent>
    </DialogRoot>
  );
};
