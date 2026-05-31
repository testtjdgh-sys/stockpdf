export type DownloadStatus = "pending" | "downloaded" | "failed";

export interface Report {
  id?: number;
  stockName: string;
  ticker: string;
  reportTitle: string;
  firmName: string;
  reportDate: string;
  sourceName: string;
  sourceUrl: string;
  pdfUrl: string;
  localFilePath: string | null;
  downloadStatus: DownloadStatus;
  createdAt?: string;
  updatedAt?: string;
}
