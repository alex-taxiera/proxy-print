import { Heading, Text, VStack } from "@chakra-ui/react";

import {
  DialogRoot,
  DialogRootProps,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from "@/components/ui/dialog";

import { Alert } from "../ui/alert";

export type HowToUseAutoCutterDialogProps = DialogRootProps;

export function HowToUseAutoCutterDialog({
  children,
  ...props
}: HowToUseAutoCutterDialogProps) {
  return (
    <DialogRoot size="xl" scrollBehavior="inside" {...props}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup for autocutters (eg. Silhouette)</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody asChild>
          <VStack align="stretch" gap="8">
            <VStack align="stretch">
              <Heading>Step 1: Set up your layout</Heading>
              <Text>
                Within Proxyprint set up your bleed and alignment settings. For
                example, if you are using an A4 sized paper with a Silhouette
                Cameo you could use 1.5mm bleed and no spacing.
              </Text>
            </VStack>
            <VStack align="stretch">
              <Heading>Step 2: Export DXF file</Heading>
              <Text>
                Once your layout is set, export the DXF cutting guides for your
                cutter. This is found with the Cutting Marks settings in the
                advanced tab.
              </Text>
            </VStack>
            <VStack align="stretch">
              <Heading>Step 3: Configure your cutter settings</Heading>
              <Text>
                In the software for your cutter (eg. Silhouette Studio), use the
                DXF file and configure your settings for the registration marks.
              </Text>
              <Alert variant="surface" title="Use the minumum value for inset">
                Proxyprint requires using 10mm (the minimum value) for inset in
                Silhouette Studio
              </Alert>
            </VStack>
            <VStack align="stretch">
              <Heading>Step 4: Create the base PDF</Heading>
              <Text>
                In the Cutting Marks section of the advanced settings in
                Proxyprint, use the Create button to configure the registration
                marks. Use the same settings as you did in your cutter software.
              </Text>
              <Alert
                variant="surface"
                title="Want to get 3x3 layouts? Try Borderless mode"
              >
                Borderless mode moves the registration marks to 3.5mm from the
                edge instead of 10mm, letting you cut closer to the edge of the
                page. It requires extra setup in your cutter software — the base
                PDF creation dialog explains the steps when you enable it.
              </Alert>
            </VStack>
            <VStack align="stretch">
              <Heading>Step 5: Add your cards and generate PDFs</Heading>
              <Text>
                That concludes all the setup required for using the autocutter.
                You can now add your cards and generate PDFs.
              </Text>
              <Alert variant="surface" title="Save your settings">
                Under the save tab you can save your settings as a preset for
                future use.
              </Alert>
            </VStack>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
