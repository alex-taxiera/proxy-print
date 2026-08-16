import { useEffect } from "react";

import Module from "@/asm/imghelper.js";
import { useUpscaleQueueManager } from "@/context/UpscaleQueueManager";
import { CustomImage } from "@/image";
import { detectBestUpscaleBackend } from "@/utils/upscale-support";
import UpscaleWorker from "@/workers/upscale-worker?worker";

const wasmModule = Module();

export function useUpscaleImage() {
  const queueManager = useUpscaleQueueManager();

  // Set up the queue manager with our processing function
  useEffect(() => {
    queueManager.setUpscaleWorker(async (src: Blob): Promise<Blob> => {
      const start = Date.now();

      // Convert blob to CustomImage
      const input = await new Promise<CustomImage>((resolve) => {
        const url = URL.createObjectURL(src);
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Failed to get 2D context");
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const result = new CustomImage(
            img.width,
            img.height,
            new Uint8Array(imageData.data.buffer),
          );
          URL.revokeObjectURL(url);
          resolve(result);
        };
      });

      // Check if image has alpha channel
      let hasAlpha = false;
      try {
        const wasm = await wasmModule;
        const inputPtr = wasm._malloc(input.data.length);
        wasm.HEAPU8.set(input.data, inputPtr);
        hasAlpha = wasm._check_alpha(inputPtr, input.width * input.height);
        wasm._free(inputPtr);
      } catch (error) {
        console.warn("Failed to check alpha channel:", error);
        // Fallback: assume no alpha
        hasAlpha = false;
      }

      // Detect the best available backend (webgpu preferred, fallback to webgl)
      const backend = await detectBestUpscaleBackend();
      if (!backend) {
        throw new Error(
          "Neither WebGL nor WebGPU is supported in your browser.",
        );
      }

      // Process image with worker
      return new Promise<Blob>((resolve, reject) => {
        const workerInstance = new UpscaleWorker({ name: "Upscale Worker" });

        workerInstance.addEventListener("message", (e: MessageEvent) => {
          const { done, output, alertmsg, factor } = e.data as {
            progress?: number;
            done?: boolean;
            output?: ArrayBuffer;
            alertmsg?: string;
            info?: string;
            factor?: number;
          };

          if (alertmsg) {
            workerInstance.terminate();
            reject(new Error(alertmsg));
            return;
          }

          if (done && output) {
            // Handle async processing in a separate function
            try {
              const scale = factor ?? 4;
              const finalOutput = new CustomImage(
                scale * input.width,
                scale * input.height,
                new Uint8Array(output),
              );

              // If original had alpha, copy alpha channel from upscaled result
              if (hasAlpha) {
                wasmModule
                  .then((wasm) => {
                    const outputArray = new Uint8Array(output);
                    const sourcePtr = wasm._malloc(outputArray.length);
                    const targetPtr = wasm._malloc(outputArray.length);
                    const numPixels = outputArray.length / 4;

                    wasm.HEAPU8.set(outputArray, sourcePtr);
                    wasm.HEAPU8.set(finalOutput.data, targetPtr);
                    wasm._copy_alpha_channel(sourcePtr, targetPtr, numPixels);

                    finalOutput.data.set(
                      wasm.HEAPU8.subarray(
                        targetPtr,
                        targetPtr + outputArray.length,
                      ),
                    );

                    wasm._free(sourcePtr);
                    wasm._free(targetPtr);
                    return finalOutput;
                  })
                  .catch((error) => {
                    console.warn("Failed to process alpha channel:", error);
                    // Continue without alpha processing
                  });
              }

              // Convert to blob
              const canvas = document.createElement("canvas");
              canvas.width = finalOutput.width;
              canvas.height = finalOutput.height;
              const ctx = canvas.getContext("2d");

              if (!ctx) {
                throw new Error("Failed to get 2D context");
              }

              const imageData = ctx.createImageData(
                finalOutput.width,
                finalOutput.height,
              );
              imageData.data.set(finalOutput.data);
              ctx.putImageData(imageData, 0, 0);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    console.debug(
                      `Upscaling completed in ${(Date.now() - start) / 1000}s`,
                    );
                    resolve(blob);
                  } else {
                    reject(new Error("Failed to create blob"));
                  }
                  workerInstance.terminate();
                },
                hasAlpha ? "image/png" : "image/jpeg",
                0.92,
              );
            } catch (error) {
              workerInstance.terminate();
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          }
        });

        workerInstance.addEventListener("error", (error) => {
          workerInstance.terminate();
          reject(
            new Error(`Worker error: ${error.message || "Unknown error"}`),
          );
        });

        // Start processing
        workerInstance.postMessage(
          {
            input: input.data.buffer,
            width: input.width,
            height: input.height,
            hasAlpha: false, // Always process RGB first
            backend,
          },
          [input.data.buffer],
        );
      });
    });
  }, [queueManager]);

  // Public upscale function that uses the queue
  const upscaleImage = async (src: Blob, id?: string): Promise<Blob> => {
    const itemId =
      id || `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return queueManager.addToQueue(itemId, src);
  };

  return {
    upscaleImage,
    queueStatus: queueManager.status,
    removeFromQueue: queueManager.removeFromQueue,
    clearQueue: queueManager.clearQueue,
    getQueuePosition: queueManager.getQueuePosition,
  };
}
