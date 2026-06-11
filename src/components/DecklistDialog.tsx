import { UseDialogContext } from "@ark-ui/react";
import {
  Button,
  ButtonGroup,
  VStack,
  VisuallyHidden,
  Textarea,
} from "@chakra-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { useContext } from "react";

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
import { Field, FieldLabel } from "@/components/ui/field";

import { ImagesContext } from "@/context/ImagesContext";
import { useGetCardsForDecklist } from "@/hooks/useGetCardsForDecklist";
import { getScryfallCardsCollectionQueryKey } from "@/queries/useScryfallCardsCollection";

import { UpscaleSetting } from "./UpscaleSetting";

export type DecklistDialogProps = React.ComponentProps<typeof DialogRoot>;

export const DecklistDialog = ({ children, ...props }: DecklistDialogProps) => {
  const { onAdd, onAddSlots, onError, isLoadingProject } = useContext(ImagesContext);
  const isMutating = useIsMutating({
    mutationKey: getScryfallCardsCollectionQueryKey(),
  });

  const getCardsForDecklist = useGetCardsForDecklist();

  const handleSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
    dialog: UseDialogContext,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const decklist = formData.get("decklist") as string;

    if (decklist) {
      const result = await getCardsForDecklist(decklist);

      if (result.slotItems.length > 0) {
        onAddSlots(result.slotItems);
      } else {
        onAdd(result.items);
      }
      result.errors.forEach(onError);
      dialog.setOpen(false);
    }
  };

  const isSubmitting = !!isMutating;

  return (
    <DialogRoot {...props}>
      {children}
      <DialogContext>
        {(store) => (
          <DialogContent asChild gap="4" alignItems="stretch">
            <form
              onSubmit={(event) => {
                void handleSubmit(event, store);
              }}
            >
              <DialogHeader>
                <DialogTitle>Decklist</DialogTitle>
              </DialogHeader>
              <DialogBody asChild>
                <VStack gap="4" width="full" alignItems="stretch">
                  <Field disabled={isSubmitting || isLoadingProject} required>
                    <VisuallyHidden asChild>
                      <FieldLabel>Decklist</FieldLabel>
                    </VisuallyHidden>
                    <Textarea
                      name="decklist"
                      rows={4}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder={`1 Black Lotus\n1 Llanowar Elves (FDN) 429\n1 Lava Spike (UMA)\n1 Lightning Bolt (SLP)`}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter justifyContent="space-between">
                <UpscaleSetting>Upscale Images</UpscaleSetting>
                <ButtonGroup>
                  <DialogActionTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogActionTrigger>
                  <Button
                    type="submit"
                    disabled={isLoadingProject}
                    loading={isSubmitting || isLoadingProject}
                    loadingText={isLoadingProject ? "Loading project..." : "Submitting..."}
                  >
                    Submit
                  </Button>
                </ButtonGroup>
              </DialogFooter>
              <DialogCloseTrigger aria-label="Close" />
            </form>
          </DialogContent>
        )}
      </DialogContext>
    </DialogRoot>
  );
};
