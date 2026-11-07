import type {
  GoogleImageData,
  LocalImageData,
  ScryfallImageData,
} from "@/context/ImagesContext";
import type { PdfManifest } from "@/utils/pdf-manifest/schema";

export type ExtractedCardKind =
  /** Cropped to card + 3mm; any missing bleed was generated. */
  | "normalized"
  /** No usable bleed: the bare card, left for `addBleedEdge` to extend. */
  | "bare"
  /** Didn't match the configured card size: imported unchanged. */
  | "asIs";

export type ExtractedCard = LocalImageData & {
  /** Card centre on the page, PDF points, top-left origin. */
  center: { x: number; y: number };
  /** Bleed the image carried (smallest side), mm. */
  availableBleedMm: number;
  kind: ExtractedCardKind;
  /** Index of the image paint on its page, in content-stream order. */
  drawIndex: number;
  /** MPCFill art this card is known to be (from PDF metadata), if any. */
  remote?: GoogleImageData;
};

export type ExtractedPage = {
  width: number;
  height: number;
  /** Cards in reading order (top-to-bottom, left-to-right). */
  cards: ExtractedCard[];
  /**
   * Every image painted on the page in draw order; null where the image
   * wasn't kept (too small, skewed, failed).
   */
  draws: (ExtractedCard | null)[];
};

export type ExtractionWarnings = {
  /** Images drawn skewed (not a multiple of 90 degrees). */
  skewedSkipped: number;
  /** Images that couldn't be decoded or processed. */
  failed: number;
  /** Card-sized images that didn't match the configured card size. */
  sizeMismatch: number;
  /** Typical visible size of the mismatching images, mm. */
  mismatchSizeMm: { w: number; h: number } | null;
};

export type PdfExtraction = {
  fileName: string;
  pages: ExtractedPage[];
  warnings: ExtractionWarnings;
  /** Layout manifest embedded by this app, when present and valid. */
  manifest: PdfManifest | null;
  /** The PDF's /Producer, e.g. to spot FleemProxyCompanion output. */
  producer: string | null;
  /** Cards linked to MPCFill art via Fleem metadata. */
  fleemLinked: number;
};

/** Where an imported face comes from: a remote ref or extracted pixels. */
export type ImportedImage =
  | LocalImageData
  | GoogleImageData
  | ScryfallImageData;
