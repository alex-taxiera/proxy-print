import { describe, expect, it } from "vitest";

import { hasTransparency, ResampleKernel, resampleUpscale } from "./resample";

const image = (
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number, number],
) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set(pixel(x, y), (y * width + x) * 4);
    }
  }
  return data;
};

const pixelAt = (
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
) => Array.from(data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4));

describe.each<ResampleKernel>(["bicubic", "lanczos"])(
  "resampleUpscale (%s)",
  (kernel) => {
    it("scales dimensions by the factor", () => {
      const result = resampleUpscale(
        image(3, 2, () => [0, 0, 0, 255]),
        3,
        2,
        4,
        kernel,
      );
      expect(result.width).toBe(12);
      expect(result.height).toBe(8);
      expect(result.data).toHaveLength(12 * 8 * 4);
    });

    it("keeps a constant image constant", () => {
      const result = resampleUpscale(
        image(4, 4, () => [10, 120, 230, 255]),
        4,
        4,
        4,
        kernel,
      );
      for (let y = 0; y < result.height; y++) {
        for (let x = 0; x < result.width; x++) {
          expect(pixelAt(result.data, result.width, x, y)).toEqual([
            10, 120, 230, 255,
          ]);
        }
      }
    });

    it("keeps a horizontal gradient monotonic", () => {
      const width = 8;
      const result = resampleUpscale(
        image(width, 1, (x) => [x * 30, x * 30, x * 30, 255]),
        width,
        1,
        4,
        kernel,
      );
      for (let x = 1; x < result.width; x++) {
        expect(result.data[x * 4]).toBeGreaterThanOrEqual(
          result.data[(x - 1) * 4],
        );
      }
    });

    it("doesn't darken colors next to transparent pixels", () => {
      // White opaque on the left, transparent black on the right.
      const result = resampleUpscale(
        image(4, 1, (x) => (x < 2 ? [255, 255, 255, 255] : [0, 0, 0, 0])),
        4,
        1,
        4,
        kernel,
      );
      for (let x = 0; x < result.width; x++) {
        const [r, g, b, a] = pixelAt(result.data, result.width, x, 0);
        if (a > 0) {
          expect([r, g, b]).toEqual([255, 255, 255]);
        }
      }
    });
  },
);

describe("resampleUpscale kernels", () => {
  it("sharpens a hard edge more with lanczos than bicubic", () => {
    const edge = image(8, 1, (x) =>
      x < 4 ? [64, 64, 64, 255] : [192, 192, 192, 255],
    );
    // Both kernels undershoot just before the edge (output 16); lanczos's
    // wider negative lobe pushes output 12 further below the dark level.
    const value = (kernel: ResampleKernel) =>
      resampleUpscale(edge, 8, 1, 4, kernel).data[12 * 4];
    expect(value("bicubic")).toBeLessThan(64);
    expect(value("lanczos")).toBeLessThan(value("bicubic"));
  });
});

describe("hasTransparency", () => {
  it("detects any non-opaque pixel", () => {
    expect(hasTransparency(image(2, 2, () => [0, 0, 0, 255]))).toBe(false);
    expect(
      hasTransparency(image(2, 2, (x, y) => [0, 0, 0, x + y === 2 ? 0 : 255])),
    ).toBe(true);
  });
});
