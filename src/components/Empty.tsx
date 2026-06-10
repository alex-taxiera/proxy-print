import {
  Link,
  VStack,
  Heading,
  Textarea,
  Button,
  HStack,
} from "@chakra-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { useContext } from "react";

import { Field, FieldLabel } from "@/components/ui/field";

import { ImagesContext } from "@/context/ImagesContext";
import { useGetCardsForDecklist } from "@/hooks/useGetCardsForDecklist";
import { getScryfallCardsCollectionQueryKey } from "@/queries/useScryfallCardsCollection";

import { ImageUploader } from "./Sidebar/ImageUploader";
import { UpscaleSetting } from "./UpscaleSetting";

export const Empty = () => {
  const { onAdd, onAddSlots, onError } = useContext(ImagesContext);
  const isMutating = useIsMutating({
    mutationKey: getScryfallCardsCollectionQueryKey(),
  });
  const getCardsForDecklist = useGetCardsForDecklist();
  const handleDecklistSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
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
    }
  };
  const isSubmittingDecklist = !!isMutating;
  return (
    <VStack
      margin="auto"
      paddingY="6"
      paddingX="2"
      gap="6"
      flex={1}
      height="full"
      justifyContent="center"
    >
      <Heading size="lg">Add images to get started</Heading>
      <p>
        Upload an XML from{" "}
        <Link
          href="https://mpcfill.com/"
          target="_blank"
          rel="noreferrer"
          colorPalette="accent"
        >
          MPC Autofill&apos;s
        </Link>{" "}
        &quot;Download XML&quot; option.
      </p>
      <ImageUploader width="80" />
      <VStack asChild gap="2" alignItems="center">
        <form
          onSubmit={(event) => {
            void handleDecklistSubmit(event);
          }}
        >
          <Field alignItems="center" disabled={isSubmittingDecklist} required>
            <FieldLabel>
              Or import a decklist from your favorite deck builder!
            </FieldLabel>
            <Textarea
              name="decklist"
              width="80"
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
          <HStack justifyContent="space-between" width="80">
            <UpscaleSetting />
            <Button
              type="submit"
              loading={isSubmittingDecklist}
              loadingText="Submitting..."
            >
              Submit
            </Button>
          </HStack>
        </form>
      </VStack>
    </VStack>
  );
};
