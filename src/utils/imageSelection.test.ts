import { describe, expect, it } from "vitest";

import { getIsAllSelected, reconcileSelection } from "./imageSelection";

describe("reconcileSelection", () => {
  it("keeps uuids that still have a card", () => {
    expect(reconcileSelection(["a", "b"], new Set(["a", "b", "c"]))).toEqual([
      "a",
      "b",
    ]);
  });

  it("drops uuids whose cards were removed", () => {
    expect(reconcileSelection(["a", "b"], new Set(["b"]))).toEqual(["b"]);
  });

  it("empties the selection when every selected card is removed", () => {
    expect(reconcileSelection(["a", "b"], new Set())).toEqual([]);
  });

  it("does not carry a stale selection onto newly added cards", () => {
    const selected = reconcileSelection(["a", "b"], new Set());
    expect(reconcileSelection(selected, new Set(["c", "d"]))).toEqual([]);
  });

  it("preserves selection order", () => {
    expect(
      reconcileSelection(["c", "a", "b"], new Set(["a", "b", "c"])),
    ).toEqual(["c", "a", "b"]);
  });
});

describe("getIsAllSelected", () => {
  it("is true when every card is selected", () => {
    expect(getIsAllSelected(3, 3)).toBe(true);
  });

  it("is false when only some cards are selected", () => {
    expect(getIsAllSelected(1, 3)).toBe(false);
  });

  it("is false when there are no cards", () => {
    expect(getIsAllSelected(0, 0)).toBe(false);
  });
});
