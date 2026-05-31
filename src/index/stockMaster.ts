import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { openDb, replaceStockMaster } from "./db";

const KRX_STOCK_MASTER_URL = "https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13";

export interface StockMasterRow {
  ticker: string;
  stockName: string;
  marketName: string;
  industryName: string;
  listingDate: string;
  updatedAt: string;
}

export function parseKrXStockMaster(html: string): StockMasterRow[] {
  const $ = cheerio.load(html);
  const rows: StockMasterRow[] = [];

  $("table tr")
    .slice(1)
    .each((_, tr) => {
      const cells = $(tr)
        .find("td")
        .map((_, td) => $(td).text().trim())
        .get();
      if (cells.length < 10) return;
      const [stockName, marketName, ticker, industryName, , listingDate] = cells;
      if (!ticker || !stockName) return;
      rows.push({
        ticker,
        stockName,
        marketName,
        industryName,
        listingDate,
        updatedAt: new Date().toISOString()
      });
    });

  return rows;
}

export async function fetchKrXStockMaster(): Promise<StockMasterRow[]> {
  const response = await fetch(KRX_STOCK_MASTER_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch KRX stock master: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const html = iconv.decode(buffer, "euc-kr");
  return parseKrXStockMaster(html);
}

export async function syncKrXStockMaster() {
  const db = openDb();
  try {
    const rows = await fetchKrXStockMaster();
    replaceStockMaster(db, rows);
    return rows.length;
  } finally {
    db.close();
  }
}
