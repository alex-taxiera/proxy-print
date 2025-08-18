import { UseDialogContext } from "@ark-ui/react";
import { ScryfallCard } from "@scryfall/api-types";
import { useIsMutating } from "@tanstack/react-query";
import { useCallback, useContext } from "react";

import { hstack, vstack, visuallyHidden } from "styled-system/patterns";

import { ImagesContext, ScryfallImageData } from "../../context/ImagesContext";
import {
  getScryfallCardsCollectionQueryKey,
  useScryfallCardsCollection,
} from "../../queries/useScryfallCardsCollection";
import { parseDecklist } from "../../utils/parseDecklist";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";

export const DecklistForm = () => {
  const { onAdd } = useContext(ImagesContext);
  const { mutateAsync: getCards } = useScryfallCardsCollection();
  const isMutating = useIsMutating({
    mutationKey: getScryfallCardsCollectionQueryKey(),
  });

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
        const parsed = parseDecklist(decklist);

        // Log any parsing errors
        if (parsed.errors.length > 0) {
          console.warn("Parsing errors:", parsed.errors);
        }

        const identifiers = parsed.cards.map((card) => ({
          name: card.name,
          set: card.setCode,
          collector_number: card.cardNumber,
        }));

        // split cards into chunks of 75 cards
        const chunks = [];
        for (let i = 0; i < identifiers.length; i += 75) {
          chunks.push(identifiers.slice(i, i + 75));
        }

        const maps = await Promise.all(chunks.map((chunk) => getCards(chunk)));

        const cards = new Map(maps.flatMap(Array.from));

        // duplicate entries that have more than one quantity
        const fullList: ScryfallCard.Any[] = [];
        for (let i = 0; i < identifiers.length; i++) {
          const card = cards.get(identifiers[i]);
          if (card) {
            fullList.push(
              ...Array.from({ length: parsed.cards[i].quantity }, () => card),
            );
          }
        }

        const items = fullList
          .flatMap((card) => {
            if ("image_uris" in card) {
              return {
                uri: card?.image_uris?.png,
                name: card?.name,
              };
            } else if ("card_faces" in card) {
              return card.card_faces.map((face) => {
                if ("image_uris" in face) {
                  return {
                    uri: face.image_uris?.png,
                    name: face.name,
                  };
                }
              });
            }
          })
          .filter((c): c is ScryfallImageData => c !== undefined);

        onAdd(items);
        form.reset();
        dialog.setOpen(false);
      }
    },
    [getCards, onAdd],
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
          <Field.Root disabled={isSubmitting}>
            <Field.Label className={visuallyHidden()}>Decklist</Field.Label>
            <Field.Textarea name="decklist" />
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
