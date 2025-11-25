/**
 * Calculates DPI from image dimensions and target physical size
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @param targetWidthMm - Target width in mm
 * @param targetHeightMm - Target height in mm
 * @returns DPI value
 */
function calculateDpi(
  imageWidth: number,
  imageHeight: number,
  targetWidthMm: number,
  targetHeightMm: number,
): number {
  // Convert mm to inches (1 inch = 25.4mm)
  const targetWidthInches = targetWidthMm / 25.4;
  const targetHeightInches = targetHeightMm / 25.4;

  // Calculate DPI for both dimensions and use the average
  const dpiWidth = imageWidth / targetWidthInches;
  const dpiHeight = imageHeight / targetHeightInches;

  return Math.round((dpiWidth + dpiHeight) / 2);
}

function blackenAllNearBlackPixels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
  borderThickness = {
    top: 96,
    bottom: 400,
    left: 48,
    right: 48,
  },
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inBorder =
        y < borderThickness.top ||
        y >= height - borderThickness.bottom ||
        x < borderThickness.left ||
        x >= width - borderThickness.right;

      if (!inBorder) continue;

      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (r < threshold && g < threshold && b < threshold) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Detects if an image needs bleed to be added based on aspect ratio comparison.
 * Compares the image's aspect ratio to both the non-bleed and bleed aspect ratios
 * to determine which one the image is closer to.
 *
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @param targetWidthMm - Target width without bleed in mm
 * @param targetHeightMm - Target height without bleed in mm
 * @returns true if the image aspect ratio is closer to the non-bleed aspect ratio, false otherwise
 */
export function needsBleed(
  imageWidth: number,
  imageHeight: number,
  targetWidthMm: number,
  targetHeightMm: number,
): boolean {
  // Calculate DPI from image dimensions and target size
  const dpi = calculateDpi(
    imageWidth,
    imageHeight,
    targetWidthMm,
    targetHeightMm,
  );
  const mmToPixels = dpi / 25.4;
  const targetWidthPx = targetWidthMm * mmToPixels;
  const targetHeightPx = targetHeightMm * mmToPixels;

  // Calculate bleed dimensions (3mm on all edges)
  const bleedMm = 3;
  const bleedPx = bleedMm * mmToPixels;
  const bleedWidthPx = targetWidthPx + bleedPx * 2;
  const bleedHeightPx = targetHeightPx + bleedPx * 2;

  // Calculate aspect ratios
  const imageAspectRatio = imageWidth / imageHeight;
  const nonBleedAspectRatio = targetWidthPx / targetHeightPx;
  const bleedAspectRatio = bleedWidthPx / bleedHeightPx;

  // Calculate the difference between image aspect ratio and each target aspect ratio
  const diffToNonBleed = Math.abs(imageAspectRatio - nonBleedAspectRatio);
  const diffToBleed = Math.abs(imageAspectRatio - bleedAspectRatio);

  // Return true if the image aspect ratio is closer to the non-bleed aspect ratio
  // This means the image needs bleed to reach the bleed dimensions
  return diffToNonBleed < diffToBleed;
}

/**
 * Wrapper function that takes a File and extracts the image dimensions to determine bleed needs.
 * This is the main entry point for checking if an uploaded image needs bleed.
 *
 * @param imageFile - The image as a File
 * @param targetWidthMm - Target width without bleed in mm
 * @param targetHeightMm - Target height without bleed in mm
 * @returns Promise<boolean> - true if the image needs bleed for proper formatting
 */
export function needsBleedFromFile(
  imageFile: File,
  targetWidthMm: number,
  targetHeightMm: number,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const result = needsBleed(
        img.width,
        img.height,
        targetWidthMm,
        targetHeightMm,
      );
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image from file"));
    };

    img.src = url;
  });
}

