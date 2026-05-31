import { describe, expect, it } from "vitest";
import { isDuplicateKey, reportInsertSql } from "./queries";

describe("queries", () => {
  it("treats source name, source url, ticker, and date as the duplicate key", () => {
    expect(
      isDuplicateKey({
        sourceName: "A",
        sourceUrl: "https://a",
        ticker: "005930",
        reportDate: "2026-05-30"
      })
    ).toBe(true);
  });

  it("builds the insert statement for reports", () => {
    expect(reportInsertSql()).toContain("INSERT INTO reports");
  });
});
