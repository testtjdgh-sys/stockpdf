import iconv from "iconv-lite";
import { normalizeReport } from "../domain/normalize";
import type { Report } from "../domain/report";
import { openDb, upsertReport } from "../index/db";
import { buildHankyungConsensusUrl, extractHankyungReports } from "../sources/hankyungConsensus";
import { buildNaverResearchUrl, extractNaverReports } from "../sources/naverResearch";
import type { SourceReportCandidate } from "../sources/types";

export let crawlProgress = { current: 0, total: 0, percentage: 0, isRunning: false };

export function buildCrawlQuery(stockQuery: string, from: string, to: string) {
  return { stockQuery, from, to };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const charset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();
  if (charset && charset !== "utf-8" && charset !== "utf8") {
    return iconv.decode(buffer, charset as any);
  }
  return buffer.toString("utf8");
}

async function collectCandidates(stockQuery: string, from: string, to: string): Promise<SourceReportCandidate[]> {
  console.log(`[COLLECT] Starting collection for ${stockQuery} from ${from} to ${to}`);
  const candidates: SourceReportCandidate[] = [];

  // Check if stockQuery is a ticker code (6 digits)
  const isTicker = /^\d{6}$/.test(stockQuery);
  console.log(`[COLLECT] isTicker: ${isTicker}`);

  // Naver research with pagination
  const naverSections = ["company", "industry", "market", "invest"] as const;
  for (const section of naverSections) {
    let page = 1;
    let hasMore = true;
    let sectionCount = 0;
    console.log(`[NAVER] Starting section: ${section}`);
    while (hasMore) {
      try {
        const url = buildNaverResearchUrl({
          section,
          keyword: isTicker ? undefined : stockQuery,
          ticker: isTicker ? stockQuery : undefined,
          searchType: isTicker ? "itemCode" : undefined,
          itemName: isTicker ? stockQuery : undefined,
          from,
          to,
          page
        });
        console.log(`[NAVER] Fetching ${section} page ${page}: ${url}`);
        const html = await fetchText(url);
        const reports = extractNaverReports(html, url);
        console.log(`[NAVER] ${section} page ${page}: found ${reports.length} reports`);
        if (reports.length === 0) {
          hasMore = false;
        } else {
          candidates.push(...reports);
          sectionCount += reports.length;
          page++;
          // Safety limit to prevent infinite loops
          if (page > 10) {
            console.warn(`[NAVER] Reached page limit (${page}) for section ${section}, found ${sectionCount} total`);
            hasMore = false;
          }
        }
      } catch (error) {
        console.warn(`[NAVER] Skipping ${section} page ${page}: ${(error as Error).message}`);
        hasMore = false;
      }
    }
    console.log(`[NAVER] Section ${section} complete: ${sectionCount} reports`);
  }

  // Hankyung consensus with pagination
  try {
    let page = 1;
    let hasMore = true;
    let hankyungCount = 0;
    console.log(`[HANKYUNG] Starting Hankyung consensus`);
    while (hasMore) {
      try {
        const url = buildHankyungConsensusUrl({ from, to, keyword: stockQuery, skinType: "company", page });
        console.log(`[HANKYUNG] Fetching page ${page}: ${url}`);
        const html = await fetchText(url);
        const reports = extractHankyungReports(html, url);
        console.log(`[HANKYUNG] Page ${page}: found ${reports.length} reports`);
        if (reports.length === 0) {
          hasMore = false;
        } else {
          candidates.push(...reports);
          hankyungCount += reports.length;
          page++;
          // Safety limit to prevent infinite loops
          if (page > 10) {
            console.warn(`[HANKYUNG] Reached page limit (${page}), found ${hankyungCount} total`);
            hasMore = false;
          }
        }
      } catch (error) {
        console.warn(`[HANKYUNG] Skipping page ${page}: ${(error as Error).message}`);
        hasMore = false;
      }
    }
    console.log(`[HANKYUNG] Complete: ${hankyungCount} reports`);
  } catch (error) {
    console.warn(`[HANKYUNG] Error: ${(error as Error).message}`);
  }

  console.log(`[COLLECT] Total candidates before filtering: ${candidates.length}`);

  // Filter candidates to match the search query and date range
  const filtered = candidates.filter(candidate => {
    // Check if candidate matches the stock query
    const matchesStock = isTicker 
      ? candidate.ticker === stockQuery 
      : candidate.stockName.includes(stockQuery) || stockQuery.includes(candidate.stockName);
    
    // Check if candidate is within date range
    const reportDate = new Date(candidate.reportDate);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const withinDateRange = reportDate >= fromDate && reportDate <= toDate;
    
    return matchesStock && withinDateRange;
  });

  console.log(`[COLLECT] Total candidates after filtering: ${filtered.length}`);
  return filtered;
}

function toFinalReport(candidate: SourceReportCandidate): Report {
  return normalizeReport({
    sourceName: candidate.sourceName,
    stockName: candidate.stockName,
    ticker: candidate.ticker,
    reportTitle: candidate.reportTitle,
    firmName: candidate.firmName,
    reportDate: candidate.reportDate,
    sourceUrl: candidate.sourceUrl,
    pdfUrl: candidate.pdfUrl
  });
}

export async function crawlReports(stockQuery: string, from: string, to: string) {
  console.log(`[CRAWL START] stockQuery: ${stockQuery}, from: ${from}, to: ${to}`);
  const db = openDb();

  crawlProgress = { current: 0, total: 0, percentage: 0, isRunning: true };

  const candidates = await collectCandidates(stockQuery, from, to);
  console.log(`[CRAWL] Found ${candidates.length} candidates`);
  const saved: Report[] = [];
  const total = candidates.length;
  crawlProgress.total = total;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const report = toFinalReport(candidate);
    const finalReport: Report = {
      ...report,
      localFilePath: null,
      downloadStatus: "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    upsertReport(db, finalReport);
    saved.push(finalReport);
    
    crawlProgress.current = i + 1;
    crawlProgress.percentage = Math.round(((i + 1) / total) * 100);
    console.log(`진행률: ${crawlProgress.percentage}% (${i + 1}/${total}) - ${report.stockName}: ${report.reportTitle}`);
  }

  crawlProgress.isRunning = false;
  db.close();
  console.log(`[CRAWL END] Saved ${saved.length} reports`);
  return saved;
}