export function addBleedEdge(
  src: Blob,
  mimeType: string,
  targetWidthMm: number,
  targetHeightMm: number,
): Promise<Blob> {
  const url = URL.createObjectURL(src);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      // Calculate DPI from image dimensions and target size
      const dpi = calculateDpi(
        img.width,
        img.height,
        targetWidthMm,
        targetHeightMm,
      );
      const mmToPixels = dpi / 25.4;
      const targetCardWidth = Math.round(targetWidthMm * mmToPixels);
      const targetCardHeight = Math.round(targetHeightMm * mmToPixels);
      const bleedMm = 3; // 3mm bleed on all edges
      const bleed = Math.round(bleedMm * mmToPixels);
      const finalWidth = targetCardWidth + bleed * 2;
      const finalHeight = targetCardHeight + bleed * 2;
      const blackThreshold = 30; // max RGB value to still consider "black"
      const blackToleranceRatio = 0.7; // how much of the edge must be black to switch modes

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const targetAspect = targetCardWidth / targetCardHeight;

      let drawWidth = targetCardWidth;
      let drawHeight = targetCardHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectRatio > targetAspect) {
        drawHeight = targetCardHeight;
        drawWidth = img.width * (targetCardHeight / img.height);
        offsetX = (drawWidth - targetCardWidth) / 2;
      } else {
        drawWidth = targetCardWidth;
        drawHeight = img.height * (targetCardWidth / img.width);
        offsetY = (drawHeight - targetCardHeight) / 2;
      }

      const temp = document.createElement("canvas");
      temp.width = targetCardWidth;
      temp.height = targetCardHeight;
      const tempCtx = temp.getContext("2d", { willReadFrequently: true })!;
      tempCtx.drawImage(img, -offsetX, -offsetY, drawWidth, drawHeight);

      // Scale corner size and sample inset based on DPI (base size at 300 DPI)
      const baseDpi = 300;
      const dpiScale = dpi / baseDpi;
      const cornerSize = Math.round(30 * dpiScale);
      const sampleInset = Math.round(10 * dpiScale);

      const averageColor = (
        x: number,
        y: number,
        w: number,
        h: number,
      ): string => {
        const data = tempCtx.getImageData(x, y, w, h).data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha === 0) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (count === 0) return "#000";

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        return `rgb(${r}, ${g}, ${b})`;
      };

      const fillIfLight = (
        r: number,
        g: number,
        b: number,
        a: number,
      ): boolean => a === 0 || (r > 200 && g > 200 && b > 200);

      const cornerRadiusMm = 2.5;
      const cornerRadiusPx = Math.max(
        1,
        Math.round(cornerRadiusMm * mmToPixels),
      );
      const cornerOverlapMm = 0.4;
      const cornerOverlapPx = Math.max(
        1,
        Math.round(cornerOverlapMm * mmToPixels),
      );

      const cornerConfigs = [
        {
          rectX: 0,
          rectY: 0,
          isLeft: true,
          isTop: true,
        },
        {
          rectX: temp.width - cornerSize,
          rectY: 0,
          isLeft: false,
          isTop: true,
        },
        {
          rectX: 0,
          rectY: temp.height - cornerSize,
          isLeft: true,
          isTop: false,
        },
        {
          rectX: temp.width - cornerSize,
          rectY: temp.height - cornerSize,
          isLeft: false,
          isTop: false,
        },
      ] as const;

      cornerConfigs.forEach((config) => {
        const { rectX, rectY, isLeft, isTop } = config;
        const imageData = tempCtx.getImageData(
          rectX,
          rectY,
          cornerSize,
          cornerSize,
        ).data;
        let shouldFill = false;

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          if (fillIfLight(r, g, b, a)) {
            shouldFill = true;
            break;
          }
        }

        if (shouldFill) {
          const sampleX = isLeft ? sampleInset : temp.width - sampleInset - 10;
          const sampleY = isTop ? sampleInset : temp.height - sampleInset - 10;
          const avgColor = averageColor(sampleX, sampleY, 10, 10);
          const localCenterX = isLeft
            ? cornerRadiusPx
            : cornerSize - cornerRadiusPx;
          const localCenterY = isTop
            ? cornerRadiusPx
            : cornerSize - cornerRadiusPx;

          const cornerCanvas = document.createElement("canvas");
          cornerCanvas.width = cornerSize;
          cornerCanvas.height = cornerSize;
          const cornerCtx = cornerCanvas.getContext("2d")!;

          cornerCtx.fillStyle = avgColor;
          cornerCtx.fillRect(0, 0, cornerSize, cornerSize);

          // Remove the rounded corner portion from the fill without touching the source image
          cornerCtx.save();
          cornerCtx.globalCompositeOperation = "destination-out";
          const cutRadiusPx = Math.max(1, cornerRadiusPx - cornerOverlapPx);
          cornerCtx.beginPath();
          cornerCtx.arc(
            localCenterX,
            localCenterY,
            cutRadiusPx,
            0,
            Math.PI * 2,
          );
          cornerCtx.closePath();
          cornerCtx.fill();
          cornerCtx.restore();

          tempCtx.drawImage(cornerCanvas, rectX, rectY);
        }
      });

      blackenAllNearBlackPixels(
        tempCtx,
        targetCardWidth,
        targetCardHeight,
        blackThreshold,
      );

      const edgeData = tempCtx.getImageData(0, 0, 1, targetCardHeight).data;
      let blackCount = 0;

      for (let i = 0; i < targetCardHeight; i++) {
        const r = edgeData[i * 4];
        const g = edgeData[i * 4 + 1];
        const b = edgeData[i * 4 + 2];
        if (r < blackThreshold && g < blackThreshold && b < blackThreshold) {
          blackCount++;
        }
      }

      const isMostlyBlack = blackCount / targetCardHeight > blackToleranceRatio;

      const scaledImg = new Image();
      scaledImg.onload = () => {
        ctx.drawImage(scaledImg, bleed, bleed);

        if (isMostlyBlack) {
          const slice = 8;
          // Edges
          ctx.drawImage(
            scaledImg,
            0,
            0,
            slice,
            targetCardHeight,
            0,
            bleed,
            bleed,
            targetCardHeight,
          ); // L
          ctx.drawImage(
            scaledImg,
            targetCardWidth - slice,
            0,
            slice,
            targetCardHeight,
            targetCardWidth + bleed,
            bleed,
            bleed,
            targetCardHeight,
          ); // R
          ctx.drawImage(
            scaledImg,
            0,
            0,
            targetCardWidth,
            slice,
            bleed,
            0,
            targetCardWidth,
            bleed,
          ); // T
          ctx.drawImage(
            scaledImg,
            0,
            targetCardHeight - slice,
            targetCardWidth,
            slice,
            bleed,
            targetCardHeight + bleed,
            targetCardWidth,
            bleed,
          ); // B

          // Corners
          ctx.drawImage(scaledImg, 0, 0, slice, slice, 0, 0, bleed, bleed); // TL
          ctx.drawImage(
            scaledImg,
            targetCardWidth - slice,
            0,
            slice,
            slice,
            targetCardWidth + bleed,
            0,
            bleed,
            bleed,
          ); // TR
          ctx.drawImage(
            scaledImg,
            0,
            targetCardHeight - slice,
            slice,
            slice,
            0,
            targetCardHeight + bleed,
            bleed,
            bleed,
          ); // BL
          ctx.drawImage(
            scaledImg,
            targetCardWidth - slice,
            targetCardHeight - slice,
            slice,
            slice,
            targetCardWidth + bleed,
            targetCardHeight + bleed,
            bleed,
            bleed,
          ); // BR
        } else {
          // Overscan by 4 pixels to blend extension into original image
          const overscan = 4;

          // Left edge - mirror and blend
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(
            scaledImg,
            overscan,
            0,
            bleed + overscan,
            targetCardHeight,
            -bleed - overscan,
            bleed,
            bleed + overscan,
            targetCardHeight,
          );
          ctx.restore();

          // Right edge - mirror and blend
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(
            scaledImg,
            targetCardWidth - bleed - overscan * 2,
            0,
            bleed + overscan,
            targetCardHeight,
            -finalWidth,
            bleed,
            bleed + overscan,
            targetCardHeight,
          );
          ctx.restore();

          // Top edge - mirror and blend
          ctx.save();
          ctx.scale(1, -1);
          ctx.drawImage(
            scaledImg,
            0,
            overscan,
            targetCardWidth,
            bleed + overscan,
            bleed,
            -bleed - overscan,
            targetCardWidth,
            bleed + overscan,
          );
          ctx.restore();

          // Bottom edge - mirror and blend
          ctx.save();
          ctx.scale(1, -1);
          ctx.drawImage(
            scaledImg,
            0,
            targetCardHeight - bleed - overscan * 2,
            targetCardWidth,
            bleed + overscan,
            bleed,
            -finalHeight,
            targetCardWidth,
            bleed + overscan,
          );
          ctx.restore();

          // Corners - mirror and blend
          ctx.save();
          ctx.scale(-1, -1);
          ctx.drawImage(
            scaledImg,
            overscan,
            overscan,
            bleed + overscan,
            bleed + overscan,
            -bleed - overscan,
            -bleed - overscan,
            bleed + overscan,
            bleed + overscan,
          );
          ctx.restore();

          ctx.save();
          ctx.scale(-1, -1);
          ctx.drawImage(
            scaledImg,
            targetCardWidth - bleed - overscan,
            overscan,
            bleed + overscan,
            bleed + overscan,
            -finalWidth,
            -bleed - overscan,
            bleed + overscan,
            bleed + overscan,
          );
          ctx.restore();

          ctx.save();
          ctx.scale(-1, -1);
          ctx.drawImage(
            scaledImg,
            overscan,
            targetCardHeight - bleed - overscan,
            bleed + overscan,
            bleed + overscan,
            -bleed - overscan,
            -finalHeight,
            bleed + overscan,
            bleed + overscan,
          );
          ctx.restore();

          ctx.save();
          ctx.scale(-1, -1);
          ctx.drawImage(
            scaledImg,
            targetCardWidth - bleed - overscan,
            targetCardHeight - bleed - overscan,
            bleed + overscan,
            bleed + overscan,
            -finalWidth,
            -finalHeight,
            bleed + overscan,
            bleed + overscan,
          );
          ctx.restore();
        }

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob ?? src);
        }, mimeType);
      };

      scaledImg.src = temp.toDataURL(mimeType);
    };

    img.src = url;
  });
}
