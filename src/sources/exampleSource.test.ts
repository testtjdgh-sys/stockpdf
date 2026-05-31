import { describe, expect, it } from "vitest";
import { extractReportsFromHtml } from "./exampleSource";

describe("exampleSource", () => {
  it("extracts one report from a listing page", () => {
    const html = `
      <a class="report" href="/r/1.pdf" data-date="2026-05-30" data-ticker="005930">
        Samsung Electronics - Initiation Coverage
      </a>
    `;

    expect(extractReportsFromHtml(html, "https://example.com")).toEqual([
      {
        sourceName: "ExampleSource",
        stockName: "Samsung Electronics",
        ticker: "005930",
        reportTitle: "Samsung Electronics - Initiation Coverage",
        firmName: "",
        reportDate: "2026-05-30",
        sourceUrl: "https://example.com/r/1.pdf",
        pdfUrl: "https://example.com/r/1.pdf"
      }
    ]);
  });
});
