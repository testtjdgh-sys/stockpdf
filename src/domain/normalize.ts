import type { Report } from "./report";

export function normalizeReport(
  input: Omit<Report, "id" | "localFilePath" | "downloadStatus">
): Report {
  return {
    ...input,
    localFilePath: null,
    downloadStatus: "pending"
  };
}
