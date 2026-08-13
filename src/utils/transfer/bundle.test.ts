import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/context/SettingsContext";

import { buildBundle } from "./build-bundle";
import { BundleParseError, parseBundle } from "./parse-bundle";
import { FORMAT_VERSION } from "./schema";

const pngBlob = (byte: number) =>
  new Blob([new Uint8Array([byte])], { type: "image/png" });

// JSZip's "blob" output type depends on browser-only feature detection
// (FileReader etc.), so tests generate as arraybuffer and wrap manually.
const zipToBlob = async (zip: JSZip): Promise<Blob> => {
  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
  return new Blob([arrayBuffer]);
};

describe("buildBundle / parseBundle round trip", () => {
  it("round-trips a preset with a base PDF and a local card back", async () => {
    const pdfBytes = new Uint8Array([1, 2, 3, 4]);
    const cardBackBlob = pngBlob(9);

    const blob = await buildBundle({
      presets: [
        {
          name: "My Preset",
          settings: DEFAULT_SETTINGS,
          basePdf: { name: "template.pdf", pageCount: 2, bytes: pdfBytes },
          defaultCardBack: {
            kind: "local",
            hash: "abc123",
            fileName: "back.png",
            mimeType: "image/png",
            blob: cardBackBlob,
          },
        },
      ],
      images: [],
    });

    const parsed = await parseBundle(blob);
    expect(parsed.presets).toHaveLength(1);
    const [preset] = parsed.presets;
    expect(preset.name).toBe("My Preset");
    expect(preset.settings).toEqual(DEFAULT_SETTINGS);
    expect(preset.basePdf).toEqual({
      name: "template.pdf",
      pageCount: 2,
      path: "presets/0/base.pdf",
    });
    expect(preset.basePdfBytes).toEqual(pdfBytes);
    expect(preset.defaultCardBack?.kind).toBe("local");
    expect(await preset.defaultCardBackBlob?.arrayBuffer()).toEqual(
      await cardBackBlob.arrayBuffer(),
    );
  });

  it("round-trips a project with null slots and deduped images", async () => {
    const cardBlob = pngBlob(1);

    const blob = await buildBundle({
      projects: [
        {
          name: "My Project",
          slots: [
            { front: "google:abc", back: null },
            { front: null, back: null },
            { front: "google:abc", back: "google:abc" },
          ],
        },
      ],
      images: [
        {
          id: "google:abc",
          ref: {
            kind: "google",
            id: "abc",
            name: "Some Card",
            mimeType: "image/png",
          },
          blob: cardBlob,
        },
      ],
    });

    const parsed = await parseBundle(blob);
    expect(parsed.projects).toHaveLength(1);
    expect(parsed.projects[0].slots).toEqual([
      { front: "google:abc", back: null },
      { front: null, back: null },
      { front: "google:abc", back: "google:abc" },
    ]);
    expect(Object.keys(parsed.images)).toEqual(["google:abc"]);
    expect(await parsed.images["google:abc"].blob?.arrayBuffer()).toEqual(
      await cardBlob.arrayBuffer(),
    );
  });

  it("carries opt-in settings on a project export", async () => {
    const blob = await buildBundle({
      projects: [{ name: "P", slots: [] }],
      settings: DEFAULT_SETTINGS,
      images: [],
    });
    const parsed = await parseBundle(blob);
    expect(parsed.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps a reference-only image entry when no blob is available", async () => {
    const blob = await buildBundle({
      projects: [{ name: "P", slots: [{ front: "local:hash1", back: null }] }],
      images: [
        {
          id: "local:hash1",
          ref: {
            kind: "local",
            hash: "hash1",
            fileName: "missing.png",
            mimeType: "image/png",
          },
          blob: null,
        },
      ],
    });

    const parsed = await parseBundle(blob);
    expect(parsed.images["local:hash1"].blob).toBeNull();
    expect(parsed.images["local:hash1"].kind).toBe("local");
  });

  it("rejects a malformed manifest", async () => {
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify({ not: "a bundle" }));
    const blob = await zipToBlob(zip);

    await expect(parseBundle(blob)).rejects.toBeInstanceOf(BundleParseError);
  });

  it("rejects an unknown format version", async () => {
    const zip = new JSZip();
    zip.file(
      "manifest.json",
      JSON.stringify({
        format: "proxy-print/bundle",
        formatVersion: FORMAT_VERSION + 1,
        images: {},
      }),
    );
    const blob = await zipToBlob(zip);

    await expect(parseBundle(blob)).rejects.toThrow(/newer or incompatible/);
  });

  it("rejects a file that isn't a zip at all", async () => {
    const blob = new Blob(["not a zip"], { type: "text/plain" });
    await expect(parseBundle(blob)).rejects.toBeInstanceOf(BundleParseError);
  });
});
