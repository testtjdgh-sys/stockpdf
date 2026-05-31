import * as cheerio from "cheerio";
import type { SourceReportCandidate } from "./types";

const HANKYUNG_BASE = "https://consensus.hankyung.com";

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function buildHankyungConsensusUrl(params: {
  page?: number;
  from: string;
  to: string;
  keyword?: string;
  skinType?: string;
}): string {
  const url = new URL("/analysis/list", HANKYUNG_BASE);
  url.searchParams.set("sdate", params.from);
  url.searchParams.set("edate", params.to);
  url.searchParams.set("now_page", String(params.page ?? 1));
  url.searchParams.set("search_value", "REPORT_TITLE");
  url.searchParams.set("search_text", params.keyword ?? "");
  if (params.skinType) url.searchParams.set("report_type", params.skinType);
  return url.toString();
}

export function extractHankyungReports(html: string, pageUrl: string): SourceReportCandidate[] {
  const $ = cheerio.load(html);
  const reports: SourceReportCandidate[] = [];

  $("a[href^='/analysis/downpdf?report_idx='], a[href*='/analysis/downpdf?report_idx=']").each((_i, el) => {
    const pdfHref = $(el).attr("href");
    if (!pdfHref) return;
    const pdfUrl = new URL(pdfHref, pageUrl).toString();
    const title = normalizeText($(el).attr("title") ?? $(el).text());
    const row = $(el).closest("tr");
    const surroundingText = normalizeText(row.text() || $(el).parent().text());
    const cells = row.find("td");
    const stockFromCell = normalizeText(cells.eq(2).text());
    const reportDate = surroundingText.match(/\d{4}\.\d{1,2}\.\d{1,2}|\d{4}-\d{2}-\d{2}/)?.[0]?.replace(/\./g, "-") ?? "";
    const stockMatch = surroundingText.match(/\((\d{6})\)/);
    const ticker = stockMatch?.[1] ?? "";
    const stockName = stockFromCell || (stockMatch ? normalizeText(surroundingText.replace(stockMatch[0], "")) : title);
    if (!reportDate) return;

    reports.push({
      sourceName: "HankyungConsensus",
      stockName,
      ticker,
      reportTitle: title.replace(/\.pdf$/i, ""),
      firmName: "",
      reportDate,
      sourceUrl: pdfUrl,
      pdfUrl
    });
  });

  return reports;
}
