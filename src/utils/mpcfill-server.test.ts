import { describe, expect, it } from "vitest";

import {
  DEFAULT_MPCFILL_SERVER_URL,
  migrateMpcFillServerV13,
  normalizeMpcFillServerUrl,
} from "@/utils/mpcfill-server";

describe("normalizeMpcFillServerUrl", () => {
  it("keeps only the origin", () => {
    expect(normalizeMpcFillServerUrl(" https://mpcfill.com/editor?x=1 ")).toBe(
      "https://mpcfill.com",
    );
  });

  it("assumes https when no scheme is given", () => {
    expect(normalizeMpcFillServerUrl("mpcfill.com")).toBe(
      "https://mpcfill.com",
    );
  });

  it("allows http only for a backend on this machine", () => {
    expect(normalizeMpcFillServerUrl("http://localhost:8000")).toBe(
      "http://localhost:8000",
    );
    expect(normalizeMpcFillServerUrl("http://127.0.0.1:8000/")).toBe(
      "http://127.0.0.1:8000",
    );
    expect(normalizeMpcFillServerUrl("http://mpcfill.com")).toBeNull();
    expect(normalizeMpcFillServerUrl("http://192.168.1.10:8000")).toBeNull();
  });

  it("rejects other schemes, credentials and nonsense", () => {
    expect(normalizeMpcFillServerUrl("ftp://mpcfill.com")).toBeNull();
    expect(normalizeMpcFillServerUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeMpcFillServerUrl("https://user:pw@mpcfill.com")).toBeNull();
    expect(normalizeMpcFillServerUrl("")).toBeNull();
    expect(normalizeMpcFillServerUrl("not a url")).toBeNull();
  });
});

describe("migrateMpcFillServerV13", () => {
  it("adds the default server to state saved before v13", () => {
    const state = { activeProjectName: "Deck", projects: {} };

    expect(migrateMpcFillServerV13(state)).toEqual({
      ...state,
      mpcFillServerUrl: DEFAULT_MPCFILL_SERVER_URL,
    });
  });

  it("keeps a valid server that is already there", () => {
    expect(
      migrateMpcFillServerV13({ mpcFillServerUrl: "http://localhost:8000" })
        .mpcFillServerUrl,
    ).toBe("http://localhost:8000");
  });

  it("replaces a server it can't use", () => {
    expect(
      migrateMpcFillServerV13({ mpcFillServerUrl: "ftp://example.com" })
        .mpcFillServerUrl,
    ).toBe(DEFAULT_MPCFILL_SERVER_URL);
  });
});
