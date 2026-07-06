import { describe, expect, it } from "vitest";

import {
  extractWorkId,
  mapEditionsToCoverOptions,
  mapOpenLibraryDoc,
} from "../book-search";

describe("mapOpenLibraryDoc", () => {
  it("maps a fully populated doc", () => {
    const result = mapOpenLibraryDoc({
      key: "/works/OL45883W",
      title: "Dune",
      author_name: ["Frank Herbert"],
      first_publish_year: 1965,
      number_of_pages_median: 412,
      cover_i: 12345,
    });

    expect(result).toEqual({
      openLibraryKey: "/works/OL45883W",
      title: "Dune",
      author: "Frank Herbert",
      publishedYear: 1965,
      totalPages: 412,
      coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
    });
  });

  it("falls back to an empty cover URL when cover_i is missing", () => {
    const result = mapOpenLibraryDoc({ key: "/works/OL1W", title: "Untitled" });
    expect(result.coverUrl).toBe("");
  });

  it("joins multiple authors and defaults to an empty string when missing", () => {
    const withAuthors = mapOpenLibraryDoc({
      key: "/works/OL2W",
      title: "Good Omens",
      author_name: ["Terry Pratchett", "Neil Gaiman"],
    });
    expect(withAuthors.author).toBe("Terry Pratchett, Neil Gaiman");

    const withoutAuthors = mapOpenLibraryDoc({ key: "/works/OL3W", title: "Anon" });
    expect(withoutAuthors.author).toBe("");
  });

  it("defaults published year and total pages to null when missing", () => {
    const result = mapOpenLibraryDoc({ key: "/works/OL4W", title: "Mystery" });
    expect(result.publishedYear).toBeNull();
    expect(result.totalPages).toBeNull();
  });

  it("prefers the language-matched edition's cover over the work-level cover_i", () => {
    const result = mapOpenLibraryDoc({
      key: "/works/OL27258W",
      title: "Neuromancer",
      cover_i: 283860,
      editions: { docs: [{ cover_i: 8904053 }] },
    });
    expect(result.coverUrl).toBe(
      "https://covers.openlibrary.org/b/id/8904053-M.jpg"
    );
  });

  it("falls back to the work-level cover_i when no matched edition has a cover", () => {
    const result = mapOpenLibraryDoc({
      key: "/works/OL5W",
      title: "No Match",
      cover_i: 111,
      editions: { docs: [{}] },
    });
    expect(result.coverUrl).toBe("https://covers.openlibrary.org/b/id/111-M.jpg");
  });
});

describe("extractWorkId", () => {
  it("extracts the work id from a well-formed key", () => {
    expect(extractWorkId("/works/OL27258W")).toBe("OL27258W");
  });

  it("returns null for malformed or non-work keys", () => {
    expect(extractWorkId("/books/OL123M")).toBeNull();
    expect(extractWorkId("not-a-key")).toBeNull();
    expect(extractWorkId("")).toBeNull();
  });
});

describe("mapEditionsToCoverOptions", () => {
  it("maps covers with their edition language", () => {
    const options = mapEditionsToCoverOptions([
      { key: "/books/OL1M", covers: [111], languages: [{ key: "/languages/fin" }] },
      { key: "/books/OL2M", covers: [222], languages: [{ key: "/languages/eng" }] },
    ]);

    expect(options).toEqual([
      {
        coverId: 222,
        coverUrl: "https://covers.openlibrary.org/b/id/222-M.jpg",
        language: "eng",
      },
      {
        coverId: 111,
        coverUrl: "https://covers.openlibrary.org/b/id/111-M.jpg",
        language: "fin",
      },
    ]);
  });

  it("surfaces English-language covers first without dropping others", () => {
    const options = mapEditionsToCoverOptions([
      { key: "/books/OL1M", covers: [1], languages: [{ key: "/languages/fra" }] },
      { key: "/books/OL2M", covers: [2], languages: [{ key: "/languages/eng" }] },
      { key: "/books/OL3M", covers: [3] },
    ]);

    expect(options.map((option) => option.coverId)).toEqual([2, 1, 3]);
  });

  it("drops the -1 no-cover sentinel", () => {
    const options = mapEditionsToCoverOptions([
      { key: "/books/OL1M", covers: [-1] },
    ]);
    expect(options).toEqual([]);
  });

  it("deduplicates cover ids reused across editions", () => {
    const options = mapEditionsToCoverOptions([
      { key: "/books/OL1M", covers: [999], languages: [{ key: "/languages/eng" }] },
      { key: "/books/OL2M", covers: [999], languages: [{ key: "/languages/eng" }] },
    ]);
    expect(options).toHaveLength(1);
  });

  it("treats a missing languages field as no language", () => {
    const options = mapEditionsToCoverOptions([{ key: "/books/OL1M", covers: [1] }]);
    expect(options[0].language).toBeNull();
  });

  it("returns an empty list for editions with no covers", () => {
    expect(mapEditionsToCoverOptions([{ key: "/books/OL1M" }])).toEqual([]);
    expect(mapEditionsToCoverOptions([])).toEqual([]);
  });
});
