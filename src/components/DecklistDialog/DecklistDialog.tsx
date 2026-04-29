import { vstack } from "styled-system/patterns";

import { Dialog, type DialogType } from "~/components/ui/dialog";

import { DecklistForm } from "./DecklistForm";

export type DecklistDialogProps = DialogType.RootProps;

export const DecklistDialog = ({ children, ...props }: DecklistDialogProps) => {
  return (
    <Dialog.Root {...props}>
      {children}
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content className={vstack({ gap: "4", alignItems: "stretch" })}>
          <Dialog.Title>Decklist</Dialog.Title>
          <Dialog.Context>
            {(dialog) => (
              <Dialog.Description asChild>
                <DecklistForm key={String(dialog.open)} />
              </Dialog.Description>
            )}
          </Dialog.Context>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
