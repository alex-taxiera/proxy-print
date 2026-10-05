import {
  Link,
  VStack,
  Heading,
  Textarea,
  Button,
  SimpleGrid,
} from "@chakra-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { useContext } from "react";

import { Field, FieldLabel } from "@/components/ui/field";

import { ImagesContext } from "@/context/ImagesContext";
import { useGetCardsForDecklist } from "@/hooks/useGetCardsForDecklist";
import { getScryfallCardsCollectionQueryKey } from "@/queries/useScryfallCardsCollection";

import { DefaultImportLanguageSetting } from "./DefaultImportLanguageSetting";
import { ImageUploader } from "./Sidebar/ImageUploader";
import { UpscaleSetting } from "./UpscaleSetting";

export const Empty = () => {
  const { onAdd, onAddSlots, onError, isLoadingProject } =
    useContext(ImagesContext);
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
        onAddSlots(result.slotItems, undefined, { upscaleCached: true });
      } else {
        onAdd(result.items, undefined, { upscaleCached: true });
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
      <ImageUploader width="80" maxWidth="full" />
      <VStack asChild gap="2" alignItems="center" width="full">
        <form
          onSubmit={(event) => {
            void handleDecklistSubmit(event);
          }}
        >
          <Field
            alignItems="center"
            disabled={isSubmittingDecklist || isLoadingProject}
            required
          >
            <FieldLabel>
              Or import a decklist from your favorite deck builder!
            </FieldLabel>
            <Textarea
              name="decklist"
              width="80"
              maxWidth="full"
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
          <SimpleGrid
            columns={2}
            gap="3"
            width="80"
            maxWidth="full"
            marginTop="1"
          >
            <DefaultImportLanguageSetting size="sm">
              Language
            </DefaultImportLanguageSetting>
            <UpscaleSetting size="sm">Upscaling</UpscaleSetting>
          </SimpleGrid>
          <Button
            type="submit"
            width="80"
            maxWidth="full"
            marginTop="1"
            disabled={isLoadingProject}
            loading={isSubmittingDecklist || isLoadingProject}
            loadingText={
              isLoadingProject ? "Loading project..." : "Submitting..."
            }
          >
            Submit
          </Button>
        </form>
      </VStack>
    </VStack>
  );
};
