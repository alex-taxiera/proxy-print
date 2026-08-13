import { Button, Text } from "@chakra-ui/react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

import { formatCount, pluralize } from "@/utils/pluralize";

export interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many of the cards being downloaded have a paired back image. */
  pairedBackCount: number;
  onConfirm: (includeBacks: boolean) => void;
}

export const DownloadDialog = ({
  open,
  onOpenChange,
  pairedBackCount,
  onConfirm,
}: DownloadDialogProps) => {
  const [includeBacks, setIncludeBacks] = useState(true);

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download images</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Checkbox
            checked={includeBacks}
            onCheckedChange={(details) => setIncludeBacks(!!details.checked)}
          >
            Include card backs
          </Checkbox>
          <Text fontSize="sm" color="fg.muted" marginTop="2">
            {formatCount(pairedBackCount, "card")}{" "}
            {pluralize(pairedBackCount, "has", "have")} a paired back image.
            Unchecking downloads fronts only.
          </Text>
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={() => {
              onConfirm(includeBacks);
              onOpenChange(false);
            }}
          >
            Download
          </Button>
        </DialogFooter>
        <DialogCloseTrigger aria-label="Close" />
      </DialogContent>
    </DialogRoot>
  );
};
