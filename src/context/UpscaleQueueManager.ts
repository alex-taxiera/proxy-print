import { useRef, useState } from "react";

export type UpscaleQueueItem = {
  id: string;
  src: Blob;
  resolve: (result: Blob) => void;
  reject: (error: Error) => void;
};

export type UpscaleQueueStatus = {
  isProcessing: boolean;
  queueLength: number;
  currentItemId: string | null;
};

export function useUpscaleQueueManager() {
  const queueRef = useRef<UpscaleQueueItem[]>([]);
  const [status, setStatus] = useState<UpscaleQueueStatus>({
    isProcessing: false,
    queueLength: 0,
    currentItemId: null,
  });
  const processingRef = useRef<boolean>(false);
  const upscaleWorkerRef = useRef<((src: Blob) => Promise<Blob>) | null>(null);

  // Set the upscale worker function
  const setUpscaleWorker = (upscaleWorker: (src: Blob) => Promise<Blob>) => {
    upscaleWorkerRef.current = upscaleWorker;
  };

  const updateStatus = () => {
    setStatus({
      isProcessing: processingRef.current,
      queueLength: queueRef.current.length,
      currentItemId:
        processingRef.current && queueRef.current.length > 0
          ? queueRef.current[0].id
          : null,
    });
  };

  const processQueue = async () => {
    // Prevent multiple concurrent processing
    if (
      processingRef.current ||
      queueRef.current.length === 0 ||
      !upscaleWorkerRef.current
    ) {
      return;
    }

    processingRef.current = true;
    updateStatus();

    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current[0]; // Process first item (FIFO)

        try {
          console.debug(`Starting upscale for item: ${item.id}`);
          const result = await upscaleWorkerRef.current(item.src);

          // Remove the processed item from queue
          queueRef.current.shift();
          updateStatus();

          // Resolve the promise
          item.resolve(result);
          console.debug(`Completed upscale for item: ${item.id}`);
        } catch (error) {
          // Remove the failed item from queue
          queueRef.current.shift();
          updateStatus();

          // Reject the promise
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          item.reject(errorObj);
          console.error(`Failed upscale for item: ${item.id}`, errorObj);
        }
      }
    } finally {
      processingRef.current = false;
      updateStatus();
    }
  };

  const addToQueue = (id: string, src: Blob): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      const item: UpscaleQueueItem = {
        id,
        src,
        resolve,
        reject,
      };

      queueRef.current.push(item);
      updateStatus();

      // Start processing if not already processing
      if (!processingRef.current) {
        void processQueue();
      }
    });
  };

  const removeFromQueue = (id: string) => {
    const initialLength = queueRef.current.length;
    queueRef.current = queueRef.current.filter((item) => item.id !== id);

    if (queueRef.current.length !== initialLength) {
      updateStatus();
    }
  };

  const clearQueue = () => {
    // Reject all pending items
    queueRef.current.forEach((item) => {
      item.reject(new Error("Queue cleared"));
    });

    queueRef.current = [];
    updateStatus();
  };

  const getQueuePosition = (id: string): number => {
    return queueRef.current.findIndex((item) => item.id === id);
  };

  return {
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueuePosition,
    setUpscaleWorker,
    status,
  };
}
