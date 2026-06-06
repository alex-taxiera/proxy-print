import { useEffect, useRef } from "react";

import { useDownloadProgressStore } from "@/store/downloadProgressStore";
import { toaster } from "@/components/ui/toaster";

/**
 * Subscribes to the download progress Zustand store and manages a progress
 * toast. Returns whether images are currently downloading.
 *
 * This replaces the previous React Query cache-event subscription approach,
 * which suffered from timing races caused by the subscription being torn down
 * and re-established every time the `isLoading` state changed.
 */
export function useImageLoadingProgress() {
  const pending = useDownloadProgressStore((s) => s.pending);
  const done = useDownloadProgressStore((s) => s.done);
  const reset = useDownloadProgressStore((s) => s.reset);

  const toastIdRef = useRef<string | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const total = pending + done;

    if (pending > 0) {
      // Active downloads: cancel any scheduled completion dismissal so the
      // existing toast keeps showing (handles rapid back-to-back batches).
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }

      if (!toastIdRef.current) {
        toastIdRef.current = toaster.create({
          type: "loading",
          closable: false,
          duration: Infinity,
          title: "Downloading images",
          description: "This may take a while...",
          meta: { progress: done, totalProgressAmount: total },
        });
      } else {
        toaster.update(toastIdRef.current, {
          meta: { progress: done, totalProgressAmount: total },
        });
      }
    } else if (done > 0 && toastIdRef.current) {
      // All downloads finished — show 100 % then dismiss after 1 second.
      toaster.update(toastIdRef.current, {
        meta: { progress: total, totalProgressAmount: total },
      });
      completionTimeoutRef.current = setTimeout(() => {
        if (toastIdRef.current) {
          toaster.remove(toastIdRef.current);
          toastIdRef.current = null;
        }
        completionTimeoutRef.current = null;
        reset();
      }, 1000);
    }

    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    };
  }, [pending, done, reset]);
}
