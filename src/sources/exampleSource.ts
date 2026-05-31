import type { SourceReportCandidate } from "./types";

export function extractReportsFromHtml(html: string, baseUrl: string): SourceReportCandidate[] {
  const match = html.match(
    /<a class="report" href="([^"]+)" data-date="([^"]+)" data-ticker="([^"]+)">([^<]+)<\/a>/
  );
  if (!match) return [];

  const [, href, reportDate, ticker, text] = match;
  const url = new URL(href, baseUrl).toString();
  const stockName = text.split(" - ")[0].trim();

  return [
    {
      sourceName: "ExampleSource",
      stockName,
      ticker,
      reportTitle: text.trim(),
      firmName: "",
      reportDate,
      sourceUrl: url,
      pdfUrl: url
    }
  ];
}
