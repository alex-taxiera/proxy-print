import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

/** Fitting shows the page at its true size at most — it never magnifies. */
const MAX_FIT_ZOOM = 1;

/** Leaves a hair of room so a fitted page can't round into a scrollbar. */
const FIT_MARGIN_PX = 2;

/** @param referenceRef the hidden page that is always rendered at 1:1 */
export const usePreviewZoom = (
  referenceRef: RefObject<HTMLDivElement | null>,
) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<() => void>(() => {});

  const [zoom, setZoomValue] = useState(1);
  const [isZoomFitted, setIsZoomFitted] = useState(true);

  const setZoom = useCallback((next: number) => {
    setIsZoomFitted(false);
    setZoomValue(Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const fitZoom = useCallback(() => setIsZoomFitted(true), []);

  // Re-fit after every render, since the page's natural size changes with
  // settings (page size, card size, grid) that nothing else here observes.
  useLayoutEffect(() => {
    const measure = () => {
      if (!isZoomFitted) return;
      const viewport = viewportRef.current;
      const strip = stripRef.current;
      if (!viewport || !strip) return;

      const onScreenPage = strip.querySelector(".page-container .page");
      const referencePage = referenceRef.current?.querySelector(".page");
      if (!onScreenPage || !referencePage) return;

      // Measure what the browser actually did rather than assuming it equals
      // `zoom`: engines disagree about whether zoomed lengths show up in
      // getBoundingClientRect, and assuming makes this feed its own output back
      // in and collapse to MIN_ZOOM. The reference page is pinned at 1:1, so
      // the ratio between the two is the real scale in either case.
      const scale =
        onScreenPage.getBoundingClientRect().width /
        referencePage.getBoundingClientRect().width;
      if (!Number.isFinite(scale) || scale <= 0) return;

      const rect = strip.getBoundingClientRect();
      const naturalWidth = rect.width / scale;
      const naturalHeight = rect.height / scale;
      if (naturalWidth <= 0 || naturalHeight <= 0) return;

      const fitted = Math.min(
        (viewport.clientWidth - FIT_MARGIN_PX) / naturalWidth,
        (viewport.clientHeight - FIT_MARGIN_PX) / naturalHeight,
        MAX_FIT_ZOOM,
      );
      const next = Math.max(fitted, MIN_ZOOM);
      // Ignore sub-pixel churn so measuring can't feed itself
      if (Math.abs(next - zoom) > 0.005) setZoomValue(next);
    };

    measureRef.current = measure;
    measure();
  });

  // ...and whenever the space available to the preview changes
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  return { zoom, isZoomFitted, setZoom, fitZoom, viewportRef, stripRef };
};
