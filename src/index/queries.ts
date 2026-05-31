export function isDuplicateKey(input: {
  sourceName: string;
  sourceUrl: string;
  ticker: string;
  reportDate: string;
}): boolean {
  return Boolean(input.sourceName && input.sourceUrl && input.ticker && input.reportDate);
}

export function reportInsertSql(): string {
  return `
    INSERT INTO reports (
      stock_name, ticker, report_title, firm_name, report_date,
      source_name, source_url, pdf_url, local_file_path, download_status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
}
