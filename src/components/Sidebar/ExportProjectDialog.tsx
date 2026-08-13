import { Button, VStack, Text } from "@chakra-ui/react";
import { useState } from "react";

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

import { formatCount } from "@/utils/pluralize";

type Props = {
  /** Names of the project(s) pending export, null when the dialog is closed */
  pending: string[] | null;
  onConfirm: (includeSettings: boolean) => void;
  onCancel: () => void;
};

export const ExportProjectDialog = ({
  pending,
  onConfirm,
  onCancel,
}: Props) => {
  const [includeSettings, setIncludeSettings] = useState(false);

  return (
    <DialogRoot
      open={pending !== null}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Export {pending ? formatCount(pending.length, "Project") : ""}
          </DialogTitle>
        </DialogHeader>
        <DialogBody asChild>
          <VStack gap="4" alignItems="stretch" marginTop="2">
            <Text fontSize="sm" color="fg.muted">
              Card images are bundled into the file so it can be imported
              offline. Upscale and bleed-edge edits are baked in, but can no
              longer be reverted after import.
            </Text>
            <Checkbox
              checked={includeSettings}
              onCheckedChange={(details) =>
                setIncludeSettings(details.checked === true)
              }
            >
              Include current print settings
            </Checkbox>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button onClick={() => onConfirm(includeSettings)}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
