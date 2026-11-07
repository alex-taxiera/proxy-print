// Builds an MPCFill order XML from the project's slots, so a project made of
// MPCFill images can be taken back to MPCFill (or another tool that reads its
// XML). Only Google Drive (MPCFill) images can be referenced; everything else
// is skipped and counted.
import type {
  GoogleImageData,
  ImageData,
  SlotInputData,
} from "@/context/ImagesContext";

/** MakePlayingCards order sizes; an order is rounded up to the next one. */
export const MPC_BRACKETS = [
  18, 36, 55, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 396, 504, 612,
] as const;

export const bracketFor = (quantity: number): number | null =>
  MPC_BRACKETS.find((bracket) => bracket >= quantity) ?? null;

const isGoogle = (
  image: ImageData | null | undefined,
): image is GoogleImageData => !!image && "id" in image;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const queryFor = (image: GoogleImageData) =>
  (image.query ?? image.name.replace(/\.[a-z0-9]+$/i, "")).toLowerCase();

type Group = { image: GoogleImageData; slots: number[] };

const addTo = (
  groups: Map<string, Group>,
  image: GoogleImageData,
  slot: number,
) => {
  const group = groups.get(image.id);
  if (group) group.slots.push(slot);
  else groups.set(image.id, { image, slots: [slot] });
};

const cardXml = ({ image, slots }: Group) =>
  [
    "        <card>",
    `            <id>${escapeXml(image.id)}</id>`,
    `            <slots>${slots.join(",")}</slots>`,
    `            <name>${escapeXml(image.name)}</name>`,
    `            <query>${escapeXml(queryFor(image))}</query>`,
    "        </card>",
  ].join("\n");

export type MpcFillXmlOptions = {
  stock?: string;
  foil?: boolean;
};

export type MpcFillXmlResult = {
  xml: string;
  /** Slots written to the XML. */
  exported: number;
  /** Slots left out because their front isn't an MPCFill image. */
  skipped: number;
  /** Backs left out because they aren't MPCFill images. */
  skippedBacks: number;
};

export const buildMpcFillXml = (
  slots: SlotInputData[],
  defaultCardBack: ImageData | null,
  { stock = "(S30) Standard Smooth", foil = false }: MpcFillXmlOptions = {},
): MpcFillXmlResult => {
  const fronts = new Map<string, Group>();
  const backs = new Map<string, Group>();
  let exported = 0;
  let skipped = 0;
  let skippedBacks = 0;

  for (const slot of slots) {
    if (!slot.front) continue;
    if (!isGoogle(slot.front)) {
      skipped++;
      continue;
    }
    const index = exported++;
    addTo(fronts, slot.front, index);
    if (isGoogle(slot.back)) addTo(backs, slot.back, index);
    else if (slot.back) skippedBacks++;
  }

  const bracket = bracketFor(exported);
  if (exported > 0 && bracket === null) {
    throw new Error(
      `MPCFill orders are limited to ${MPC_BRACKETS[MPC_BRACKETS.length - 1]} cards`,
    );
  }

  const lines = [
    "<order>",
    "    <details>",
    `        <quantity>${exported}</quantity>`,
    `        <bracket>${bracket ?? MPC_BRACKETS[0]}</bracket>`,
    `        <stock>${escapeXml(stock)}</stock>`,
    `        <foil>${foil ? "true" : "false"}</foil>`,
    "    </details>",
    "    <fronts>",
    ...Array.from(fronts.values()).map(cardXml),
    "    </fronts>",
  ];
  if (backs.size > 0) {
    lines.push(
      "    <backs>",
      ...Array.from(backs.values()).map(cardXml),
      "    </backs>",
    );
  }
  lines.push(
    `    <cardback>${isGoogle(defaultCardBack) ? escapeXml(defaultCardBack.id) : ""}</cardback>`,
    "</order>",
    "",
  );

  return { xml: lines.join("\n"), exported, skipped, skippedBacks };
};
