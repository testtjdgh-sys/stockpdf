import { describe, expect, it } from "vitest";
import { renderSearchPage } from "./searchPage";

describe("searchPage", () => {
  it("renders the search form and empty state", () => {
    const html = renderSearchPage({
      reports: [],
      recentStocks: [{ ticker: "005930", stockName: "삼성전자" }],
      allStocks: [{ ticker: "005930", stockName: "삼성전자" }],
      stockQuery: "",
      from: "2026-05-28",
      to: "2026-05-31"
    });
    expect(html).toContain("증권사 리포트 수집기");
    expect(html).toContain("No reports found");
    expect(html).toContain("삼성전자 (005930)");
    expect(html).toContain("crawl-progress");
  });
});
