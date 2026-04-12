import { useCallback } from "react";

import { hstack, vstack } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Dialog } from "~/components/ui/dialog";

import { GoogleImageData, SlotInputData } from "~/context/ImagesContext";
import { formatCount } from "~/utils/pluralize";

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
  const handleCheckedChange = useCallback(
    (details: { checked: boolean | "indeterminate" }) => {
      onUpdateDefaultCardBackChange(details.checked === true);
    },
    [onUpdateDefaultCardBackChange],
  );

  return (
    <Dialog.Root
     closeOnInteractOutside={false}
     closeOnEscape={false}
      open={pending !== null}
      onOpenChange={(details) => {
        if (!details.open) onCancel();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Title>Import Cards from XML</Dialog.Title>
          <Dialog.Description asChild>
            <div className={vstack({ gap: "4", alignItems: "stretch", mt: "2" })}>
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
                    <span
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.6,
                        marginLeft: "0.25rem",
                      }}
                    >
                      (replaces existing)
                    </span>
                  )}
                </Checkbox>
              )}
              <div className={hstack({ gap: "2", justifyContent: "flex-end" })}>
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button onClick={onConfirm}>Import</Button>
              </div>
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
