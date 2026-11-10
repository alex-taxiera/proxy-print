import {
  Button,
  createListCollection,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
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

import { GoogleImageData } from "@/context/ImagesContext";
import {
  checkMpcFillServer,
  getIsMpcFillCardDownloadable,
  getMpcFillThumbnailUris,
  MpcFillCard,
} from "@/queries/mpcfill/client";
import {
  formatMpcFillQuery,
  MpcFillCardType,
  normalizeMpcFillQuery,
  parseMpcFillQuery,
  stripImageExtension,
} from "@/queries/mpcfill/normalize-query";
import {
  MpcFillSearchParams,
  useMpcFillCards,
  useMpcFillSearch,
  useMpcFillSources,
} from "@/queries/useMpcFillSearch";
import { useSettingsStore } from "@/store/settingsStore";
import {
  DEFAULT_MPCFILL_SERVER_URL,
  normalizeMpcFillServerUrl,
} from "@/utils/mpcfill-server";
import { formatCount } from "@/utils/pluralize";

import { FallbackImage } from "./FallbackImage";

const ALL_SOURCES = "all";

const cardTypeCollection = createListCollection<{
  value: MpcFillCardType;
  label: string;
}>({
  items: [
    { value: "CARD", label: "Cards" },
    { value: "TOKEN", label: "Tokens" },
    { value: "CARDBACK", label: "Card backs" },
  ],
});

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getInitialSearch = (initialQuery: string) => {
  const { query, cardType } = parseMpcFillQuery(
    stripImageExtension(initialQuery),
  );
  return {
    text: query,
    params: {
      query: normalizeMpcFillQuery(query),
      cardType,
      fuzzySearch: false,
      sourceId: null,
    } satisfies MpcFillSearchParams,
  };
};

/** Shows which MPC Autofill backend is searched and lets the user change it. */
const MpcFillServerSettings = () => {
  const serverUrl = useSettingsStore((state) => state.mpcFillServerUrl);
  const setServerUrl = useSettingsStore((state) => state.setMpcFillServerUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(serverUrl);

  const {
    mutate: save,
    isPending,
    error,
    reset,
  } = useMutation({
    mutationFn: async (input: string) => {
      const url = normalizeMpcFillServerUrl(input);
      if (!url) {
        throw new Error("Enter an https address, like https://mpcfill.com.");
      }
      await checkMpcFillServer(url);
      return url;
    },
    onSuccess: (url) => {
      setServerUrl(url);
      setIsEditing(false);
    },
  });

  const stopEditing = () => {
    reset();
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <HStack justifyContent="space-between" gap="2">
        <Text fontSize="xs" color="fg.muted">
          Searching {new URL(serverUrl).host}
        </Text>
        <Button
          size="2xs"
          variant="ghost"
          onClick={() => {
            setDraft(serverUrl);
            setIsEditing(true);
          }}
        >
          Change server
        </Button>
      </HStack>
    );
  }

  return (
    <Stack asChild gap="2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          save(draft);
        }}
      >
        <Field
          label="MPC Autofill server"
          helperText="Any MPC Autofill backend. It is checked before it is saved."
          invalid={Boolean(error)}
          errorText={
            error ? getErrorMessage(error, "Couldn't use that server.") : null
          }
        >
          <Input
            size="sm"
            value={draft}
            placeholder={DEFAULT_MPCFILL_SERVER_URL}
            onChange={(event) => setDraft(event.target.value)}
          />
        </Field>
        <HStack gap="2">
          <Button type="submit" size="xs" loading={isPending}>
            Save
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setDraft(DEFAULT_MPCFILL_SERVER_URL);
              save(DEFAULT_MPCFILL_SERVER_URL);
            }}
          >
            Use mpcfill.com
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={isPending}
            onClick={stopEditing}
          >
            Cancel
          </Button>
        </HStack>
      </form>
    </Stack>
  );
};

export type MpcFillSwapDialogProps = {
  /** What to search for first: the card's name or its stored MPCFill query. */
  initialQuery: string;
  /** The Drive id of the image in the slot now, when it is an MPCFill one. */
  currentId: string | null;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (image: GoogleImageData) => Promise<void>;
};

/**
 * Searches an MPC Autofill backend for other art for a card and swaps the
 * chosen image in. Desktop only: see src/queries/mpcfill/client.ts.
 */
