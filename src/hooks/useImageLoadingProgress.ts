import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getIsDownloadableImage,
  getIsGoogleImage,
} from "../context/ImagesContext";
import type { Image } from "../context/ImagesContext";
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
   * Number of images currently loading
   */
  loading: number;

  /**
   * Whether any images are currently loading
   */
  isLoading: boolean;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Progress as a fraction (0-1)
   */
  progressFraction: number;
}

/**
 * Hook that manually subscribes to React Query cache updates to track image loading progress
 * and optionally shows a progress toast
 */
export function useImageLoadingProgress(images: Image[]): ImageLoadingProgress {
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Filter to only downloadable images and ensure uniqueness by UUID
  const downloadableImages = useMemo(() => {
    const filtered = images.filter(getIsDownloadableImage);
    // Remove duplicates by UUID
    const uniqueMap = new Map<string, Image>();
    filtered.forEach((image) => {
      const id = getIsGoogleImage(image) ? image.id : image.uri;
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, image);
      }
    });
    return Array.from(uniqueMap.values());
  }, [images]);

  // Get current query data from cache
  const getCurrentProgress = useCallback(() => {
    const queryData = queryClient.getQueriesData<ImageQueryData>({
      queryKey: imagesQueryKey(),
    });

    const loaded = queryData.filter(([, data]) => data !== undefined).length;
    const total = downloadableImages.length;
    const loading = total - loaded;

    return {
      total,
      loaded,
      loading,
      isLoading: loading > 0,
      progress: total > 0 ? Math.round((loaded / total) * 100) : 100,
      progressFraction: total > 0 ? loaded / total : 1,
    };
  }, [queryClient, downloadableImages]);

  // State for current progress
  const [progress, setProgress] = useState<ImageLoadingProgress>(() =>
    getCurrentProgress(),
  );

  // Update progress toast
  const updateProgressToast = useCallback(
    (currentProgress: ImageLoadingProgress) => {
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
    [],
  );

  // Subscribe to cache updates
  useEffect(() => {
    if (downloadableImages.length === 0) {
      setProgress(getCurrentProgress());
      return;
    }

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
        setProgress(currentProgress);
        updateProgressToast(currentProgress);
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Initial progress update
    const initialProgress = getCurrentProgress();
    setProgress(initialProgress);
    updateProgressToast(initialProgress);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    downloadableImages,
    queryClient,
    getCurrentProgress,
    updateProgressToast,
  ]);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toaster.remove(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, []);

  // Update progress when images array changes
  useEffect(() => {
    const currentProgress = getCurrentProgress();
    setProgress(currentProgress);
    updateProgressToast(currentProgress);
  }, [images, getCurrentProgress, updateProgressToast]);

  return progress;
}
