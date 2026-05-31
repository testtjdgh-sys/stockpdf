import { describe, expect, it } from "vitest";
import { getDbPath, getPdfPath } from "./layout";

describe("storage layout", () => {
  it("places pdfs under a ticker and year-month folder", () => {
    expect(getPdfPath("005930", "2026-05", "Samsung Electronics analyst report")).toBe(
      "data/pdfs/005930/2026-05/Samsung-Electronics-analyst-report.pdf"
    );
  });

  it("returns the sqlite path inside the data directory", () => {
    expect(getDbPath()).toBe("data/reports.sqlite");
  });
});
