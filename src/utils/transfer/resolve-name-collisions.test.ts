import { describe, expect, it } from "vitest";

import { resolveNameCollisions } from "./resolve-name-collisions";

describe("resolveNameCollisions", () => {
  it("keeps non-colliding names as-is", () => {
    const result = resolveNameCollisions(["A"], ["B", "C"], false);
    expect(result.get("B")).toBe("B");
    expect(result.get("C")).toBe("C");
  });

  it("renames colliding names with a suffix", () => {
    const result = resolveNameCollisions(["A"], ["A"], false);
    expect(result.get("A")).toBe("A (2)");
  });

  it("finds the next free suffix when several exist", () => {
    const result = resolveNameCollisions(["A", "A (2)", "A (3)"], ["A"], false);
    expect(result.get("A")).toBe("A (4)");
  });

  it("leaves collisions untouched when overwrite is true", () => {
    const result = resolveNameCollisions(["A"], ["A"], true);
    expect(result.get("A")).toBe("A");
  });
});
