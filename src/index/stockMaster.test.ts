import { describe, expect, it } from "vitest";
import { parseKrXStockMaster } from "./stockMaster";

describe("parseKrXStockMaster", () => {
  it("parses the KRX stock master html table", () => {
    const rows = parseKrXStockMaster(`
      <html><body>
        <table>
          <tr>
            <th>회사명</th><th>시장구분</th><th>종목코드</th><th>업종</th><th>주요제품</th><th>상장일</th><th>결산월</th><th>대표자명</th><th>홈페이지</th><th>지역</th>
          </tr>
          <tr>
            <td>삼성전자</td><td>코스피</td><td>005930</td><td>전기전자</td><td>반도체</td><td>1975-06-11</td><td>12월</td><td>대표이사</td><td>https://example.com</td><td>경기도</td>
          </tr>
        </table>
      </body></html>
    `);

    expect(rows).toEqual([
      {
        ticker: "005930",
        stockName: "삼성전자",
        marketName: "코스피",
        industryName: "전기전자",
        listingDate: "1975-06-11",
        updatedAt: rows[0].updatedAt
      }
    ]);
  });
});
