import { UseDialogContext } from "@ark-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { useCallback, useContext } from "react";

import { hstack, vstack, visuallyHidden } from "styled-system/patterns";

import { ImagesContext } from "../../context/ImagesContext";
import { useGetCardsForDecklist } from "../../hooks/useGetCardsForDecklist";
import { getScryfallCardsCollectionQueryKey } from "../../queries/useScryfallCardsCollection";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";

export const DecklistForm = () => {
  const { onAdd, onError } = useContext(ImagesContext);
  const isMutating = useIsMutating({
    mutationKey: getScryfallCardsCollectionQueryKey(),
  });

  const getCardsForDecklist = useGetCardsForDecklist();

  const handleSubmit = useCallback(
    async (
      event: React.FormEvent<HTMLFormElement>,
      dialog: UseDialogContext,
    ) => {
      event.preventDefault();
      const formData = new FormData(event.target as HTMLFormElement);
      const decklist = formData.get("decklist") as string;

      const form = event.target as HTMLFormElement;

      if (decklist) {
        const result = await getCardsForDecklist(decklist);

        onAdd(result.items);
        result.errors.forEach(onError);
        form.reset();
        dialog.setOpen(false);
      }
    },
    [onAdd, onError, getCardsForDecklist],
  );

  const isSubmitting = !!isMutating;

  return (
    <Dialog.Context>
      {(dialog) => (
        <form
          onSubmit={(event) => {
            void handleSubmit(event, dialog);
          }}
          className={vstack({ gap: "4", width: "full", alignItems: "stretch" })}
        >
          <Field.Root disabled={isSubmitting} required>
            <Field.Label className={visuallyHidden()}>Decklist</Field.Label>
            <Field.Textarea
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
          </Field.Root>
          <div
            className={hstack({
              gap: "2",
              justifyContent: "flex-end",
              width: "full",
            })}
          >
            <Dialog.CloseTrigger asChild>
              <Button variant="outline" colorPalette="gray">
                Cancel
              </Button>
            </Dialog.CloseTrigger>
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Submitting..."
            >
              Submit
            </Button>
          </div>
        </form>
      )}
    </Dialog.Context>
  );
};