export const MpcFillSwapDialog = ({
  initialQuery,
  currentId,
  open,
  onOpenChange,
  onSelect,
}: MpcFillSwapDialogProps) => {
  const serverUrl = useSettingsStore((state) => state.mpcFillServerUrl);
  const initial = getInitialSearch(initialQuery);

  const [searchText, setSearchText] = useState(initial.text);
  const [params, setParams] = useState<MpcFillSearchParams>(initial.params);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: sources } = useMpcFillSources(serverUrl, open);
  const search = useMpcFillSearch(serverUrl, params, open);
  const identifiers = search.data ?? [];
  const cards = useMpcFillCards(serverUrl, identifiers);

  const sourceCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: ALL_SOURCES, label: "All sources" },
          ...(sources ?? []).map((source) => ({
            value: String(source.pk),
            label: source.name,
          })),
        ],
      }),
    [sources],
  );

  const results = cards.data?.pages.flat() ?? [];
  const error = search.error ?? cards.error;
  const isSearching = search.isLoading || (cards.isLoading && !cards.data);

  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open) {
      setSearchText(initial.text);
      setParams(initial.params);
      setSelectedId(null);
      setSelectionError(null);
    }
    onOpenChange(details);
  };

  const handleSelect = async (card: MpcFillCard) => {
    setSelectionError(null);
    setSelectedId(card.identifier);

    try {
      await onSelect({
        id: card.identifier,
        name: `${card.name}.${card.extension}`,
        query: formatMpcFillQuery(
          card.searchq || params.query,
          params.cardType,
        ),
      });
      handleOpenChange({ open: false });
    } catch (error) {
      setSelectionError(getErrorMessage(error, "Unable to swap in this art."));
      setSelectedId(null);
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={handleOpenChange}
      size="xl"
      scrollBehavior="inside"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap art (MPCFill)</DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <Stack gap="4">
            <HStack asChild alignItems="flex-end" gap="2">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const { query, cardType } = parseMpcFillQuery(searchText);
                  setSearchText(query);
                  setParams((current) => ({
                    ...current,
                    query: normalizeMpcFillQuery(query),
                    // A typed "t:" or "b:" prefix picks the card type.
                    cardType: cardType === "CARD" ? current.cardType : cardType,
                  }));
                }}
              >
                <Field label="Card name" flex="1">
                  <Input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </Field>
                <Button type="submit" variant="outline">
                  <LuSearch />
                  Search
                </Button>
              </form>
            </HStack>
            <Stack
              direction={{ base: "column", md: "row" }}
              alignItems={{ md: "flex-end" }}
              gap="3"
            >
              <SelectRoot
                collection={cardTypeCollection}
                value={[params.cardType]}
                onValueChange={(details) =>
                  setParams((current) => ({
                    ...current,
                    cardType: details.value[0] as MpcFillCardType,
                  }))
                }
              >
                <SelectLabel>Type</SelectLabel>
                <SelectControl>
                  <SelectTrigger>
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectIndicatorGroup />
                </SelectControl>
                <SelectContent>
                  {cardTypeCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <SelectRoot
                collection={sourceCollection}
                value={[
                  params.sourceId === null
                    ? ALL_SOURCES
                    : String(params.sourceId),
                ]}
                onValueChange={(details) =>
                  setParams((current) => ({
                    ...current,
                    sourceId:
                      details.value[0] === ALL_SOURCES
                        ? null
                        : Number(details.value[0]),
                  }))
                }
              >
                <SelectLabel>Source</SelectLabel>
                <SelectControl>
                  <SelectTrigger>
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectIndicatorGroup />
                </SelectControl>
                <SelectContent>
                  {sourceCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <Checkbox
                flexShrink={0}
                paddingBottom={{ md: "2" }}
                checked={params.fuzzySearch}
                onCheckedChange={(details) =>
                  setParams((current) => ({
                    ...current,
                    fuzzySearch: details.checked === true,
                  }))
                }
              >
                Loose match
              </Checkbox>
            </Stack>
            <MpcFillServerSettings />
            {selectionError ? (
              <Text color="fg.error">{selectionError}</Text>
            ) : null}
            {params.query.length === 0 ? (
              <Text color="fg.muted">Enter a card name to search for.</Text>
            ) : isSearching ? (
              <HStack justifyContent="center" paddingY="8">
                <Spinner size="lg" />
                <Text>Searching MPCFill...</Text>
              </HStack>
            ) : error ? (
              <Stack alignItems="flex-start" gap="2">
                <Text color="fg.error">
                  {getErrorMessage(error, "Unable to search MPCFill.")}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    void (search.error ? search.refetch() : cards.refetch())
                  }
                >
                  Try again
                </Button>
              </Stack>
            ) : identifiers.length === 0 ? (
              <Text color="fg.muted">
                No images found for &ldquo;{params.query}&rdquo;.
                {params.fuzzySearch
                  ? " Try a different name."
                  : " Try a loose match or a different name."}
              </Text>
            ) : (
              <>
                <Text fontSize="sm" color="fg.muted">
                  {formatCount(identifiers.length, "image")} found
                </Text>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap="3">
                  {results.map((card) => {
                    const isCurrent = card.identifier === currentId;
                    const isSelecting = selectedId === card.identifier;
                    const isDownloadable = getIsMpcFillCardDownloadable(card);

                    return (
                      <Button
                        key={card.identifier}
                        variant={isCurrent ? "solid" : "outline"}
                        colorPalette={isCurrent ? "accent" : undefined}
                        height="auto"
                        padding="1"
                        whiteSpace="normal"
                        disabled={
                          isCurrent || !isDownloadable || selectedId !== null
                        }
                        loading={isSelecting}
                        onClick={() => void handleSelect(card)}
                      >
                        <Stack gap="1" width="full">
                          <FallbackImage
                            uris={getMpcFillThumbnailUris(card)}
                            alt={`${card.name}, from ${card.sourceName}`}
                          />
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            lineClamp="2"
                          >
                            {card.name}
                          </Text>
                          <Text fontSize="xs" color="fg.muted" lineClamp="1">
                            {isDownloadable
                              ? [
                                  card.sourceName,
                                  card.dpi ? `${card.dpi} DPI` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")
                              : "Not on Google Drive"}
                          </Text>
                        </Stack>
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </>
            )}
          </Stack>
        </DialogBody>
        {cards.hasNextPage ? (
          <DialogFooter>
            <Button
              variant="outline"
              loading={cards.isFetchingNextPage}
              onClick={() => void cards.fetchNextPage()}
            >
              Load more
            </Button>
          </DialogFooter>
        ) : null}
        <DialogCloseTrigger aria-label="Close" />
      </DialogContent>
    </DialogRoot>
  );
};
