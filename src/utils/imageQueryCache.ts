import { createStore, del, get, set } from "idb-keyval";

import type { ImageQueryData } from "@/queries/images";

const imageStore = createStore("proxy-print-image-cache", "images");
const toKey = (queryKey: readonly unknown[]) => JSON.stringify(queryKey);

export const persistImageQueryData = (
  queryKey: readonly unknown[],
  data: ImageQueryData,
) => set(toKey(queryKey), data, imageStore);

export const hydrateImageQueryData = async (
  queryKey: readonly unknown[],
): Promise<ImageQueryData | null> => {
  const data = await get<ImageQueryData>(toKey(queryKey), imageStore);
  return data ?? null;
};

export const removeImageQueryData = (queryKey: readonly unknown[]) =>
  del(toKey(queryKey), imageStore);
