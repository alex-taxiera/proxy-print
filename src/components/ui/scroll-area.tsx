import { ScrollArea as ChakraScrollArea } from "@chakra-ui/react";

export interface ScrollAreaProps extends ChakraScrollArea.RootProps {
  orientation: "horizontal" | "vertical" | "both";
}

function Scrollbars({
  orientation,
}: {
  orientation: ScrollAreaProps["orientation"];
}) {
  if (orientation === "both") {
    return (
      <>
        <ChakraScrollArea.Scrollbar orientation="vertical" />
        <ChakraScrollArea.Scrollbar orientation="horizontal" />
        <ChakraScrollArea.Corner />
      </>
    );
  }

  return <ChakraScrollArea.Scrollbar orientation={orientation} />;
}

export function ScrollArea({
  orientation,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <ChakraScrollArea.Root {...props}>
      <ChakraScrollArea.Viewport>{children}</ChakraScrollArea.Viewport>
      <Scrollbars orientation={orientation} />
    </ChakraScrollArea.Root>
  );
}

export function ScrollAreaContent(props: ChakraScrollArea.ContentProps) {
  return <ChakraScrollArea.Content {...props} />;
}
