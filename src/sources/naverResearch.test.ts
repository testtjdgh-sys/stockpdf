import { describe, expect, it } from "vitest";
import { buildNaverResearchUrl, extractNaverReports } from "./naverResearch";

describe("naverResearch", () => {
  it("builds the company research url with filters", () => {
    expect(
      buildNaverResearchUrl({
        section: "company",
        keyword: "삼성",
        from: "2026-05-01",
        to: "2026-05-31",
        page: 2
      })
    ).toBe(
      "https://finance.naver.com/research/company_list.naver?page=2&keyword=%EC%82%BC%EC%84%B1&writeFromDate=2026-05-01&writeToDate=2026-05-31"
    );
  });

  it("extracts a report row with pdf url", () => {
    const html = `
      <table>
        <tr>
          <td><a href="/item/main.naver?code=005930">삼성전자</a></td>
          <td><a href="company_read.naver?nid=93364&page=1">실적 개선 기대</a></td>
          <td>삼성증권</td>
          <td>리포트</td>
          <td>2026.05.29</td>
          <td class="tc"><a href="https://stock.pstatic.net/stock-research/company/66/20260529_company_216858000.pdf"><img alt="pdf"></a></td>
        </tr>
      </table>
    `;

    expect(extractNaverReports(html, "https://finance.naver.com/research/company_list.naver?page=1")).toEqual([
      {
        sourceName: "NaverResearch",
        stockName: "삼성전자",
        ticker: "005930",
        reportTitle: "실적 개선 기대",
        firmName: "삼성증권",
        reportDate: "2026.05.29",
        sourceUrl: "https://finance.naver.com/research/company_read.naver?nid=93364&page=1",
        pdfUrl: "https://stock.pstatic.net/stock-research/company/66/20260529_company_216858000.pdf"
      }
    ]);
  });
});
