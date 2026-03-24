import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";

import { CustomImage } from "../image";

declare const self: DedicatedWorkerGlobalScope;

// Types for worker messages
export type WorkerProgressMessage = {
  progress: number;
  info: string;
};

export type WorkerAlertMessage = {
  alertmsg: string;
};

export type WorkerCompleteMessage = {
  progress: number;
  done: boolean;
  output: ArrayBuffer;
  info: string;
  /** Spatial upscale ratio of the loaded model (must match tile compositor). */
  factor: number;
};

async function upscale(
  image: CustomImage,
  model: tf.GraphModel,
  alpha: boolean = false,
) {
  const result = tf.tidy(() => {
    const tensor = imgToTensor(image);
    let result = model.predict(tensor) as tf.Tensor;
    if (alpha) {
      result = tf.greater(result, 0.5);
    }
    return result;
  });
  const resultImage = await tensorToImg(result);
  tf.dispose(result);
  return resultImage;
}

function imgToTensor(image: CustomImage) {
  const imgData = new ImageData(image.width, image.height);
  imgData.data.set(image.data);
  const tensor = tf.browser.fromPixels(imgData).div(255).toFloat().expandDims();
  return tensor;
}

async function tensorToImg(tensor: tf.Tensor): Promise<CustomImage> {
  const [, height, width] = tensor.shape;

  const clipped = tf.tidy(() =>
    tensor
      .reshape([height, width, 3])
      .mul(255)
      .cast("int32")
      .clipByValue(0, 255),
  );
  tensor.dispose();
  const data = await tf.browser.toPixels(clipped as tf.Tensor3D);
  clipped.dispose();
  const image = new CustomImage(
    width,
    height,
    data as unknown as Uint8Array<ArrayBuffer>,
  );

  return image;
}

export type UpscaleData = {
  image: CustomImage;
  model: tf.GraphModel;
  alpha: boolean;
  backend: "webgl" | "webgpu";
  tileSize?: number;
  minLap?: number;
  hasAlpha: boolean;
  width: number;
  height: number;
  input: Uint8Array;
  output: Uint8Array;
};

const esrganModels = {
  "anime-fast": {
    url: "/models/anime-fast/model.json",
    name: "anime-fast",
    scaleFactor: 4,
  },
  "4x-ultrasharp32": {
    url: "/models/4x-ultrasharp32/model.json",
    name: "4x-ultrasharp32",
    scaleFactor: 4,
  },
} as const;

const esrganModel = esrganModels["anime-fast"];

