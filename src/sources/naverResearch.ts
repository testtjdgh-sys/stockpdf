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

export function buildNaverResearchUrl(params: {
  section: "company" | "industry" | "market" | "invest" | "economy" | "debenture";
  page?: number;
  ticker?: string;
  from?: string;
  to?: string;
  keyword?: string;
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
  return url.toString();
}

export function extractNaverReports(html: string, pageUrl: string): SourceReportCandidate[] {
  const $ = cheerio.load(html);
  const reports: SourceReportCandidate[] = [];

  $("td a[href*='company_read.naver'], td a[href*='industry_read.naver'], td a[href*='market_info_read.naver'], td a[href*='invest_read.naver'], td a[href*='economy_read.naver'], td a[href*='debenture_read.naver']").each(
    (_i, el) => {
      const title = normalizeText($(el).text());
      const href = $(el).attr("href");
      if (!href) return;

      const row = $(el).closest("tr");
      const cells = row.find("td");
      const firmName = normalizeText(cells.eq(2).text());
      const dateText = normalizeText(cells.eq(4).text());
      const pdfHref = row.find("a[href^='https://stock.pstatic.net/stock-research']").attr("href");
      const stockHref = row.find("a[href*='/item/main.naver?code=']").attr("href");
      const stockName = stockHref ? normalizeText(row.find("a[href*='/item/main.naver?code=']").text()) : title;
      const ticker = stockHref ? new URL(stockHref, NAVER_BASE).searchParams.get("code") ?? "" : "";
      const pdfUrl = pdfHref ? new URL(pdfHref, NAVER_BASE).toString() : new URL(href, pageUrl).toString();

      if (!dateText || !pdfUrl) return;
      reports.push(
        normalizeCandidate({
          sourceName: "NaverResearch",
          stockName,
          ticker,
          reportTitle: title,
          firmName,
          reportDate: dateText,
          sourceUrl: new URL(href, pageUrl).toString(),
          pdfUrl
        })
      );
    }
  );

  return reports;
}
