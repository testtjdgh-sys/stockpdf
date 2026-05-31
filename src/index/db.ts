import Database from "better-sqlite3";
import { getDbPath } from "../storage/layout";

export function openDb() {
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
