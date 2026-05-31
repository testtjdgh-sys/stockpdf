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
      "https://consensus.hankyung.com/analysis/list?sdate=2026-05-01&edate=2026-05-31&now_page=3&search_value=REPORT_TITLE&search_text=%EC%82%BC%EC%84%B1"
    );
  });

  it("extracts a report row with pdf url", () => {
    const html = `
      <table>
        <tr>
          <td>2026-05-30</td>
          <td>한국투자증권</td>
          <td>삼성전자</td>
          <td><a href="/analysis/downpdf?report_idx=123" title="실적 개선 기대.pdf">실적 개선 기대</a></td>
        </tr>
      </table>
    `;

    expect(
      extractHankyungReports(html, "https://consensus.hankyung.com/analysis/list?sdate=2026-05-28&edate=2026-05-31&now_page=1")
    ).toEqual([
      {
        sourceName: "HankyungConsensus",
        stockName: "삼성전자",
        ticker: "",
        reportTitle: "실적 개선 기대",
        firmName: "",
        reportDate: "2026-05-30",
        sourceUrl: "https://consensus.hankyung.com/analysis/downpdf?report_idx=123",
        pdfUrl: "https://consensus.hankyung.com/analysis/downpdf?report_idx=123"
      }
    ]);
  });
});
