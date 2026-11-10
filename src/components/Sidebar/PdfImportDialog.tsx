import { Box, Button, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Radio, RadioGroup } from "@/components/ui/radio";

import type { SlotInputData } from "@/context/ImagesContext";
import { median } from "@/utils/pdf-import/card-geometry";
import {
  guessBackMode,
  pairPdfCards,
  type BackMode,
} from "@/utils/pdf-import/pair-pdf-cards";
import {
  backsideFileName,
  ppmCardSizeMm,
  ppmPairing,
  resolvePpmImport,
} from "@/utils/pdf-import/ppm-project";
import { resolveManifestImport } from "@/utils/pdf-import/read-pdf-metadata";
import type { ImportedImage, PdfExtraction } from "@/utils/pdf-import/types";
import { formatCount } from "@/utils/pluralize";

export type PdfImportResult = {
  fileName: string;
  slots: SlotInputData[];
  /** Set to make this the default card back. */
  defaultCardBack: ImportedImage | null;
};

type Props = {
  extraction: PdfExtraction | null;
  /** Changes for every PDF shown, so choices reset between files. */
  importKey: number;
  hasExistingCardBack: boolean;
  cardSizeMm: { w: number; h: number };
  onConfirm: (result: PdfImportResult) => void;
  onCancel: () => void;
};

const MAX_PREVIEWS = 60;

