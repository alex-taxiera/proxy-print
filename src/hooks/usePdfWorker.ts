import { useCallback, useRef, useState } from 'react';

interface PdfWorkerMessage {
  type: 'progress' | 'complete' | 'error';
  processed?: number;
  total?: number;
  percentage?: number;
  blob?: Blob;
  error?: string;
}

interface ImageData {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  guides?: {
    thickness: number;
    // Add other guide properties as needed
  };
}

export const usePdfWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePdf = useCallback((
    images: ImageData[],
    settings: Record<string, unknown>,
    pageHeight: number,
    pageWidth: number,
    unit: string
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Create worker if it doesn't exist
      if (!workerRef.current) {
        workerRef.current = new Worker('/pdf-worker.js');
      }

      const worker = workerRef.current;
      setIsProcessing(true);
      setProgress(0);

      // Handle worker messages
      const handleMessage = (e: MessageEvent<PdfWorkerMessage>) => {
        const { type, percentage, blob, error } = e.data;

        switch (type) {
          case 'progress':
            setProgress(percentage || 0);
            break;

          case 'complete':
            setIsProcessing(false);
            setProgress(100);
            resolve(blob!);
            break;

          case 'error':
            setIsProcessing(false);
            setProgress(0);
            reject(new Error(error));
            break;
        }
      };

      // Listen for worker messages
      worker.addEventListener('message', handleMessage);

      // Send data to worker
      worker.postMessage({
        images,
        settings,
        pageHeight,
        pageWidth,
        unit
      });
    });
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  return {
    generatePdf,
    cancel,
    isProcessing,
    progress
  };
}; 
