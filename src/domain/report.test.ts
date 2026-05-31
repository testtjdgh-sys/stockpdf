import { describe, expect, it } from "vitest";
import { normalizeReport } from "./normalize";

describe("normalizeReport", () => {
  it("fills the shared report shape from a source entry", () => {
    const report = normalizeReport({
      sourceName: "ExampleSource",
      stockName: "Samsung Electronics",
      ticker: "005930",
      reportTitle: "Initiation Coverage",
      firmName: "ABC Securities",
      reportDate: "2026-05-30",
      sourceUrl: "https://example.com/report/1",
      pdfUrl: "https://example.com/report/1.pdf"
    });

    expect(report.sourceName).toBe("ExampleSource");
    expect(report.downloadStatus).toBe("pending");
    expect(report.localFilePath).toBeNull();
  });
});
