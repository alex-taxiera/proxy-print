import { createContext } from "react";

export type GoogleImageData = {
  id: string;
  name: string;
};

export type LocalImageData = {
  file: File;
  hash: string;
};

export type ScryfallImageData = {
  uri: string;
  name: string;
};

export type EmptyImageData = {
  name: "empty";
};

export type ImageData = GoogleImageData | LocalImageData | ScryfallImageData;

export type SlotInputData = {
  front: ImageData | null;
  back: ImageData | null;
};

export type ProjectData = {
  slots: SlotInputData[];
};

export type ProjectsMap = Record<string, ProjectData>;

export type BaseImage = {
  uuid: string;
};

export type Image = BaseImage & ImageData;

export type PossiblyEmptyImage = BaseImage & (ImageData | EmptyImageData);

export type CardSlot = {
  id: string;
  front: Image | null;
  back: Image | null;
  position: number;
};

export type CardSlotsMap = Map<string, CardSlot>;

export type LocalImage = BaseImage & LocalImageData;

export type DownloadableImage = {
  uuid: string;
} & (GoogleImageData | ScryfallImageData);

export const getIsLocalImage = (image: PossiblyEmptyImage) => {
  return "file" in image;
};

export const getIsDownloadableImage = (image: PossiblyEmptyImage) => {
  return "id" in image || "uri" in image;
};

export const getIsGoogleImage = (image: PossiblyEmptyImage) => {
  return "id" in image;
};

export const getIsScryfallImage = (image: PossiblyEmptyImage) => {
  return "uri" in image;
};

export const getIsEmptyImage = (
  image: PossiblyEmptyImage,
): image is BaseImage & EmptyImageData => {
  return "name" in image && image.name === "empty";
};

export const getIsImage = (image: PossiblyEmptyImage): image is Image => {
  return !getIsEmptyImage(image);
};

export const getSortedSlots = (slots: CardSlotsMap): CardSlot[] => {
  return Array.from(slots.values()).sort((a, b) => a.position - b.position);
};

export const getFronts = (slots: CardSlotsMap): Image[] => {
  return getSortedSlots(slots)
    .map((slot) => slot.front)
    .filter((image): image is Image => image !== null);
};

export const getBacks = (slots: CardSlotsMap): Image[] => {
  return getSortedSlots(slots)
    .map((slot) => slot.back)
    .filter((image): image is Image => image !== null);
};

export type ImagesContextValue = {
  slots: CardSlotsMap;
  sortedSlots: CardSlot[];
  images: Image[];
  imagesWithError: DownloadableImage[];
  isRendering: boolean;
  setIsRendering: React.Dispatch<React.SetStateAction<boolean>>;
  onReorderSlots: (slotIds: string[], newPosition: number) => void;
  onReorder: (images: Image[], newIndex: number) => void;
  /** Move slots to an absolute index, inserting empty gap-filler slots if the
   * target index is beyond the current end of the list. */
  onMoveSlotToAbsoluteIndex: (
    slotIds: string[],
    targetAbsoluteIndex: number,
  ) => void;
  onAdd: (
    files: (LocalImageData | GoogleImageData | ScryfallImageData)[],
    index?: number,
  ) => void;
  onAddSlots: (slots: SlotInputData[], index?: number) => void;
  onAddBack: (
    slotId: string,
    data: LocalImageData | GoogleImageData | ScryfallImageData,
  ) => void;
  onReplaceScryfallPrinting: (
    slotId: string,
    data: { front: ScryfallImageData; back: ScryfallImageData | null },
  ) => Promise<void>;
  onRemoveBack: (slotId: string) => void;
  onInsertEmptySlot: (position: number) => void;
  onError: (image: DownloadableImage) => void;
  onRemove: (uuid: string) => void;
  onClear: (uuids?: string[]) => void;
  onClearErrors: () => void;
  projects: ProjectsMap;
  activeProjectName: string | null;
  isProjectDirty: boolean;
  isLoadingProject: boolean;
  saveProject: (name: string) => void;
  loadProject: (name: string) => void;
  deleteProject: (name: string) => void;
};

export const ImagesContext = createContext<ImagesContextValue>({
  slots: new Map(),
  sortedSlots: [],
  images: [],
  imagesWithError: [],
  isRendering: false,
  setIsRendering: () => {},
  onReorderSlots: () => {},
  onReorder: () => {},
  onAdd: () => {},
  onAddSlots: () => {},
  onAddBack: () => {},
  onReplaceScryfallPrinting: async () => {},
  onRemoveBack: () => {},
  onInsertEmptySlot: () => {},
  onMoveSlotToAbsoluteIndex: () => {},
  onError: () => {},
  onRemove: () => {},
  onClear: () => {},
  onClearErrors: () => {},
  projects: {},
  activeProjectName: null,
  isProjectDirty: false,
  isLoadingProject: false,
  saveProject: () => {},
  loadProject: () => {},
  deleteProject: () => {},
});
