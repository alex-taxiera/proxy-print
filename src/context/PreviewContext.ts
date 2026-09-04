import { RefObject, createContext, createRef } from "react";

/** Steps the +/- buttons and the zoom menu offer. 1 = actual print size. */
export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export type PreviewContextValue = {
  /** 1-based, already clamped to the number of available pages */
  currentPage: number;
  /** Whether the first card of the current page has finished loading */
  isReferenceCardLoaded: boolean;
  /** Hidden, never-transformed page used by useGeneratePdf for measurements */
  contentRef: RefObject<HTMLDivElement | null>;
  changePage: (page: number) => void;
  onImageLoad: () => void;
  /** Scale applied to the preview. 1 renders the page at actual print size. */
  zoom: number;
  /** While true, `zoom` is recomputed so the whole page stays visible */
  isZoomFitted: boolean;
  setZoom: (zoom: number) => void;
  fitZoom: () => void;
  /** The scrollable area the fitted zoom is measured against */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** The zoomed preview, measured to derive its unscaled size */
  stripRef: RefObject<HTMLDivElement | null>;
};

export const PreviewContext = createContext<PreviewContextValue>({
  currentPage: 1,
  isReferenceCardLoaded: false,
  contentRef: createRef<HTMLDivElement>(),
  changePage: () => {},
  onImageLoad: () => {},
  zoom: 1,
  isZoomFitted: true,
  setZoom: () => {},
  fitZoom: () => {},
  viewportRef: createRef<HTMLDivElement>(),
  stripRef: createRef<HTMLDivElement>(),
});
