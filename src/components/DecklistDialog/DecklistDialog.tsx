import { Button } from "@chakra-ui/react";
import { useIsMutating } from "@tanstack/react-query";

import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogContext,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

import { getScryfallCardsCollectionQueryKey } from "@/queries/useScryfallCardsCollection";

import { DecklistForm } from "./DecklistForm";

export type DecklistDialogProps = React.ComponentProps<typeof DialogRoot>;

const formId = "decklist-form";

export const DecklistDialog = ({ children, ...props }: DecklistDialogProps) => {
  const isMutating = useIsMutating({
    mutationKey: getScryfallCardsCollectionQueryKey(),
  });

  const isSubmitting = !!isMutating;

  return (
    <DialogRoot {...props}>
      {children}
      <DialogContent gap="4" alignItems="stretch">
        <DialogHeader>
          <DialogTitle>Decklist</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogContext>
            {(store) => (
              <DecklistForm formId={formId} key={String(store.open)} />
            )}
          </DialogContext>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button
            type="submit"
            form={formId}
            loading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit
          </Button>
        </DialogFooter>
        <DialogCloseTrigger aria-label="Close" />
      </DialogContent>
    </DialogRoot>
  );
};
