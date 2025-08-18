import { vstack } from "styled-system/patterns";

import { Dialog, type DialogType } from "../ui/dialog";

const { DecklistForm } = await import("./DecklistForm");

export type DecklistDialogProps = DialogType.RootProps;

export const DecklistDialog = ({ children, ...props }: DecklistDialogProps) => {
  return (
    <Dialog.Root {...props}>
      {children}
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content className={vstack({ gap: "4", alignItems: "stretch" })}>
          <Dialog.Title>Decklist</Dialog.Title>
          <Dialog.Description asChild>
            <DecklistForm />
          </Dialog.Description>
          <Dialog.CloseButton aria-label="Close" />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
