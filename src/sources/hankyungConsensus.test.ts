import { describe, expect, it } from "vitest";
import { buildHankyungConsensusUrl, extractHankyungReports } from "./hankyungConsensus";

describe("hankyungConsensus", () => {
  it("builds the consensus list url with date filters", () => {
    expect(
      buildHankyungConsensusUrl({
        from: "2026-05-01",
        to: "2026-05-31",
        page: 3,
        keyword: "삼성"
      })
    ).toBe(
      "https://consensus.hankyung.com/apps.analysis/analysis.list?page=3&search_start_date=2026-05-01&search_end_date=2026-05-31&search_keyword=%EC%82%BC%EC%84%B1"
    );
  });

  it("extracts a report row with pdf url", () => {
    const html = `
      <table>
        <tr>
          <td>2026-05-30</td>
          <td>한국투자증권</td>
          <td>삼성전자</td>
          <td><a href="/apps.analysis/report.view?mcd=123">실적 개선 기대</a></td>
          <td><a href="http://hkconsensus.hankyung.com/download/report.pdf">pdf</a></td>
        </tr>
      </table>
    `;

    expect(
      extractHankyungReports(html, "http://hkconsensus.hankyung.com/apps.analysis/analysis.list?page=1")
    ).toEqual([
      {
        sourceName: "HankyungConsensus",
        stockName: "삼성전자",
        ticker: "",
        reportTitle: "실적 개선 기대",
        firmName: "한국투자증권",
        reportDate: "2026-05-30",
        sourceUrl: "http://hkconsensus.hankyung.com/apps.analysis/report.view?mcd=123",
        pdfUrl: "http://hkconsensus.hankyung.com/download/report.pdf"
      }
    ]);
  });
});
