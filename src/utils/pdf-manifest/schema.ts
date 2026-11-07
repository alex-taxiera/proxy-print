// A small JSON manifest embedded (as a PDF attachment) in every PDF this app
// generates. It records which slot and face each drawn image belongs to and
// where remote images came from, so re-importing our own PDF restores the
// project exactly instead of guessing from page geometry.
//
// Treat a manifest read from a PDF as untrusted input: everything is length-
// limited, and remote refs are restricted to the hosts the app already uses.
import * as zod from "zod";

import type {
  CardSlot,
  GoogleImageData,
  ImageData,
  ScryfallImageData,
} from "@/context/ImagesContext";
import { getIsEmptyImage } from "@/context/ImagesContext";
import type { PreviewPage } from "@/hooks/usePreviewData";

export const PDF_MANIFEST_FILENAME = "proxy-print-manifest.json";
export const PDF_MANIFEST_FORMAT = "proxy-print/pdf-manifest";
export const PDF_MANIFEST_VERSION = 1;

const name = zod.string().max(512);

const RefSchema = zod.discriminatedUnion("kind", [
  zod.object({
    kind: zod.literal("google"),
    id: zod.string().regex(/^[\w-]{1,128}$/),
    name,
    query: name.optional(),
  }),
  zod.object({
    kind: zod.literal("scryfall"),
    uri: zod
      .string()
      .max(2048)
      .regex(/^https:\/\/([a-z0-9-]+\.)*scryfall\.(io|com)\//i),
    name,
  }),
  zod.object({ kind: zod.literal("local"), name }),
]);

export type PdfManifestRef = zod.infer<typeof RefSchema>;

export const PdfManifestSchema = zod.object({
  format: zod.literal(PDF_MANIFEST_FORMAT),
  formatVersion: zod.literal(PDF_MANIFEST_VERSION),
  cardSizeMm: zod.object({
    w: zod.number().positive().max(1000),
    h: zod.number().positive().max(1000),
  }),
  defaultCardBack: RefSchema.nullable(),
  slots: zod
    .array(
      zod.object({
        front: RefSchema.nullable(),
        back: RefSchema.nullable(),
      }),
    )
    .max(20_000),
  pages: zod
    .array(
      zod.object({
        pageType: zod.enum(["front", "back", "side-by-side"]),
        /** Images drawn on the page, in draw order. */
        items: zod
          .array(
            zod.object({
              slot: zod.number().int().nonnegative(),
              face: zod.enum(["front", "back"]),
              /** Drawn from the default card back rather than the slot. */
              defaultBack: zod.boolean().optional(),
            }),
          )
          .max(500),
      }),
    )
    .max(20_000),
});

export type PdfManifest = zod.infer<typeof PdfManifestSchema>;

export const toManifestRef = (image: ImageData): PdfManifestRef => {
  if ("id" in image) {
    const ref: PdfManifestRef = {
      kind: "google",
      id: image.id,
      name: image.name,
    };
    return image.query ? { ...ref, query: image.query } : ref;
  }
  if ("uri" in image)
    return { kind: "scryfall", uri: image.uri, name: image.name };
  return { kind: "local", name: image.file.name };
};

/** Turn a remote manifest ref back into image data; local refs have none. */
export const fromManifestRef = (
  ref: PdfManifestRef,
): GoogleImageData | ScryfallImageData | null => {
  if (ref.kind === "google") {
    return ref.query
      ? { id: ref.id, name: ref.name, query: ref.query }
      : { id: ref.id, name: ref.name };
  }
  if (ref.kind === "scryfall") return { uri: ref.uri, name: ref.name };
  return null;
};

/**
 * Build the manifest for a PDF about to be generated from these preview
 * pages. Only non-empty items are listed, because only those are drawn.
 */
export const buildPdfManifest = ({
  pages,
  sortedSlots,
  defaultCardBack,
  cardSizeMm,
}: {
  pages: PreviewPage[];
  sortedSlots: CardSlot[];
  defaultCardBack: ImageData | null;
  cardSizeMm: { w: number; h: number };
}): PdfManifest => {
  const slotIndex = new Map(sortedSlots.map((slot, i) => [slot.id, i]));

  return {
    format: PDF_MANIFEST_FORMAT,
    formatVersion: PDF_MANIFEST_VERSION,
    cardSizeMm,
    defaultCardBack: defaultCardBack ? toManifestRef(defaultCardBack) : null,
    slots: sortedSlots.map((slot) => ({
      front: slot.front ? toManifestRef(slot.front) : null,
      back: slot.back ? toManifestRef(slot.back) : null,
    })),
    pages: pages.map((page) => ({
      pageType: page.pageType,
      items: page.items.flatMap((item) => {
        if (getIsEmptyImage(item.image) || item.slotId === null) return [];
        const slot = slotIndex.get(item.slotId);
        if (slot === undefined) return [];
        const defaultBack =
          item.face === "back" && item.image.uuid.endsWith(":back-preview");
        return [
          defaultBack
            ? { slot, face: item.face, defaultBack: true }
            : { slot, face: item.face },
        ];
      }),
    })),
  };
};
