import { HStack } from "@chakra-ui/react";
import { useContext } from "react";

import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPageText,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";

import { PreviewContext } from "@/context/PreviewContext";
import { usePreviewData } from "@/hooks/usePreviewData";

export const PaginationControls = () => {
  const { currentPage, changePage } = useContext(PreviewContext);
  const { pages, cardsPerPage } = usePreviewData();

  if (pages.length < 2) {
    return null;
  }

  return (
    <PaginationRoot
      siblingCount={0}
      count={pages.length * cardsPerPage}
      page={currentPage}
      pageSize={cardsPerPage}
      onPageChange={({ page }) => changePage(page)}
      size={{ base: "xs", md: "sm" }}
      display="flex"
      alignItems="center"
      gap="1"
    >
      <PaginationPrevTrigger />
      {/* Numbered pages need more room than a phone has, so fall back to a
          "3 of 12" readout on narrow screens. */}
      <PaginationPageText
        format="compact"
        fontSize="xs"
        color="fg.muted"
        whiteSpace="nowrap"
        paddingX="1"
        hideFrom="md"
      />
      <HStack gap="1" hideBelow="md">
        <PaginationItems />
      </HStack>
      <PaginationNextTrigger />
    </PaginationRoot>
  );
};
