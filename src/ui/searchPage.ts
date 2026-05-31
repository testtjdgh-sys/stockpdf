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