/** Shows a File as an image; the object URL lives exactly as long as it's shown. */
const FileImage = ({ file, alt }: { file: File; alt: string }) => {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <img
      ref={ref}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

type Preview = { front: File | string; back: File | string | null };

const Face = ({ source, label }: { source: File | string; label: string }) =>
  typeof source === "string" ? (
    <Box
      width="full"
      height="full"
      bg="bg.muted"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="1"
      fontSize="2xs"
      color="fg.muted"
      textAlign="center"
      overflow="hidden"
    >
      {source}
    </Box>
  ) : (
    <FileImage file={source} alt={label} />
  );

const PreviewGrid = ({ previews }: { previews: Preview[] }) => (
  <Stack gap="1">
    <SimpleGrid minChildWidth="64px" gap="2">
      {previews.slice(0, MAX_PREVIEWS).map((preview, i) => (
        <Box
          key={i}
          position="relative"
          aspectRatio={69 / 94}
          borderRadius="sm"
          overflow="hidden"
          borderWidth="1px"
        >
          <Face source={preview.front} label={`Card ${i + 1}`} />
          {preview.back && (
            <Box
              position="absolute"
              left="1"
              bottom="1"
              width="40%"
              aspectRatio={69 / 94}
              borderRadius="xs"
              overflow="hidden"
              borderWidth="2px"
              borderColor="bg"
              boxShadow="sm"
            >
              <Face source={preview.back} label={`Back of card ${i + 1}`} />
            </Box>
          )}
        </Box>
      ))}
    </SimpleGrid>
    {previews.length > MAX_PREVIEWS && (
      <Text fontSize="xs" color="fg.muted">
        and {previews.length - MAX_PREVIEWS} more
      </Text>
    )}
  </Stack>
);

const bleedSummary = (extraction: PdfExtraction): string | null => {
  const cards = extraction.pages
    .flatMap((page) => page.cards)
    .filter((card) => card.kind !== "asIs");
  if (cards.length === 0) return null;
  if (cards.every((card) => card.kind === "bare")) {
    return "The card images have no bleed, so 3 mm will be generated.";
  }
  const bleed = median(cards.map((card) => card.availableBleedMm));
  const action =
    bleed < 2.9 ? `, extended to 3 mm` : bleed > 3.1 ? `, trimmed to 3 mm` : "";
  return `Bleed in the card images: about ${bleed.toFixed(1)} mm${action}.`;
};

const warningsOf = (
  extraction: PdfExtraction,
  cardSizeMm: { w: number; h: number },
): string[] => {
  const { warnings } = extraction;
  const lines: string[] = [];
  if (warnings.sizeMismatch > 0 && warnings.mismatchSizeMm) {
    const { w, h } = warnings.mismatchSizeMm;
    lines.push(
      `${formatCount(warnings.sizeMismatch, "image")} didn't match your ${cardSizeMm.w}×${cardSizeMm.h} mm card size (they're about ${w.toFixed(0)}×${h.toFixed(0)} mm) and will be imported as-is.`,
    );
  }
  if (warnings.skewedSkipped > 0) {
    lines.push(
      `${formatCount(warnings.skewedSkipped, "image")} drawn at an angle were skipped.`,
    );
  }
  if (warnings.failed > 0) {
    lines.push(
      `${formatCount(warnings.failed, "image")} couldn't be read and were skipped.`,
    );
  }
  return lines;
};

const DefaultBackCheckbox = ({
  checked,
  onChange,
  hasExistingCardBack,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  hasExistingCardBack: boolean;
}) => (
  <Checkbox
    checked={checked}
    onCheckedChange={(details) => onChange(details.checked === true)}
  >
    Use as default card back
    {hasExistingCardBack && (
      <Box as="span" color="fg.muted">
        {" "}
        (replaces existing)
      </Box>
    )}
  </Checkbox>
);

const PdfImportBody = ({
  extraction,
  hasExistingCardBack,
  cardSizeMm,
  onConfirm,
}: Omit<Props, "extraction" | "onCancel" | "importKey"> & {
  extraction: PdfExtraction;
}) => {
  const [mode, setMode] = useState<BackMode>(() =>
    guessBackMode(extraction.pages),
  );
  const [useAsDefault, setUseAsDefault] = useState(!hasExistingCardBack);

  const restored = extraction.manifest
    ? resolveManifestImport(extraction, extraction.manifest)
    : null;

  if (restored) {
    const previews: Preview[] = restored.slots.map((slot) => ({
      front: slot.front
        ? "file" in slot.front
          ? slot.front.file
          : slot.front.name
        : "",
      back: slot.back
        ? "file" in slot.back
          ? slot.back.file
          : slot.back.name
        : null,
    }));
    const withBacks = restored.slots.filter((slot) => slot.back).length;

    return (
      <>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" marginTop="2">
            <Text>
              Made with proxy-print, so the layout is restored exactly:{" "}
              {formatCount(restored.slots.length, "card")}
              {withBacks > 0 ? `, ${withBacks} with backs` : ""}.
            </Text>
            {restored.remoteCount > 0 && (
              <Text fontSize="sm" color="fg.muted">
                {formatCount(restored.remoteCount, "image")} from MPCFill or
                Scryfall will be downloaded again at full quality.
              </Text>
            )}
            {restored.defaultCardBack && (
              <DefaultBackCheckbox
                checked={useAsDefault}
                onChange={setUseAsDefault}
                hasExistingCardBack={hasExistingCardBack}
              />
            )}
            <PreviewGrid previews={previews} />
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button
            onClick={() =>
              onConfirm({
                fileName: extraction.fileName,
                slots: restored.slots,
                defaultCardBack:
                  useAsDefault && restored.defaultCardBack
                    ? restored.defaultCardBack
                    : null,
              })
            }
          >
            Import
          </Button>
        </DialogFooter>
      </>
    );
  }

  // Proxy PDF Maker's embedded project says exactly which card (and back)
  // every image is, so no guessing is needed when it lines up.
  const ppm = extraction.ppm
    ? resolvePpmImport(
        extraction.ppm.project,
        extraction.pages,
        extraction.ppmBackside?.pages ?? null,
      )
    : null;
  const pairing =
    ppm && extraction.ppm
      ? ppmPairing(extraction.ppm.project, ppm)
      : pairPdfCards(extraction.pages, mode);
  const sharedAsDefault = pairing.sharedBack !== null && useAsDefault;
  const ppmSize = extraction.ppm ? ppmCardSizeMm(extraction.ppm.project) : null;
  const ppmSizeNote =
    ppmSize &&
    (Math.abs(ppmSize.w - cardSizeMm.w) > 0.5 ||
      Math.abs(ppmSize.h - cardSizeMm.h) > 0.5)
      ? `These are ${extraction.ppm?.project.card_size} cards (${ppmSize.w.toFixed(1)} × ${ppmSize.h.toFixed(1)} mm), but your card size is ${cardSizeMm.w} × ${cardSizeMm.h} mm. Change it in the sidebar so they print at the right size.`
      : null;
  const bleed = bleedSummary(extraction);
  const warnings = warningsOf(extraction, cardSizeMm);
  const pageCount = extraction.pages.length;

  const handleConfirm = () => {
    onConfirm({
      fileName: extraction.fileName,
      slots: sharedAsDefault
        ? pairing.slots.map((slot) => ({ ...slot, back: null }))
        : pairing.slots,
      defaultCardBack: sharedAsDefault ? pairing.sharedBack : null,
    });
  };

  return (
    <>
      <DialogBody asChild>
        <VStack gap="4" alignItems="stretch" marginTop="2">
          {extraction.fleemLinked > 0 && (
            <Text fontSize="sm">
              Made with Fleem Proxy Companion:{" "}
              {formatCount(extraction.fleemLinked, "image")} linked to their
              MPCFill art, which will be downloaded at full quality.
            </Text>
          )}
          {ppm ? (
            <Stack gap="1">
              <Text>
                Made with Proxy PDF Maker, so each card and its back are read
                from the project saved in the PDF.
              </Text>
              {extraction.ppmBackside && (
                <Text fontSize="sm" color="fg.muted">
                  Backs come from {extraction.ppmBackside.fileName}.
                </Text>
              )}
              {ppmSizeNote && (
                <Text fontSize="sm" color="fg.warning">
                  {ppmSizeNote}
                </Text>
              )}
              {ppm.backsMissing && (
                <Text fontSize="sm" color="fg.warning">
                  The backs were saved to a separate file (
                  {backsideFileName(extraction.fileName)}). Import both PDFs
                  together to pair them.
                </Text>
              )}
            </Stack>
          ) : (
            <Stack gap="2">
              <Text fontWeight="medium">Does this PDF include card backs?</Text>
              <RadioGroup
                value={mode}
                onValueChange={(details) => setMode(details.value as BackMode)}
              >
                <Stack gap="2">
                  <Radio value="none">No, every page is fronts</Radio>
                  <Radio value="duplex" disabled={pageCount < 2}>
                    Yes, every other page is backs (duplex)
                  </Radio>
                  <Radio value="shared-back" disabled={pageCount < 2}>
                    Yes, the last page is one back for every card
                  </Radio>
                </Stack>
              </RadioGroup>
            </Stack>
          )}
          <Stack gap="1">
            <Text>
              {formatCount(pairing.slots.length, "card")} on{" "}
              {formatCount(pageCount, "page")}
              {pairing.withBacks > 0 ? `, ${pairing.withBacks} with backs` : ""}
              .
            </Text>
            {pairing.unmatchedBacks > 0 && (
              <Text fontSize="sm" color="fg.warning">
                {formatCount(pairing.unmatchedBacks, "back")} couldn&apos;t be
                matched to a front and will be left out.
              </Text>
            )}
            {bleed && (
              <Text fontSize="sm" color="fg.muted">
                {bleed}
              </Text>
            )}
            {warnings.map((warning) => (
              <Text key={warning} fontSize="sm" color="fg.warning">
                {warning}
              </Text>
            ))}
          </Stack>
          {pairing.sharedBack && (
            <DefaultBackCheckbox
              checked={useAsDefault}
              onChange={setUseAsDefault}
              hasExistingCardBack={hasExistingCardBack}
            />
          )}
          <PreviewGrid
            previews={pairing.previews.map((preview) => ({
              front: preview.front,
              back: sharedAsDefault ? null : preview.back,
            }))}
          />
        </VStack>
      </DialogBody>
      <DialogFooter>
        <DialogActionTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </DialogActionTrigger>
        <Button disabled={pairing.slots.length === 0} onClick={handleConfirm}>
          Import {formatCount(pairing.slots.length, "card")}
        </Button>
      </DialogFooter>
    </>
  );
};

export const PdfImportDialog = ({
  extraction,
  importKey,
  onCancel,
  ...rest
}: Props) => (
  <DialogRoot
    size="lg"
    closeOnInteractOutside={false}
    open={extraction !== null}
    onOpenChange={(details) => {
      if (!details.open) onCancel();
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Import cards from {extraction?.fileName ?? "PDF"}
        </DialogTitle>
      </DialogHeader>
      {extraction && (
        // Keyed so the choices reset for each PDF in a multi-file drop.
        <PdfImportBody key={importKey} extraction={extraction} {...rest} />
      )}
    </DialogContent>
  </DialogRoot>
);
