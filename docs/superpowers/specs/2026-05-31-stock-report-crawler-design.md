# Stock Report Crawler Design

## Goal

Build a personal local tool that lets the user search by `stock name/ticker + date range`, automatically collect publicly available securities analyst report PDFs, save them locally, and search the collected reports from a simple local UI.

The first version is intentionally small and practical:

- local-only usage
- public pages only
- PDF download and metadata indexing
- search by stock name and date range
- a lightweight local web UI for browsing results

## Scope

### In Scope

- Crawl public securities report pages for PDF links.
- Normalize results into one shared report shape.
- Download PDFs to local storage.
- Store report metadata in a local database.
- Provide a local UI for searching and opening reports.
- Support manual runs first, with room for scheduled runs later.

### Out of Scope

- Login-protected or paywalled sources.
- Multi-user accounts or permissions.
- Cloud sync.
- OCR or full-text extraction from PDF bodies in the first version.
- Heavy browser automation unless a source absolutely requires it later.

## User Flow

1. The user enters a stock name or ticker and a date range.
2. The app searches supported public report pages.
3. Matching report links are normalized into a common schema.
4. PDFs are downloaded to local storage if not already present.
5. Metadata is written to a local database.
6. The local UI shows the matched reports and lets the user open the PDF.

## Architecture

### 1. Source Adapters

Each public report source gets its own adapter.

Responsibilities:

- fetch listing pages
- discover report links
- extract source-specific metadata when available
- return results in a standard format

This keeps source-specific HTML logic isolated so one site change does not spread through the rest of the app.

### 2. Report Normalizer

Converts adapter output into a shared report schema.

Standard fields:

- stock name
- ticker
- report title
- securities firm
- report date
- source URL
- PDF URL
- local file path
- source identifier

This layer ensures the rest of the app only deals with one shape, even if source pages differ a lot.

### 3. Download Manager

Handles PDF download and local file storage.

Responsibilities:

- avoid duplicate downloads
- store files in a predictable folder layout
- record the final local path
- retry transient network failures

Suggested storage layout:

- `data/pdfs/<ticker>/<yyyy-mm>/<normalized-file-name>.pdf`

### 4. Local Index

A small SQLite database stores report metadata and download state.

Responsibilities:

- search by stock name or ticker
- filter by date range
- track source URL and PDF URL
- prevent duplicate entries
- track whether the PDF is already downloaded

### 5. Local Search UI

A lightweight local web UI displays matching reports.

Core features:

- search field for stock name or ticker
- date range filters
- results list with report title, date, source, and file status
- open PDF action

The UI should stay simple and readable rather than becoming a full dashboard.

## Data Model

### Report Record

Minimum fields:

- `id`
- `stockName`
- `ticker`
- `reportTitle`
- `firmName`
- `reportDate`
- `sourceName`
- `sourceUrl`
- `pdfUrl`
- `localFilePath`
- `downloadStatus`
- `createdAt`
- `updatedAt`

### De-duplication Rule

A report is considered the same record when the combination of:

- normalized source name
- normalized source URL or PDF URL
- ticker
- report date

matches an existing record.

## Error Handling

- If a source page changes structure, the adapter should fail locally and not break other sources.
- If a PDF download fails, the metadata record should remain with a failed status so the user can retry later.
- If no reports are found for a query, the UI should show a clear empty state instead of an error.
- If the same report is discovered twice, the app should keep one record and skip the duplicate download.

## Search Behavior

Search should support:

- stock name partial match
- ticker exact or partial match
- inclusive date range filter

The first version does not need full-text PDF search. The indexed metadata is enough to satisfy the initial use case.

## Implementation Approach

Recommended approach:

1. Start with direct HTML crawling for a small set of public report pages.
2. Keep each source isolated behind an adapter interface.
3. Use SQLite for metadata and local filtering.
4. Build a minimal local web UI on top of the index.

This gives the simplest reliable version while keeping the code ready for more sources later.

## Testing Strategy

### Unit Tests

- normalize source-specific entries into the shared report schema
- de-duplication logic
- date filtering and query matching

### Integration Tests

- source adapter against saved sample HTML fixtures
- download manager against a mocked HTTP response
- SQLite indexing and query flow

### Manual Verification

- run a crawl for one stock and one date range
- confirm PDFs are saved locally
- confirm the same query returns the saved records in the UI

## Risks

- Public report pages may change HTML structure over time.
- Some sources may render links dynamically and require a fallback mechanism later.
- Metadata quality may vary across sites, so the first version should tolerate partial data.

## Milestones

1. Project scaffold and local storage layout.
2. One working source adapter.
3. SQLite index and deduplication.
4. PDF download pipeline.
5. Local search UI.
6. Add more public sources as adapters.
