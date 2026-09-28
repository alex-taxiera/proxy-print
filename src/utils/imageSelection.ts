/**
 * Selection is held as uuids rather than image objects, so it has to be
 * reconciled against the cards that still exist. Cards leave the grid in
 * several ways that never touch the selection — deleting them, loading a
 * project, a download failing — and a leftover uuid would otherwise resurface
 * as a phantom selection against whatever is added next.
 */
export const reconcileSelection = (
  selectedUuids: string[],
  existingUuids: ReadonlySet<string>,
): string[] => selectedUuids.filter((uuid) => existingUuids.has(uuid));

/** An empty grid is never "all selected", even though the counts match. */
export const getIsAllSelected = (selectedCount: number, imageCount: number) =>
  imageCount > 0 && selectedCount === imageCount;
