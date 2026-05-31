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
  const candidates: SourceReportCandidate[] = [];

  // Check if stockQuery is a ticker code (6 digits)
  const isTicker = /^\d{6}$/.test(stockQuery);

  // Naver research with pagination
  const naverSections = ["company", "industry", "market", "invest"] as const;
  for (const section of naverSections) {
    let page = 1;
    let hasMore = true;
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
        const html = await fetchText(url);
        const reports = extractNaverReports(html, url);
        if (reports.length === 0) {
          hasMore = false;
        } else {
          candidates.push(...reports);
          page++;
          // Safety limit to prevent infinite loops
          if (page > 100) {
            console.warn(`Reached page limit (${page}) for section ${section}`);
            hasMore = false;
          }
        }
      } catch (error) {
        console.warn(`Skipping Naver ${section} page ${page}: ${(error as Error).message}`);
        hasMore = false;
      }
    }
  }

  // Hankyung consensus
  try {
    const url = buildHankyungConsensusUrl({ from, to, keyword: stockQuery, skinType: "company" });
    const html = await fetchText(url);
    candidates.push(...extractHankyungReports(html, url));
  } catch (error) {
    console.warn(`Skipping Hankyung consensus: ${(error as Error).message}`);
  }

  // Filter candidates to match the search query
  const filtered = candidates.filter(candidate => {
    if (isTicker) {
      return candidate.ticker === stockQuery;
    } else {
      // Match stock name exactly or partially
      return candidate.stockName.includes(stockQuery) || stockQuery.includes(candidate.stockName);
    }
  });

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
  const db = openDb();

  crawlProgress = { current: 0, total: 0, percentage: 0, isRunning: true };

  const candidates = await collectCandidates(stockQuery, from, to);
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
    console.log(`진행률: ${crawlProgress.percentage}% (${i + 1}/${total})`);
  }

  crawlProgress.isRunning = false;
  db.close();
  return saved;
}
