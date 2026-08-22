import { Button, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import {
  NumberInputRoot,
  NumberInputField,
} from "@/components/ui/number-input";
import { toaster } from "@/components/ui/toaster";

import { useSettingsStore } from "@/store/settingsStore";
import { downloadBlob } from "@/utils/download-blob";
import { generateCutlineDxf } from "@/utils/generateCutlineDxf";

const DEFAULT_CORNER_RADIUS_MM = 2.5;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ExportCutlineDxfDialog = ({ open, onOpenChange }: Props) => {
  const settings = useSettingsStore((s) => s.settings);

  const [cornerRadius, setCornerRadius] = useState(
    DEFAULT_CORNER_RADIUS_MM.toString(),
  );
  const [isExporting, setIsExporting] = useState(false);

  const maxCornerRadius =
    Math.min(Number(settings.cardWidth), Number(settings.cardHeight)) / 2;

  const handleExport = () => {
    setIsExporting(true);
    try {
      const dxf = generateCutlineDxf({
        settings,
        cornerRadiusMm: Number(cornerRadius),
      });

      const blob = new Blob([dxf], { type: "application/dxf" });
      downloadBlob(blob, `${settings.filename}-cutlines.dxf`);

      toaster.create({ type: "success", title: "DXF exported" });
      onOpenChange(false);
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Failed to export DXF",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
    >
      <DialogContent>
        <DialogHeader flexDirection="column">
          <DialogTitle>Export DXF</DialogTitle>
          <Text fontSize="sm" color="fg.muted">
            Generates a cut template for use in your auto cutter software.
          </Text>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" marginTop="2">
            <Field label="Corner Radius (mm)">
              <NumberInputRoot
                min={0}
                max={maxCornerRadius}
                step={0.1}
                value={cornerRadius}
                onValueChange={(details) => setCornerRadius(details.value)}
              >
                <NumberInputField />
              </NumberInputRoot>
            </Field>

            <Text fontSize="sm" color="fg.muted">
              Card stock corner radii commonly range from 0 (square) to about
              3.5mm — adjust to match your cards.
            </Text>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" disabled={isExporting}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={handleExport} loading={isExporting}>
            Export
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};
