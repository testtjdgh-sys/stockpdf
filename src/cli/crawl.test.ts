import { describe, expect, it } from "vitest";
import { buildCrawlQuery } from "./crawl";

describe("crawl cli", () => {
  it("builds a normalized query from stock name and date range", () => {
    expect(buildCrawlQuery("Samsung", "2026-05-01", "2026-05-31")).toEqual({
      stockQuery: "Samsung",
      from: "2026-05-01",
      to: "2026-05-31"
    });
  });
});
