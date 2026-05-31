import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import type { Report } from "../domain/report";
import { getDbPath } from "../storage/layout";

export function openDb() {
  mkdirSync("data", { recursive: true });
  const db = new Database(getDbPath());
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      report_title TEXT NOT NULL,
      firm_name TEXT NOT NULL,
      report_date TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      pdf_url TEXT NOT NULL,
      local_file_path TEXT,
      download_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(source_name, source_url, ticker, report_date)
    )
  `);
  return db;
}

export function upsertReport(db: Database.Database, report: Report): number {
  const stmt = db.prepare(`
    INSERT INTO reports (
      stock_name, ticker, report_title, firm_name, report_date,
      source_name, source_url, pdf_url, local_file_path, download_status,
      created_at, updated_at
    ) VALUES (
      @stockName, @ticker, @reportTitle, @firmName, @reportDate,
      @sourceName, @sourceUrl, @pdfUrl, @localFilePath, @downloadStatus,
      @createdAt, @updatedAt
    )
    ON CONFLICT(source_name, source_url, ticker, report_date) DO UPDATE SET
      stock_name=excluded.stock_name,
      report_title=excluded.report_title,
      firm_name=excluded.firm_name,
      pdf_url=excluded.pdf_url,
      local_file_path=excluded.local_file_path,
      download_status=excluded.download_status,
      updated_at=excluded.updated_at
  `);
  const info = stmt.run(report);
  return Number(info.lastInsertRowid);
}

export function findReports(db: Database.Database, query: {
  stockQuery: string;
  from: string;
  to: string;
}) {
  const stmt = db.prepare(`
    SELECT * FROM reports
    WHERE (stock_name LIKE @stockLike OR ticker LIKE @stockLike)
      AND report_date >= @from
      AND report_date <= @to
    ORDER BY report_date DESC, id DESC
  `);
  return stmt.all({
    stockLike: `%${query.stockQuery}%`,
    from: query.from,
    to: query.to
  });
}
