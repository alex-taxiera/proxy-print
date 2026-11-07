import type { GoogleImageData, SlotInputData } from "@/context/ImagesContext";

export type ParsedMpcFillXml = {
  slots: SlotInputData[];
  defaultCardBack: GoogleImageData | null;
};

const parseCardSection = (
  xml: Document,
  sectionName: "fronts" | "backs",
  key: "front" | "back",
  slotMap: Map<number, SlotInputData>,
) => {
  const section = xml.querySelector(sectionName);
  const cards = section?.querySelectorAll("card");
  if (!cards) {
    return;
  }

  Array.from(cards).forEach((card) => {
    const id = card.querySelector("id")?.textContent?.trim();
    const name =
      card.querySelector("name")?.textContent?.trim() ?? `${sectionName}-card`;
    const query = card.querySelector("query")?.textContent?.trim();
    const slots = card
      .querySelector("slots")
      ?.textContent?.split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value));

    if (!id || !slots || slots.length === 0) {
      return;
    }

    const image: GoogleImageData = query ? { id, name, query } : { id, name };
    slots.forEach((slotNumber) => {
      const existing = slotMap.get(slotNumber) ?? { front: null, back: null };
      slotMap.set(slotNumber, { ...existing, [key]: image });
    });
  });
};

/** Parse an MPCFill order XML into slots (in slot order) and its card back. */
export const parseMpcFillXml = (text: string): ParsedMpcFillXml => {
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const slotMap = new Map<number, SlotInputData>();

  parseCardSection(xml, "fronts", "front", slotMap);
  parseCardSection(xml, "backs", "back", slotMap);

  if (slotMap.size === 0) {
    throw new Error("No cards found in XML");
  }

  const slots = Array.from(slotMap.entries())
    .sort(([slotA], [slotB]) => slotA - slotB)
    .map(([, slot]) => slot);

  const cardbackId = xml.querySelector("cardback")?.textContent?.trim();
  const defaultCardBack = cardbackId
    ? { id: cardbackId, name: "Default Card Back" }
    : null;

  return { slots, defaultCardBack };
};