self.addEventListener(
  "message",
  ({ data }: MessageEvent<UpscaleData | undefined>) => {
    if (!data) {
      return;
    }

    const factor = esrganModel.scaleFactor;
    const tileSize = data.tileSize || 64;
    const minLap = data.minLap || 12;
    const input = new CustomImage(
      data.width,
      data.height,
      new Uint8Array(data.input),
    );
    const widthOriginal = input.width;
    const heightOriginal = input.height;
    input.padToTileSize(tileSize);
    const withPadding =
      input.width !== widthOriginal || input.height !== heightOriginal;

    const hasAlpha = data.hasAlpha;
    function sendProgress(progress: number) {
      self.postMessage({
        progress,
        info: `Processing ${hasAlpha ? "Alpha " : ""}${progress.toFixed(2)}%`,
      });
    }

    const enlargeImageWithFixedInput = async (
      model: tf.GraphModel,
      inputImg: CustomImage,
      factor = 4,
      inputSize = 64,
      minLap = 12,
    ) => {
      const width = inputImg.width;
      const height = inputImg.height;
      const output = new CustomImage(width * factor, height * factor);
      let numX = 1;
      for (; (inputSize * numX - width) / (numX - 1) < minLap; numX++);
      let numY = 1;
      for (; (inputSize * numY - height) / (numY - 1) < minLap; numY++);
      const locsX = new Array<number>(numX);
      const locsY = new Array<number>(numY);
      const padLeft = new Array<number>(numX);
      const padTop = new Array<number>(numY);
      const padRight = new Array<number>(numX);
      const padBottom = new Array<number>(numY);
      const totalLapX = inputSize * numX - width;
      const totalLapY = inputSize * numY - height;
      const baseLapX = Math.floor(totalLapX / (numX - 1));
      const baseLapY = Math.floor(totalLapY / (numY - 1));
      const extraLapX = totalLapX - baseLapX * (numX - 1);
      const extraLapY = totalLapY - baseLapY * (numY - 1);
      locsX[0] = 0;
      for (let i = 1; i < numX; i++) {
        if (i <= extraLapX) {
          locsX[i] = locsX[i - 1] + inputSize - baseLapX - 1;
        } else {
          locsX[i] = locsX[i - 1] + inputSize - baseLapX;
        }
      }
      locsY[0] = 0;
      for (let i = 1; i < numY; i++) {
        if (i <= extraLapY) {
          locsY[i] = locsY[i - 1] + inputSize - baseLapY - 1;
        } else {
          locsY[i] = locsY[i - 1] + inputSize - baseLapY;
        }
      }
      padLeft[0] = 0;
      padTop[0] = 0;
      padRight[numX - 1] = 0;
      padBottom[numY - 1] = 0;
      for (let i = 1; i < numX; i++) {
        padLeft[i] = Math.floor((locsX[i - 1] + inputSize - locsX[i]) / 2);
      }
      for (let i = 1; i < numY; i++) {
        padTop[i] = Math.floor((locsY[i - 1] + inputSize - locsY[i]) / 2);
      }
      for (let i = 0; i < numX - 1; i++) {
        padRight[i] = locsX[i] + inputSize - locsX[i + 1] - padLeft[i + 1];
      }
      for (let i = 0; i < numY - 1; i++) {
        padBottom[i] = locsY[i] + inputSize - locsY[i + 1] - padTop[i + 1];
      }
      const total = numX * numY;
      let current = 0;
      const useModel = new Array<boolean>(total).fill(false);
      if (hasAlpha) {
        for (let i = 0; i < numX; i++) {
          for (let j = 0; j < numY; j++) {
            const x1 = locsX[i];
            const y1 = locsY[j];
            const x2 = locsX[i] + inputSize;
            const y2 = locsY[j] + inputSize;
            const tile = new CustomImage(inputSize, inputSize);
            tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
            const scaled = new CustomImage(
              tile.width * factor,
              tile.height * factor,
            );
            for (let k = 4; k < tile.data.length; k += 4) {
              if (tile.data[k + 3] !== tile.data[3]) {
                useModel[current] = true;
                break;
              }
            }
            if (useModel[current]) {
              current++;
              continue;
            }
            for (let k = 0; k < scaled.data.length; k += 4) {
              scaled.data[k] = tile.data[3];
              scaled.data[k + 1] = tile.data[3];
              scaled.data[k + 2] = tile.data[3];
            }
            output.getImageCrop(
              (x1 + padLeft[i]) * factor,
              (y1 + padTop[j]) * factor,
              scaled,
              padLeft[i] * factor,
              padTop[j] * factor,
              scaled.width - padRight[i] * factor,
              scaled.height - padBottom[j] * factor,
            );
            current++;
          }
        }
        current = 0;
        for (let i = 0; i < numX; i++) {
          for (let j = 0; j < numY; j++) {
            if (!useModel[current]) {
              current++;
              const progress = (current / total) * 100;
              sendProgress(progress);
              continue;
            }
            const x1 = locsX[i];
            const y1 = locsY[j];
            const x2 = locsX[i] + inputSize;
            const y2 = locsY[j] + inputSize;
            const tile = new CustomImage(inputSize, inputSize);
            tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
            const scaled = await upscale(tile, model, true);
            output.getImageCrop(
              (x1 + padLeft[i]) * factor,
              (y1 + padTop[j]) * factor,
              scaled,
              padLeft[i] * factor,
              padTop[j] * factor,
              scaled.width - padRight[i] * factor,
              scaled.height - padBottom[j] * factor,
            );
            current++;
            const progress = (current / total) * 100;
            sendProgress(progress);
          }
        }
      } else {
        for (let i = 0; i < numX; i++) {
          for (let j = 0; j < numY; j++) {
            const x1 = locsX[i];
            const y1 = locsY[j];
            const x2 = locsX[i] + inputSize;
            const y2 = locsY[j] + inputSize;
            const tile = new CustomImage(inputSize, inputSize);
            tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
            const scaled = await upscale(tile, model);
            output.getImageCrop(
              (x1 + padLeft[i]) * factor,
              (y1 + padTop[j]) * factor,
              scaled,
              padLeft[i] * factor,
              padTop[j] * factor,
              scaled.width - padRight[i] * factor,
              scaled.height - padBottom[j] * factor,
            );
            current++;
            const progress = (current / total) * 100;
            sendProgress(progress);
          }
        }
      }
      return output;
    };

    const upscaleImage = async () => {
      if (!(await tf.setBackend(data.backend))) {
        self.postMessage({
          alertmsg: `${data.backend} is not supported in your browser.`,
        });
        return;
      }
      let model: tf.GraphModel | undefined;
      try {
        model = await tf.loadGraphModel(`indexeddb://${esrganModel.name}`);
        console.log("Model loaded successfully");
        self.postMessage({
          progress: 0,
          info: "Loaded from cache",
        });
      } catch {
        self.postMessage({
          progress: 0,
          info: "Downloading model",
        });
        model = await (async () => {
          const fetchedModel = await tf.loadGraphModel(esrganModel.url);
          await fetchedModel.save(`indexeddb://${esrganModel.name}`);
          return fetchedModel;
        })();
      }
      if (!model) {
        return;
      }

      const start = Date.now();
      let output: CustomImage | undefined;
      try {
        output = await enlargeImageWithFixedInput(
          model,
          input,
          factor,
          tileSize,
          minLap,
        );
      } catch (e) {
        self.postMessage({
          alertmsg: (e as Error).toString(),
        });
        return;
      }
      if (withPadding) {
        output.cropToOriginalSize(
          widthOriginal * factor,
          heightOriginal * factor,
        );
      }
      const end = Date.now();
      console.log("Time:", end - start);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      self.postMessage(
        {
          progress: 100,
          done: true,
          output: output.data.buffer,
          info: `Processing image...`,
          factor,
        },
        [output.data.buffer],
      );
    };

    upscaleImage().catch(console.error);
  },
);
