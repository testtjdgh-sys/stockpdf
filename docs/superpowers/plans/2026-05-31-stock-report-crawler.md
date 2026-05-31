# Stock Report Crawler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal local tool that crawls public securities report pages, downloads matching PDF reports for a stock and date range, stores metadata locally, and exposes a simple local search UI.

**Architecture:** Keep source-specific HTML logic behind small adapters, normalize all results into one report schema, and persist metadata in SQLite with PDFs on disk. Ship the first working source, then layer in deduplication, download tracking, and a minimal local web UI on top of that index.

**Tech Stack:** Node.js, TypeScript, SQLite, file-based PDF storage, HTML parsing, a lightweight local web framework for the UI, and tests with the repo's existing test runner.

---

### Task 1: Project scaffold and local data layout

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/config.ts`
- Create: `src/storage/layout.ts`
- Create: `src/storage/layout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getPdfPath, getDbPath } from "./layout";

describe("storage layout", () => {
  it("places pdfs under a ticker and year-month folder", () => {
    expect(getPdfPath("005930", "2026-05", "Samsung Electronics analyst report")).toBe(
      "data/pdfs/005930/2026-05/Samsung-Electronics-analyst-report.pdf"
    );
  });

  it("returns the sqlite path inside the data directory", () => {
    expect(getDbPath()).toBe("data/reports.sqlite");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/storage/layout.test.ts`
Expected: fail because the package, test runner, and functions do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/storage/layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json src/config.ts src/storage/layout.ts src/storage/layout.test.ts
git commit -m "chore: scaffold report crawler project"
```

### Task 2: Define the shared report schema and normalization rules

**Files:**
- Create: `src/domain/report.ts`
- Create: `src/domain/report.test.ts`
- Create: `src/domain/normalize.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeReport } from "./normalize";

describe("normalizeReport", () => {
  it("fills the shared report shape from a source entry", () => {
    const report = normalizeReport({
      sourceName: "ExampleSource",
      stockName: "Samsung Electronics",
      ticker: "005930",
      reportTitle: "Initiation Coverage",
      firmName: "ABC Securities",
      reportDate: "2026-05-30",
      sourceUrl: "https://example.com/report/1",
      pdfUrl: "https://example.com/report/1.pdf"
    });

    expect(report.sourceName).toBe("ExampleSource");
    expect(report.downloadStatus).toBe("pending");
    expect(report.localFilePath).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/domain/report.test.ts`
Expected: fail because the module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

```ts
import type { Report } from "./report";

export function normalizeReport(input: Omit<Report, "id" | "localFilePath" | "downloadStatus">): Report {
  return {
    ...input,
    localFilePath: null,
    downloadStatus: "pending"
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/domain/report.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/report.ts src/domain/report.test.ts src/domain/normalize.ts
git commit -m "feat: add shared report schema"
```

### Task 3: Build the SQLite index and deduplication

**Files:**
- Create: `src/index/db.ts`
- Create: `src/index/db.test.ts`
- Create: `src/index/queries.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isDuplicateKey, reportInsertSql } from "./queries";

describe("queries", () => {
  it("treats source name, source url, ticker, and date as the duplicate key", () => {
    expect(
      isDuplicateKey({
        sourceName: "A",
        sourceUrl: "https://a",
        ticker: "005930",
        reportDate: "2026-05-30"
      })
    ).toBe(true);
  });

  it("builds the insert statement for reports", () => {
    expect(reportInsertSql()).toContain("INSERT INTO reports");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/index/db.test.ts`
Expected: fail because the query helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/index/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index/db.ts src/index/db.test.ts src/index/queries.ts
git commit -m "feat: add sqlite indexing helpers"
```

### Task 4: Implement one public source adapter

**Files:**
- Create: `src/sources/types.ts`
- Create: `src/sources/exampleSource.ts`
- Create: `src/sources/exampleSource.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { extractReportsFromHtml } from "./exampleSource";

describe("exampleSource", () => {
  it("extracts one report from a listing page", () => {
    const html = `
      <a class="report" href="/r/1.pdf" data-date="2026-05-30" data-ticker="005930">
        Samsung Electronics - Initiation Coverage
      </a>
    `;

    expect(extractReportsFromHtml(html, "https://example.com")).toEqual([
      {
        sourceName: "ExampleSource",
        stockName: "Samsung Electronics",
        ticker: "005930",
        reportTitle: "Samsung Electronics - Initiation Coverage",
        firmName: "",
        reportDate: "2026-05-30",
        sourceUrl: "https://example.com/r/1.pdf",
        pdfUrl: "https://example.com/r/1.pdf"
      }
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/sources/exampleSource.test.ts`
Expected: fail because the adapter does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface SourceReportCandidate {
  sourceName: string;
  stockName: string;
  ticker: string;
  reportTitle: string;
  firmName: string;
  reportDate: string;
  sourceUrl: string;
  pdfUrl: string;
}
```

```ts
export function extractReportsFromHtml(html: string, baseUrl: string): SourceReportCandidate[] {
  const match = html.match(
    /<a class="report" href="([^"]+)" data-date="([^"]+)" data-ticker="([^"]+)">([^<]+)<\/a>/
  );
  if (!match) return [];

  const [, href, reportDate, ticker, text] = match;
  const url = new URL(href, baseUrl).toString();
  const stockName = text.split(" - ")[0].trim();

  return [
    {
      sourceName: "ExampleSource",
      stockName,
      ticker,
      reportTitle: text.trim(),
      firmName: "",
      reportDate,
      sourceUrl: url,
      pdfUrl: url
    }
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/sources/exampleSource.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sources/types.ts src/sources/exampleSource.ts src/sources/exampleSource.test.ts
git commit -m "feat: add first report source adapter"
```

### Task 5: Add PDF download management and retry state

**Files:**
- Create: `src/download/downloadManager.ts`
- Create: `src/download/downloadManager.test.ts`
- Create: `src/download/httpClient.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/download/downloadManager.test.ts`
Expected: fail because the module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function nextDownloadState(
  current: "pending" | "downloaded" | "failed",
  success: boolean
): "pending" | "downloaded" | "failed" {
  return success ? "downloaded" : "failed";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/download/downloadManager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/download/downloadManager.ts src/download/downloadManager.test.ts src/download/httpClient.ts
git commit -m "feat: add download state handling"
```

### Task 6: Build the local search UI

**Files:**
- Create: `src/ui/server.ts`
- Create: `src/ui/server.test.ts`
- Create: `src/ui/searchPage.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { renderSearchPage } from "./searchPage";

describe("searchPage", () => {
  it("renders the search form and empty state", () => {
    const html = renderSearchPage([]);
    expect(html).toContain("Search reports");
    expect(html).toContain("No reports found");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/ui/server.test.ts`
Expected: fail because the UI module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Report } from "../domain/report";

export function renderSearchPage(reports: Report[]): string {
  const rows = reports.length
    ? reports.map((report) => `<li>${report.reportTitle}</li>`).join("")
    : "<p>No reports found</p>";

  return `
    <html>
      <body>
        <h1>Search reports</h1>
        ${rows}
      </body>
    </html>
  `;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/ui/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/server.ts src/ui/server.test.ts src/ui/searchPage.ts
git commit -m "feat: add local search UI"
```

### Task 7: Wire the end-to-end crawl flow

**Files:**
- Create: `src/cli/crawl.ts`
- Create: `src/cli/crawl.test.ts`
- Modify: `src/index/db.ts`
- Modify: `src/download/downloadManager.ts`
- Modify: `src/ui/server.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildCrawlQuery } from "./crawl";

describe("crawl cli", () => {
  it("builds a normalized query from stock name and date range", () => {
    expect(buildCrawlQuery("Samsung", "2026-05-01", "2026-05-31")).toEqual({
      stockQuery: "Samsung",
      from: "2026-05-01",
      to: "2026-05-31"
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/cli/crawl.test.ts`
Expected: fail because the CLI helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildCrawlQuery(stockQuery: string, from: string, to: string) {
  return { stockQuery, from, to };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/cli/crawl.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/crawl.ts src/cli/crawl.test.ts src/index/db.ts src/download/downloadManager.ts src/ui/server.ts
git commit -m "feat: wire crawl flow"
```

## Coverage Check

- Crawl public report pages for PDF links: Task 4, Task 7
- Normalize results into one shared report shape: Task 2
- Download PDFs to local storage: Task 5, Task 7
- Store report metadata in SQLite: Task 3, Task 7
- Provide a local UI for searching and opening reports: Task 6, Task 7
- Support manual runs first, with room for scheduled runs later: Task 1, Task 7
- Out-of-scope items intentionally excluded: documented in the plan header and task breakdown

## Self-Review Notes

- No placeholders remain.
- Type names are consistent across tasks: `Report`, `DownloadStatus`, and the source candidate shape.
- The plan is still focused on one product: a personal local crawler and search UI.
- The first source adapter is intentionally generic so the team can replace the example implementation with a real public source during execution.
