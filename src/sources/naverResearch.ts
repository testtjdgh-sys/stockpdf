import * as cheerio from "cheerio";
import type { SourceReportCandidate } from "./types";

const NAVER_BASE = "https://finance.naver.com";
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeCandidate(candidate: SourceReportCandidate): SourceReportCandidate {
  return {
    ...candidate,
    stockName: normalizeText(candidate.stockName),
    reportTitle: normalizeText(candidate.reportTitle),
    firmName: normalizeText(candidate.firmName)
  };
}

function normalizeDateText(dateText: string): string {
  const trimmed = normalizeText(dateText);
  const match = trimmed.match(/^(\d{2}|\d{4})\.(\d{2})\.(\d{2})$/);
  if (!match) return trimmed.replace(/\//g, "-");
  const year = match[1].length === 2 ? (Number(match[1]) >= 70 ? `19${match[1]}` : `20${match[1]}`) : match[1];
  return `${year}-${match[2]}-${match[3]}`;
}

export function buildNaverResearchUrl(params: {
  section: "company" | "industry" | "market" | "invest" | "economy" | "debenture";
  page?: number;
  ticker?: string;
  from?: string;
  to?: string;
  keyword?: string;
  searchType?: string;
  itemName?: string;
}): string {
  const page = params.page ?? 1;
  const sectionPath =
    params.section === "market" ? "market_info_list.naver" : `${params.section}_list.naver`;
  const url = new URL(`${NAVER_BASE}/research/${sectionPath}`);
  url.searchParams.set("page", String(page));
  if (params.keyword) url.searchParams.set("keyword", params.keyword);
  if (params.ticker) url.searchParams.set("itemCode", params.ticker);
  if (params.from) url.searchParams.set("writeFromDate", params.from);
  if (params.to) url.searchParams.set("writeToDate", params.to);
  if (params.searchType) url.searchParams.set("searchType", params.searchType);
  if (params.itemName) url.searchParams.set("itemName", params.itemName);
  return url.toString();
}

export function extractNaverReports(html: string, pageUrl: string): SourceReportCandidate[] {
  const $ = cheerio.load(html);
  const reports: SourceReportCandidate[] = [];

  $("tr").each((_i, rowEl) => {
    const row = $(rowEl);
    const cells = row.find("td");
    const stockAnchor = cells.eq(0).find("a[href*='/item/main.naver?code=']").first();
    const titleAnchor = cells.eq(1).find("a").first();
    const firmName = normalizeText(cells.eq(2).text());
    const pdfHref = cells.eq(3).find("a").attr("href");
    const rawDate = normalizeText(cells.eq(4).text());
    const dateText = normalizeDateText(rawDate);

    const href = titleAnchor.attr("href");
    if (!href || !pdfHref || !stockAnchor.length) return;
    if (!/^(\d{2}|\d{4})\.\d{2}\.\d{2}$/.test(rawDate)) return;

    const stockName = normalizeText(stockAnchor.text() || stockAnchor.attr("title") || "");
    const ticker = stockAnchor.attr("href") ? new URL(stockAnchor.attr("href")!, NAVER_BASE).searchParams.get("code") ?? "" : "";
    const reportTitle = normalizeText(titleAnchor.text());
    const pdfUrl = new URL(pdfHref, NAVER_BASE).toString();

    reports.push(
      normalizeCandidate({
        sourceName: "NaverResearch",
        stockName,
        ticker,
        reportTitle,
        firmName,
        reportDate: dateText,
        sourceUrl: new URL(href, pageUrl).toString(),
        pdfUrl
      })
    );
  });

  return reports;
}
