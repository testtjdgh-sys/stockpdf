import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export function nextDownloadState(
  current: "pending" | "downloaded" | "failed",
  success: boolean
): "pending" | "downloaded" | "failed" {
  return success ? "downloaded" : "failed";
}

export async function downloadPdf(pdfUrl: string, localFilePath: string): Promise<boolean> {
  try {
    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(dirname(localFilePath), { recursive: true });
    await writeFile(localFilePath, buffer);
    return true;
  } catch {
    return false;
  }
}
