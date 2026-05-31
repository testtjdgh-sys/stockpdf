import { createServer } from "node:http";
import { openDb, findReports, findReportsWithoutDate, getRecentStocks, getAllStocks } from "../index/db";
import { crawlReports, crawlProgress } from "../cli/crawl";
import { renderSearchPage } from "./searchPage";

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseBody(body: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body));
}

function toReportRow(row: any) {
  return {
    id: row.id,
    stockName: row.stock_name,
    ticker: row.ticker,
    reportTitle: row.report_title,
    firmName: row.firm_name,
    reportDate: row.report_date,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    pdfUrl: row.pdf_url,
    localFilePath: row.local_file_path,
    downloadStatus: row.download_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function dedupeReports(rows: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const row of rows) {
    const key = [row.stock_name, row.ticker, row.report_title, row.firm_name, row.report_date, row.source_name, row.pdf_url].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function loadReports(db: any, stockQuery: string, from: string, to: string) {
  console.log(`[LOAD] Querying reports: stockQuery="${stockQuery}", from="${from}", to="${to}"`);
  const filtered = dedupeReports(findReports(db, { stockQuery, from, to }));
  console.log(`[LOAD] Found ${filtered.length} reports with date filter`);
  if (filtered.length > 0 || !stockQuery.trim()) {
    return filtered;
  }
  const withoutDate = dedupeReports(findReportsWithoutDate(db, stockQuery));
  console.log(`[LOAD] Found ${withoutDate.length} reports without date filter`);
  return withoutDate;
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const db = openDb();
  const today = getTodayIso();

  if (req.method === "POST" && url.pathname === "/crawl") {
    const body = parseBody(await req.text());
    const stockQuery = body.stockQuery?.trim() || "";
    const from = body.from || today;
    const to = body.to || today;
    
    // Start crawl in background without blocking
    crawlReports(stockQuery, from, to).catch(error => {
      console.error('Crawl error:', error);
    });
    
    db.close();
    return new Response(
      JSON.stringify({ status: 'started' }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method === "GET" && url.pathname === "/") {
    const stockQuery = url.searchParams.get("stockQuery") ?? "";
    const from = url.searchParams.get("from") ?? today;
    const to = url.searchParams.get("to") ?? today;
    const reports = stockQuery.trim() ? loadReports(db, stockQuery, from, to) : [];
    const recentStocks = getRecentStocks(db);
    const allStocks = getAllStocks(db);
    db.close();
    return new Response(
      renderSearchPage({
        reports: reports.map(toReportRow),
        recentStocks,
        allStocks,
        stockQuery,
        from,
        to
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (req.method === "GET" && url.pathname === "/progress") {
    return new Response(JSON.stringify(crawlProgress), {
      headers: { "Content-Type": "application/json" }
    });
  }

  db.close();
  return new Response("Not found", { status: 404 });
}

export function startServer(port = 3000) {
  const server = createServer(async (req, res) => {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    });
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: body
    });
    const response = await handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  server.listen(port);
  return server;
}
