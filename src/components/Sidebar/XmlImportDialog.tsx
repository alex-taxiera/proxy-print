import { Button, Box, VStack } from "@chakra-ui/react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog";

import { GoogleImageData, SlotInputData } from "@/context/ImagesContext";
import { formatCount } from "@/utils/pluralize";

export type XmlImportOptions = {
  updateDefaultCardBack: boolean;
};

export type XmlImportPending = {
  slotAdds: SlotInputData[];
  /** The card back parsed from the XML, null if the XML had none */
  xmlDefaultCardBack: GoogleImageData | null;
};

type Props = {
  pending: XmlImportPending | null;
  /** Whether a default card back is already configured */
  hasExistingCardBack: boolean;
  updateDefaultCardBack: boolean;
  onUpdateDefaultCardBackChange: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const XmlImportDialog = ({
  pending,
  hasExistingCardBack,
  updateDefaultCardBack,
  onUpdateDefaultCardBackChange,
  onConfirm,
  onCancel,
}: Props) => {
  const handleCheckedChange = (details: {
    checked: boolean | "indeterminate";
  }) => {
    onUpdateDefaultCardBackChange(details.checked === true);
  };

  return (
    <DialogRoot
      closeOnInteractOutside={false}
      closeOnEscape={false}
      open={pending !== null}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Cards from XML</DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" marginTop="2">
            <p>
              {pending
                ? `Found ${formatCount(pending.slotAdds.length, "card")} to import.`
                : ""}
            </p>
            {pending?.xmlDefaultCardBack && (
              <Checkbox
                checked={updateDefaultCardBack}
                onCheckedChange={handleCheckedChange}
              >
                Update default card back
                {hasExistingCardBack && (
                  <Box as="span" color="fg.muted">
                    (replaces existing)
                  </Box>
                )}
              </Checkbox>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={onConfirm}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
