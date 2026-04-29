import { UseDialogContext } from "@ark-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { useContext } from "react";

import { css } from "styled-system/css";
import { hstack, vstack, visuallyHidden } from "styled-system/patterns";

import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";

import { ImagesContext } from "~/context/ImagesContext";
import { useGetCardsForDecklist } from "~/hooks/useGetCardsForDecklist";
import { getScryfallCardsCollectionQueryKey } from "~/queries/useScryfallCardsCollection";

import { UpscaleSetting } from "../UpscaleSetting";

export const DecklistForm = () => {
  const { onAdd, onAddSlots, onError } = useContext(ImagesContext);
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
              justifyContent: "space-between",
              width: "full",
            })}
          >
            <UpscaleSetting className={css({ flexDirection: "row-reverse" })}>
              Upscale Images
            </UpscaleSetting>
            <div
              className={hstack({
                gap: "2",
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
          </div>
        </form>
      )}
    </Dialog.Context>
  );
};
