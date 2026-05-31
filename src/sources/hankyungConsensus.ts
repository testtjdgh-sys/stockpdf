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
  const url = new URL("/apps.analysis/analysis.list", HANKYUNG_BASE);
  if (params.page) url.searchParams.set("page", String(params.page));
  url.searchParams.set("search_start_date", params.from);
  url.searchParams.set("search_end_date", params.to);
  if (params.keyword) url.searchParams.set("search_keyword", params.keyword);
  if (params.skinType) url.searchParams.set("skinType", params.skinType);
  return url.toString();
}

export function extractHankyungReports(html: string, pageUrl: string): SourceReportCandidate[] {
  const $ = cheerio.load(html);
  const reports: SourceReportCandidate[] = [];

  $("tr").each((_i, rowEl) => {
    const row = $(rowEl);
    const anchors = row.find("a");
    const titleAnchor = anchors.filter((_, el) => {
      const href = $(el).attr("href") ?? "";
      return !href.includes(".pdf");
    }).first();
    const pdfAnchor = anchors.filter((_, el) => {
      const href = $(el).attr("href") ?? "";
      return href.includes(".pdf");
    }).first();

    const href = titleAnchor.attr("href");
    const title = normalizeText(titleAnchor.text());
    if (!href || !title) return;

    const cells = row.find("td");
    const dateText = normalizeText(cells.eq(0).text() || cells.eq(1).text());
    const firmName = normalizeText(cells.eq(1).text());
    const stockName = normalizeText(cells.eq(2).text() || title);
    const pdfHref = pdfAnchor.attr("href");
    const pdfUrl = pdfHref ? new URL(pdfHref, pageUrl).toString() : "";
    const reportDate = dateText.match(/\d{4}[-/.]\d{2}[-/.]\d{2}/)?.[0]?.replace(/\//g, "-") ?? "";
    if (!pdfUrl || !reportDate) return;

    reports.push({
      sourceName: "HankyungConsensus",
      stockName,
      ticker: "",
      reportTitle: title,
      firmName,
      reportDate,
      sourceUrl: new URL(href, pageUrl).toString(),
      pdfUrl
    });
  });

  return reports;
}
