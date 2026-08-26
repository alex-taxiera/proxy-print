import {
  Button,
  createListCollection,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectControl,
  SelectIndicatorGroup,
  SelectIndicator,
} from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";

import { CUTTER_TYPE_OPTIONS, CutterType } from "@/context/CutterContext";
import { Unit } from "@/context/SettingsContext";
import { useSettingsFormState } from "@/hooks/useSettingsFormState";
import { useSettingsStore } from "@/store/settingsStore";
import { applyBasePdfPageSize } from "@/utils/basePdf";
import { generateSilhouetteBasePdf } from "@/utils/generateBasePdf";
import {
  SILHOUETTE_BORDERLESS_INSET_MM,
  SILHOUETTE_DEFAULT_LENGTH_MM,
  SILHOUETTE_DEFAULT_THICKNESS_MM,
  SILHOUETTE_INSET_MM,
  SILHOUETTE_MAX_LENGTH_MM,
  SILHOUETTE_MAX_THICKNESS_MM,
  SILHOUETTE_MIN_LENGTH_MM,
  SILHOUETTE_MIN_THICKNESS_MM,
} from "@/workers/silhouette-spec";

import { PageSizeFields } from "./PageSizeFields";

const cutterTypeCollection = createListCollection({
  items: CUTTER_TYPE_OPTIONS,
});

// The paper must be offset on the mat and reported as larger to the cutter
// software so its registration sensor can find marks placed inside the
// (undersized, borderless) sheet. This is independent of the mark inset.
const BORDERLESS_PAPER_OFFSET_MM = 6.5;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateBasePdfDialog = ({ open, onOpenChange }: Props) => {
  const { formState, handle } = useSettingsFormState();
  const addBasePdf = useSettingsStore((s) => s.addBasePdf);

  const [name, setName] = useState("Silhouette Base PDF");
  const [cutterType, setCutterType] = useState<CutterType>("silhouette");
  const [pageSize, setPageSize] = useState<{
    pageWidth: string;
    pageHeight: string;
    unit: Unit;
  }>({
    pageWidth: formState.pageWidth,
    pageHeight: formState.pageHeight,
    unit: formState.unit,
  });
  const [length, setLength] = useState(SILHOUETTE_DEFAULT_LENGTH_MM.toString());
  const [thickness, setThickness] = useState(
    SILHOUETTE_DEFAULT_THICKNESS_MM.toString(),
  );
  const [borderless, setBorderless] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPageSize({
        pageWidth: formState.pageWidth,
        pageHeight: formState.pageHeight,
        unit: formState.unit,
      });
    }
    onOpenChange(nextOpen);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const bytes = await generateSilhouetteBasePdf({
        pageWidth: Number(pageSize.pageWidth),
        pageHeight: Number(pageSize.pageHeight),
        unit: pageSize.unit,
        length: Number(length),
        thickness: Number(thickness),
        borderless,
      });

      addBasePdf({
        name: name.trim() || "Silhouette Base PDF",
        bytes,
        pageCount: 1,
      });
      await applyBasePdfPageSize(bytes, formState.unit, handle);

      toaster.create({ type: "success", title: "Base PDF created" });
      onOpenChange(false);
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Failed to create base PDF",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      scrollBehavior="inside"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Base PDF</DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" padding="2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Cutter Type">
              <SelectRoot
                collection={cutterTypeCollection}
                value={[cutterType]}
                onValueChange={(details) =>
                  setCutterType(details.value[0] as CutterType)
                }
              >
                <SelectControl>
                  <SelectTrigger>
                    <SelectValueText />
                  </SelectTrigger>
                  <SelectIndicatorGroup>
                    <SelectIndicator />
                  </SelectIndicatorGroup>
                </SelectControl>
                <SelectContent>
                  {cutterTypeCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Field>

            <PageSizeFields
              value={pageSize}
              onChange={(next) => setPageSize((prev) => ({ ...prev, ...next }))}
            />

            {cutterType === "silhouette" && (
              <>
                <Field label="Mark Length (mm)">
                  <NumberInputRoot
                    min={SILHOUETTE_MIN_LENGTH_MM}
                    max={SILHOUETTE_MAX_LENGTH_MM}
                    value={length}
                    onValueChange={(details) => setLength(details.value)}
                  >
                    <NumberInputField />
                  </NumberInputRoot>
                </Field>
                <Field label="Mark Thickness (mm)">
                  <NumberInputRoot
                    min={SILHOUETTE_MIN_THICKNESS_MM}
                    max={SILHOUETTE_MAX_THICKNESS_MM}
                    step={0.1}
                    value={thickness}
                    onValueChange={(details) => setThickness(details.value)}
                  >
                    <NumberInputField />
                  </NumberInputRoot>
                </Field>
              </>
            )}

            {cutterType === "silhouette" && (
              <Field>
                <Checkbox
                  checked={borderless}
                  onCheckedChange={(details) =>
                    setBorderless(details.checked === true)
                  }
                >
                  Borderless mode
                </Checkbox>
              </Field>
            )}

            {cutterType === "silhouette" && borderless ? (
              <Alert
                status="warning"
                variant="surface"
                title="Borderless mode requires extra setup"
              >
                <VStack align="stretch" gap="2">
                  <Text fontSize="sm">
                    Marks are drawn {SILHOUETTE_BORDERLESS_INSET_MM}mm from
                    the page edge instead of the usual {SILHOUETTE_INSET_MM}
                    mm. To use this template you must:
                  </Text>
                  <Text fontSize="sm">
                    1. Tell your cutter software the paper is{" "}
                    {BORDERLESS_PAPER_OFFSET_MM * 2}mm wider and{" "}
                    {BORDERLESS_PAPER_OFFSET_MM * 2}mm taller than it actually
                    is.
                  </Text>
                  <Text fontSize="sm">
                    2. Offset the paper on the cutting mat by{" "}
                    {BORDERLESS_PAPER_OFFSET_MM}mm from the mat&apos;s corner
                    in both directions. Covering the mat&apos;s
                    &quot;blank&quot; grid areas along the edges with extra
                    paper or tape helps the cutter&apos;s registration sensor
                    see a continuous surface, as if the paper extended past
                    where it actually ends.
                  </Text>
                </VStack>
              </Alert>
            ) : (
              <Text fontSize="sm" color="fg.muted">
                Marks are drawn {SILHOUETTE_INSET_MM}mm from the page edge —
                set your cutter&apos;s inset to {SILHOUETTE_INSET_MM}mm (the
                minimum) to match.
              </Text>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={() => void handleCreate()} loading={isCreating}>
            Create
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};
