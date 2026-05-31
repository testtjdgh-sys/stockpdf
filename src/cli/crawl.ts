import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import iconv from "iconv-lite";
import { normalizeReport } from "../domain/normalize";
import type { Report } from "../domain/report";
import { openDb, upsertReport } from "../index/db";
import { getPdfPath } from "../storage/layout";
import { buildHankyungConsensusUrl, extractHankyungReports } from "../sources/hankyungConsensus";
import { buildNaverResearchUrl, extractNaverReports } from "../sources/naverResearch";
import type { SourceReportCandidate } from "../sources/types";
import { downloadPdf } from "../download/downloadManager";

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
    return iconv.decode(buffer, charset as iconv.KnownEncoding);
  }
  return buffer.toString("utf8");
}

async function collectCandidates(stockQuery: string, from: string, to: string): Promise<SourceReportCandidate[]> {
  const urls = [
    buildNaverResearchUrl({ section: "company", keyword: stockQuery, from, to }),
    buildNaverResearchUrl({ section: "industry", keyword: stockQuery, from, to }),
    buildNaverResearchUrl({ section: "market", keyword: stockQuery, from, to }),
    buildNaverResearchUrl({ section: "invest", keyword: stockQuery, from, to }),
    buildHankyungConsensusUrl({ from, to, keyword: stockQuery, skinType: "company" })
  ];

  const candidates: SourceReportCandidate[] = [];
  for (const url of urls) {
    try {
      const html = await fetchText(url);
      if (url.includes("finance.naver.com")) {
        candidates.push(...extractNaverReports(html, url));
      } else {
        candidates.push(...extractHankyungReports(html, url));
      }
    } catch (error) {
      console.warn(`Skipping source ${url}: ${(error as Error).message}`);
    }
  }
  return candidates;
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
  await mkdir("data/pdfs", { recursive: true });

  const candidates = await collectCandidates(stockQuery, from, to);
  const saved: Report[] = [];

  for (const candidate of candidates) {
    const report = toFinalReport(candidate);
    const yearMonth = report.reportDate.slice(0, 7);
    const localFilePath = getPdfPath(report.ticker || "unknown", yearMonth, report.reportTitle);
    const success = await downloadPdf(report.pdfUrl, localFilePath);
    const finalReport: Report = {
      ...report,
      localFilePath: success ? localFilePath : null,
      downloadStatus: success ? "downloaded" : "failed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    upsertReport(db, finalReport);
    saved.push(finalReport);
  }

  db.close();
  return saved;
}
