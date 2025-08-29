import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImageQueryData, imagesQueryKey } from "../queries/images";
import { toaster } from "../utils/toaster";

interface ImageLoadingProgress {
  /**
   * Total number of downloadable images
   */
  total: number;

  /**
   * Number of images that have been loaded/cached
   */
  loaded: number;

  /**
   * Whether any images are currently loading
   */
  isLoading: boolean;
}

/**
 * Hook that manually subscribes to React Query cache updates to track image loading progress
 * and optionally shows a progress toast
 */
export function useImageLoadingProgress() {
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Get current query data from cache
  const getCurrentProgress = useCallback((): ImageLoadingProgress => {
    const queryData = queryClient.getQueriesData<ImageQueryData>({
      queryKey: imagesQueryKey(),
    });

    const loaded = queryData.filter(([, data]) => data !== undefined).length;
    const loading = queryData.filter(
      ([key]) => queryClient.getQueryState(key)?.status === "pending",
    ).length;

    const isLoading = loading > 0;

    const total = loaded + loading;

    return {
      total,
      loaded,
      isLoading,
    };
  }, [queryClient]);

  // Update progress toast
  const updateProgressToast = useCallback(
    (currentProgress: ImageLoadingProgress) => {
      if (currentProgress.isLoading !== isLoading) {
        setIsLoading(currentProgress.isLoading);
      }
      if (currentProgress.isLoading) {
        if (!toastIdRef.current) {
          // Create new toast
          toastIdRef.current = toaster.create({
            type: "loading",
            closable: false,
            duration: Infinity,
            title: "Downloading images",
            description: "This may take a while...",
            meta: {
              progress: currentProgress.loaded,
              totalProgressAmount: currentProgress.total,
            },
          });
        } else {
          // Update existing toast
          toaster.update(toastIdRef.current, {
            meta: {
              progress: currentProgress.loaded,
              totalProgressAmount: currentProgress.total,
            },
          });
        }
      } else if (toastIdRef.current) {
        // set to complete and then remove toast after a timeout
        toaster.update(toastIdRef.current, {
          meta: {
            progress: currentProgress.total,
            totalProgressAmount: currentProgress.total,
          },
        });
        setTimeout(() => {
          if (toastIdRef.current) {
            toaster.remove(toastIdRef.current);
            toastIdRef.current = null;
          }
        }, 1000);
      }
    },
    [isLoading],
  );

  // Subscribe to cache updates
  useEffect(() => {
    // Subscribe to cache events, but only care about image-related queries
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if this event is related to image queries
      const isImageQuery =
        event.query &&
        // Check if the query key starts with the imagesQueryKey
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey.length > 0 &&
        event.query.queryKey
          .join(",")
          .startsWith(`${imagesQueryKey().join(",")},`);

      if (
        isImageQuery &&
        (event.type === "updated" ||
          event.type === "added" ||
          event.type === "removed")
      ) {
        const currentProgress = getCurrentProgress();
        updateProgressToast(currentProgress);
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Initial progress update
    const initialProgress = getCurrentProgress();
    updateProgressToast(initialProgress);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (toastIdRef.current) {
        toaster.remove(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [queryClient, getCurrentProgress, updateProgressToast]);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toaster.remove(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  return isLoading;
}
