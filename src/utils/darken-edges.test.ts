import { describe, expect, it } from "vitest";

import { darkenEdgePixels, getEdgeBandPx } from "./darken-edges";

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

describe("darkenEdgePixels", () => {
  const band = { top: 1, bottom: 2, left: 1, right: 1 };

  it("flattens near-black pixels inside the band to pure black", () => {
    const data = image(6, 6, () => [20, 10, 29, 255]);
    darkenEdgePixels(data, 6, 6, band);

    expect(pixelAt(data, 6, 0, 0)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(data, 6, 3, 0)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(data, 6, 5, 3)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(data, 6, 3, 4)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(data, 6, 3, 5)).toEqual([0, 0, 0, 255]);
  });

  it("leaves near-black pixels outside the band alone", () => {
    const data = image(6, 6, () => [20, 10, 29, 255]);
    darkenEdgePixels(data, 6, 6, band);

    expect(pixelAt(data, 6, 1, 1)).toEqual([20, 10, 29, 255]);
    expect(pixelAt(data, 6, 4, 3)).toEqual([20, 10, 29, 255]);
  });

  it("leaves pixels with any channel at or above the threshold alone", () => {
    const data = image(6, 6, () => [10, 10, 30, 255]);
    darkenEdgePixels(data, 6, 6, band);

    expect(pixelAt(data, 6, 0, 0)).toEqual([10, 10, 30, 255]);
  });

  it("preserves alpha", () => {
    const data = image(6, 6, () => [5, 5, 5, 0]);
    darkenEdgePixels(data, 6, 6, band);

    expect(pixelAt(data, 6, 0, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe("getEdgeBandPx", () => {
  it("scales with resolution", () => {
    const low = getEdgeBandPx(10);
    const high = getEdgeBandPx(40);

    expect(low).toEqual({ top: 20, bottom: 85, left: 10, right: 10 });
    expect(high).toEqual({ top: 80, bottom: 340, left: 40, right: 40 });
  });

  it("extends every side by the inset for images that include bleed", () => {
    expect(getEdgeBandPx(10, 3)).toEqual({
      top: 50,
      bottom: 115,
      left: 40,
      right: 40,
    });
  });
});
