import { describe, expect, it } from "vitest";
import { renderSearchPage } from "./searchPage";

describe("searchPage", () => {
  it("renders the search form and empty state", () => {
    const html = renderSearchPage([]);
    expect(html).toContain("Search reports");
    expect(html).toContain("No reports found");
  });
});
