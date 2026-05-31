const DATA_DIR = "data";

function normalizeFileName(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPdfPath(ticker: string, yearMonth: string, title: string): string {
  return `${DATA_DIR}/pdfs/${ticker}/${yearMonth}/${normalizeFileName(title)}.pdf`;
}

export function getDbPath(): string {
  return `${DATA_DIR}/reports.sqlite`;
}
