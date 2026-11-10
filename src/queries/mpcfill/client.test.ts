import { describe, expect, it } from "vitest";

import {
  buildSearchSettings,
  getMpcFillThumbnailUris,
  MpcFillRequestError,
  parseCardsResponse,
  parseSearchV2Response,
  parseSearchV3Response,
  parseSourcesResponse,
} from "@/queries/mpcfill/client";

const sources = [
  { pk: 1, name: "MrTeferi", sourceType: "Google Drive" },
  { pk: 3, name: "Chilli_Axe", sourceType: "Google Drive" },
];

describe("parseSourcesResponse", () => {
  it("reads the sources out of the keyed map", () => {
    expect(
      parseSourcesResponse({
        results: {
          "1": {
            pk: 1,
            key: "MrTeferi",
            name: "MrTeferi",
            sourceType: "Google Drive",
            description: "",
          },
        },
      }),
    ).toEqual([{ pk: 1, name: "MrTeferi", sourceType: "Google Drive" }]);
  });

  it("rejects a reply that isn't MPC Autofill's", () => {
    expect(() => parseSourcesResponse({ hello: "world" })).toThrow(
      MpcFillRequestError,
    );
  });
});

describe("buildSearchSettings", () => {
  it("enables every source in server order by default", () => {
    const settings = buildSearchSettings(sources, {
      fuzzySearch: false,
      sourceId: null,
    });

    expect(settings.sourceSettings.sources).toEqual([
      [1, true],
      [3, true],
    ]);
    expect(settings.searchTypeSettings).toEqual({
      fuzzySearch: false,
      filterCardbacks: false,
    });
    expect(settings.filterSettings.excludesTags).toEqual(["NSFW"]);
  });

  it("narrows to one source when asked", () => {
    const settings = buildSearchSettings(sources, {
      fuzzySearch: true,
      sourceId: 3,
    });

    expect(settings.sourceSettings.sources).toEqual([
      [1, false],
      [3, true],
    ]);
    expect(settings.searchTypeSettings.fuzzySearch).toBe(true);
  });
});

describe("search response parsing", () => {
  it("reads the keyed reply of /3/editorSearch/", () => {
    expect(parseSearchV3Response({ results: { q: ["a", "b"] } })).toEqual([
      "a",
      "b",
    ]);
    expect(parseSearchV3Response({ results: {} })).toEqual([]);
  });

  it("reads the legacy reply of /2/editorSearch/ by query and type", () => {
    const raw = {
      results: { "lightning bolt": { CARD: ["a", "b"] } },
    };

    expect(parseSearchV2Response(raw, "lightning bolt", "CARD")).toEqual([
      "a",
      "b",
    ]);
    expect(parseSearchV2Response(raw, "lightning bolt", "TOKEN")).toEqual([]);
  });

  it("accepts a legacy reply keyed differently from the query sent", () => {
    expect(
      parseSearchV2Response(
        { results: { "Lightning Bolt": { CARD: ["a"] } } },
        "lightning bolt",
        "CARD",
      ),
    ).toEqual(["a"]);
  });

  it("treats a legacy reply with no entry as no results", () => {
    expect(parseSearchV2Response({ results: {} }, "nope", "CARD")).toEqual([]);
  });
});

describe("parseCardsResponse", () => {
  const card = {
    identifier: "abc",
    name: "Lightning Bolt (Full Art B)",
    extension: "png",
    searchq: "lightning bolt",
    sourceName: "Chilli_Axe",
    sourceType: "Google Drive",
    dpi: 1210,
    smallThumbnailUrl: "https://drive.google.com/thumbnail?sz=w400-h400&id=abc",
    // Fields the deployed and repository builds disagree on are ignored.
    downloadLink: "https://drive.google.com/uc?id=abc&export=download",
  };

  it("returns cards in the order they were asked for", () => {
    const cards = parseCardsResponse(
      { results: { abc: card, def: { ...card, identifier: "def" } } },
      ["def", "abc"],
    );

    expect(cards.map((c) => c.identifier)).toEqual(["def", "abc"]);
    expect(cards[1]).toMatchObject({
      name: "Lightning Bolt (Full Art B)",
      dpi: 1210,
      searchq: "lightning bolt",
    });
  });

  it("skips ids the server left out and cards it can't read", () => {
    const cards = parseCardsResponse(
      { results: { abc: card, bad: { name: 5 } } },
      ["abc", "missing", "bad"],
    );

    expect(cards.map((c) => c.identifier)).toEqual(["abc"]);
  });
});

describe("getMpcFillThumbnailUris", () => {
  const card = {
    identifier: "abc",
    name: "Opt",
    extension: "png",
    searchq: "opt",
    sourceName: "MrTeferi",
    sourceType: "Google Drive",
    smallThumbnailUrl: "https://drive.google.com/thumbnail?sz=w400-h400&id=abc",
  };

  it("tries the thumbnail bucket, then the worker, then the backend URL", () => {
    expect(getMpcFillThumbnailUris(card)).toEqual([
      "https://img.mpcautofill.com/abc-small-google_drive",
      "https://cdn.mpcautofill.com/images/google_drive/small/abc.jpg",
      "https://drive.google.com/thumbnail?sz=w400-h400&id=abc",
    ]);
  });

  it("only uses the backend URL for sources that aren't Google Drive", () => {
    expect(getMpcFillThumbnailUris({ ...card, sourceType: "AWS S3" })).toEqual([
      "https://drive.google.com/thumbnail?sz=w400-h400&id=abc",
    ]);
  });

  it("ignores a backend thumbnail URL that isn't https", () => {
    expect(
      getMpcFillThumbnailUris({
        ...card,
        sourceType: "Local File",
        smallThumbnailUrl: "javascript:alert(1)",
      }),
    ).toEqual([]);
  });
});
