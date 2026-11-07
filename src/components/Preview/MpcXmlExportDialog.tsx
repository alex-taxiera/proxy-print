import { Button, Text, VStack } from "@chakra-ui/react";
import { useContext } from "react";

import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";

import { ImagesContext } from "@/context/ImagesContext";
import { useSettingsStore } from "@/store/settingsStore";
import { downloadBlob } from "@/utils/download-blob";
import { buildMpcFillXml } from "@/utils/mpcfill-xml";
import { formatCount } from "@/utils/pluralize";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const MpcXmlExportDialog = ({ open, onOpenChange }: Props) => {
  const { sortedSlots } = useContext(ImagesContext);
  const defaultCardBack = useSettingsStore((s) => s.defaultCardBack);
  const filename = useSettingsStore((s) => s.settings.filename);

  const result = (() => {
    if (!open) return null;
    try {
      return buildMpcFillXml(sortedSlots, defaultCardBack);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  })();

  const handleExport = () => {
    if (!result || "error" in result) return;
    downloadBlob(
      new Blob([result.xml], { type: "text/xml" }),
      `${filename || "cards"}.xml`,
    );
    toaster.create({
      type: "success",
      title: `Exported ${formatCount(result.exported, "card")} to MPCFill XML`,
    });
    onOpenChange(false);
  };

  const total = sortedSlots.filter((slot) => slot.front).length;

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export MPCFill XML</DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="3" alignItems="stretch" marginTop="2">
            {result && "error" in result ? (
              <Text color="fg.error">{result.error}</Text>
            ) : result ? (
              <>
                <Text>
                  {result.exported === total
                    ? `All ${formatCount(total, "card")} will be exported.`
                    : `${result.exported} of ${formatCount(total, "card")} will be exported.`}
                </Text>
                {result.skipped > 0 && (
                  <Text fontSize="sm" color="fg.muted">
                    {formatCount(result.skipped, "card")} skipped: only MPCFill
                    images can go in the XML, not uploaded images, Scryfall
                    cards or cards extracted from a PDF.
                  </Text>
                )}
                {result.skippedBacks > 0 && (
                  <Text fontSize="sm" color="fg.muted">
                    {formatCount(result.skippedBacks, "back")} left out for the
                    same reason.
                  </Text>
                )}
                <Text fontSize="sm" color="fg.muted">
                  The XML points at the original MPCFill images, so upscaling
                  and bleed edits aren&apos;t included.
                </Text>
              </>
            ) : null}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button
            disabled={!result || "error" in result || result.exported === 0}
            onClick={handleExport}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
