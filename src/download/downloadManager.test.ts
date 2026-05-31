import { describe, expect, it } from "vitest";
import { nextDownloadState } from "./downloadManager";

describe("downloadManager", () => {
  it("marks a successful download as downloaded", () => {
    expect(nextDownloadState("pending", true)).toBe("downloaded");
  });

  it("marks a failed download as failed", () => {
    expect(nextDownloadState("pending", false)).toBe("failed");
  });
});
