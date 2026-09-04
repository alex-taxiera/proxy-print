import { ComponentProps, useCallback, useRef, useState } from "react";

import { usePreviewData } from "@/hooks/usePreviewData";
import { usePreviewZoom } from "@/hooks/usePreviewZoom";

import { PreviewContext } from "./PreviewContext";

export const PreviewProvider = (
  props: Omit<ComponentProps<typeof PreviewContext.Provider>, "value">,
) => {
  const { pages } = usePreviewData();

  const contentRef = useRef<HTMLDivElement>(null);
  const zoom = usePreviewZoom(contentRef);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReferenceCardLoaded, setIsReferenceCardLoaded] = useState(false);

  // Clamp to valid range without a synchronous setState-in-effect
  const clampedCurrentPage =
    pages.length > 0 ? Math.min(currentPage, pages.length) : 1;

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, pages.length)));
      setIsReferenceCardLoaded(false);
    },
    [pages.length],
  );

  const onImageLoad = () => {
    setIsReferenceCardLoaded(true);
  };

  const contextValue = {
    currentPage: clampedCurrentPage,
    isReferenceCardLoaded,
    contentRef,
    changePage,
    onImageLoad,
    ...zoom,
  };

  return <PreviewContext.Provider {...props} value={contextValue} />;
};
