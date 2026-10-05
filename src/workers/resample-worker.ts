import {
  hasTransparency,
  ResampleKernel,
  resampleUpscale,
} from "@/utils/resample";

declare const self: DedicatedWorkerGlobalScope;

export type ResampleWorkerRequest = {
  input: Blob;
  factor: number;
  kernel: ResampleKernel;
};

export type ResampleWorkerResponse = { output: Blob } | { alertmsg: string };

const upscale = async ({ input, factor, kernel }: ResampleWorkerRequest) => {
  const bitmap = await createImageBitmap(input);
  const { width, height } = bitmap;

  const sourceCanvas = new OffscreenCanvas(width, height);
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    throw new Error("Failed to get 2D context");
  }
  sourceCtx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const source = sourceCtx.getImageData(0, 0, width, height);

  const result = resampleUpscale(source.data, width, height, factor, kernel);

  const outputCanvas = new OffscreenCanvas(result.width, result.height);
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) {
    throw new Error("Failed to get 2D context");
  }
  outputCtx.putImageData(
    new ImageData(result.data, result.width, result.height),
    0,
    0,
  );

  // Match the AI upscaler: keep PNG only when there is alpha to preserve.
  return outputCanvas.convertToBlob(
    hasTransparency(source.data)
      ? { type: "image/png" }
      : { type: "image/jpeg", quality: 0.92 },
  );
};

self.addEventListener(
  "message",
  ({ data }: MessageEvent<ResampleWorkerRequest | undefined>) => {
    if (!data) {
      return;
    }

    upscale(data)
      .then((output) => {
        self.postMessage({ output } satisfies ResampleWorkerResponse);
      })
      .catch((error: unknown) => {
        self.postMessage({
          alertmsg: error instanceof Error ? error.message : String(error),
        } satisfies ResampleWorkerResponse);
      });
  },
);
