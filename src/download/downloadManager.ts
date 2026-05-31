export function nextDownloadState(
  current: "pending" | "downloaded" | "failed",
  success: boolean
): "pending" | "downloaded" | "failed" {
  return success ? "downloaded" : "failed";
}
