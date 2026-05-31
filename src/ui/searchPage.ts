import type { Report } from "../domain/report";

export interface SearchPageModel {
  reports: Report[];
  recentStocks: Array<{ ticker: string; stockName: string }>;
  allStocks: Array<{ ticker: string; stockName: string }>;
  stockQuery: string;
  from: string;
  to: string;
  message?: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderSearchPage(model: SearchPageModel): string {
  const options = model.allStocks
    .map((stock) => {
      const label = stock.ticker ? `${stock.stockName} (${stock.ticker})` : stock.stockName;
      return `<option value="${escapeHtml(stock.stockName)}" label="${escapeHtml(label)}"></option>`;
    })
    .join("");

  const rows = model.reports.length
    ? model.reports
        .map(
          (report, index) => `
            <tr>
              <td><input type="checkbox" class="pdf-checkbox" data-url="${escapeHtml(report.pdfUrl)}" data-index="${index}"></td>
              <td>${escapeHtml(report.reportDate)}</td>
              <td>${escapeHtml(report.stockName)}</td>
              <td>${escapeHtml(report.ticker || "-")}</td>
              <td>${escapeHtml(report.reportTitle)}</td>
              <td>${escapeHtml(report.firmName || "-")}</td>
              <td>${escapeHtml(report.sourceName)}</td>
              <td>${escapeHtml(report.downloadStatus)}</td>
              <td><a href="${escapeHtml(report.pdfUrl)}" target="_blank" rel="noopener">다운로드</a></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="9" class="empty">No reports found</td></tr>`;

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Stock Report Crawler</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #f5f1e8;
            --panel: #fffdf8;
            --ink: #1f2937;
            --muted: #6b7280;
            --line: #d6d1c4;
            --accent: #0f766e;
            --accent-2: #7c2d12;
          }
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: var(--ink);
            background:
              radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 30%),
              radial-gradient(circle at top right, rgba(124, 45, 18, 0.08), transparent 24%),
              var(--bg);
          }
          .wrap { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
          .hero {
            display: grid;
            gap: 18px;
            grid-template-columns: 1.2fr 0.8fr;
            align-items: end;
            margin-bottom: 20px;
          }
          .title { font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1; margin: 0; letter-spacing: -0.05em; }
          .subtitle { margin: 10px 0 0; color: var(--muted); font-size: 1rem; }
          .card, .panel {
            background: rgba(255, 253, 248, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid var(--line);
            border-radius: 20px;
            box-shadow: 0 18px 48px rgba(31, 41, 55, 0.08);
          }
          .card { padding: 20px; }
          .controls { display: grid; grid-template-columns: 1.3fr 0.6fr 0.6fr auto; gap: 12px; }
          label { display: grid; gap: 8px; font-size: 0.9rem; color: var(--muted); }
          input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px 14px;
            font-size: 1rem;
            background: white;
            color: var(--ink);
          }
          button {
            border: 0;
            border-radius: 14px;
            padding: 14px 18px;
            background: linear-gradient(135deg, var(--accent), #0ea5a5);
            color: white;
            font-weight: 700;
            cursor: pointer;
          }
          .secondary {
            background: linear-gradient(135deg, var(--accent-2), #c2410c);
          }
          .status {
            margin-top: 14px;
            color: var(--muted);
          }
          .progress-shell {
            margin-top: 14px;
            height: 12px;
            border-radius: 999px;
            background: #ebe5d8;
            overflow: hidden;
            display: none;
          }
          .progress-shell.active { display: block; }
          .progress-bar {
            height: 100%;
            width: 0%;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--accent), #34d399, var(--accent));
            transition: width 0.3s ease;
          }
          .progress-text {
            margin-top: 8px;
            font-size: 0.9rem;
            color: var(--muted);
            display: none;
          }
          .progress-text.active { display: block; }
          .recent-stocks {
            margin-top: 14px;
            color: var(--muted);
            font-size: 0.9rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            overflow: hidden;
          }
          th, td {
            border-bottom: 1px solid var(--line);
            padding: 12px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 0.95rem;
          }
          th { color: var(--muted); font-weight: 700; }
          .empty { text-align: center; color: var(--muted); padding: 32px; }
          .grid { display: grid; gap: 18px; }
          .hint { color: var(--muted); font-size: 0.9rem; }
          input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }
          input[type="date"] {
            font-size: 1rem;
            padding: 16px 14px;
          }
          .period-buttons {
            display: flex;
            gap: 8px;
            margin-top: 8px;
          }
          .period-buttons button {
            padding: 8px 12px;
            font-size: 0.85rem;
            background: linear-gradient(135deg, var(--accent-2), #c2410c);
          }
          @media (max-width: 900px) {
            .hero, .controls { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="hero">
            <div>
              <h1 class="title">증권사 리포트 수집기</h1>
              <p class="subtitle">종목과 기간을 고르면 한경컨센서스와 네이버 리서치에서 공개 PDF 리포트를 모아서 저장합니다.</p>
            </div>
            <div class="card">
              <div class="hint">최근 수집 종목을 자동완성으로 보여줍니다.</div>
              <div class="hint">수집이 끝나면 아래 목록에서 바로 확인할 수 있습니다.</div>
            </div>
          </div>

          <div class="panel card">
            <form method="post" action="/crawl" class="controls" id="crawl-form">
              <label>
                종목명/티커
                <input list="recent-stocks" name="stockQuery" value="${escapeHtml(model.stockQuery)}" placeholder="예: 삼성전자, 005930" />
              </label>
              <label>
                시작일
                <input type="date" name="from" value="${escapeHtml(model.from)}" id="from-date" />
              </label>
              <label>
                종료일
                <input type="date" name="to" value="${escapeHtml(model.to)}" id="to-date" />
              </label>
              <button type="submit">수집 시작</button>
            </form>
            <div class="period-buttons">
              <button type="button" data-months="1">1개월</button>
              <button type="button" data-months="2">2개월</button>
              <button type="button" data-months="3">3개월</button>
            </div>
            <datalist id="recent-stocks">${options}</datalist>
            <div class="recent-stocks">종목 목록은 입력창 자동완성에서 선택할 수 있습니다.</div>
            <div class="progress-shell" id="crawl-progress" aria-hidden="true"><div class="progress-bar" id="progress-bar"></div></div>
            <div class="progress-text" id="progress-text" aria-hidden="true"></div>
            <div class="status">${model.message ? escapeHtml(model.message) : "준비됨"}</div>
          </div>

          <div class="grid">
            <div class="panel card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h2 style="margin:0;">수집 결과</h2>
                <div>
                  <button type="button" id="select-all" style="padding:8px 12px; font-size:0.9rem; margin-right:8px;">전체 선택</button>
                  <button type="button" id="download-selected" style="padding:8px 12px; font-size:0.9rem;">선택 다운로드</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" id="select-all-checkbox"></th>
                    <th>일자</th>
                    <th>종목</th>
                    <th>티커</th>
                    <th>제목</th>
                    <th>증권사</th>
                    <th>출처</th>
                    <th>상태</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
        <script>
          const form = document.getElementById('crawl-form');
          const progress = document.getElementById('crawl-progress');
          const progressBar = document.getElementById('progress-bar');
          const progressText = document.getElementById('progress-text');
          const stockInput = document.querySelector('input[name="stockQuery"]');
          let progressInterval: number | null = null;

          async function checkProgress() {
            try {
              const response = await fetch('/progress');
              const data = await response.json();
              if (data.isRunning) {
                progressBar.style.width = data.percentage + '%';
                progressText.textContent = \`진행률: \${data.percentage}% (\${data.current}/\${data.total})\`;
                progressText.classList.add('active');
              } else if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
                progress.classList.remove('active');
                progressText.classList.remove('active');
                form.querySelector('button[type="submit"]').disabled = false;
                form.querySelector('button[type="submit"]').textContent = '수집 시작';
                location.reload();
              }
            } catch (error) {
              console.error('Progress check failed:', error);
            }
          }

          form?.addEventListener('submit', (e) => {
            e.preventDefault();
            progress?.classList.add('active');
            form.querySelector('button[type="submit"]').disabled = true;
            form.querySelector('button[type="submit"]').textContent = '수집 중...';
            progressBar.style.width = '0%';
            progressInterval = window.setInterval(checkProgress, 500);
            
            // Submit the form using fetch
            const formData = new FormData(form);
            fetch('/crawl', {
              method: 'POST',
              body: formData
            }).then(() => {
              // Form submission completed, progress polling will handle the rest
            }).catch(error => {
              console.error('Form submission failed:', error);
              clearInterval(progressInterval!);
              progress?.classList.remove('active');
              form.querySelector('button[type="submit"]').disabled = false;
              form.querySelector('button[type="submit"]').textContent = '수집 시작';
            });
          });

          // Checkbox functionality
          const selectAllCheckbox = document.getElementById('select-all-checkbox');
          const selectAllButton = document.getElementById('select-all');
          const downloadSelectedButton = document.getElementById('download-selected');

          // Period buttons functionality
          const periodButtons = document.querySelectorAll('.period-buttons button');
          const fromDateInput = document.getElementById('from-date') as HTMLInputElement;
          const toDateInput = document.getElementById('to-date') as HTMLInputElement;

          periodButtons.forEach(button => {
            button.addEventListener('click', () => {
              const months = parseInt(button.getAttribute('data-months') || '0');
              const today = new Date();
              const fromDate = new Date();
              fromDate.setMonth(today.getMonth() - months);
              
              toDateInput.value = today.toISOString().slice(0, 10);
              fromDateInput.value = fromDate.toISOString().slice(0, 10);
            });
          });

          // Function to get all checkboxes
          function getCheckboxes() {
            return document.querySelectorAll('.pdf-checkbox');
          }

          selectAllCheckbox?.addEventListener('change', (e) => {
            const checked = (e.target as HTMLInputElement).checked;
            getCheckboxes().forEach(cb => (cb as HTMLInputElement).checked = checked);
          });

          selectAllButton?.addEventListener('click', () => {
            const checkboxes = getCheckboxes();
            const allChecked = Array.from(checkboxes).every(cb => (cb as HTMLInputElement).checked);
            checkboxes.forEach(cb => (cb as HTMLInputElement).checked = !allChecked);
            if (selectAllCheckbox) {
              (selectAllCheckbox as HTMLInputElement).checked = !allChecked;
            }
          });

          downloadSelectedButton?.addEventListener('click', () => {
            const checkboxes = getCheckboxes();
            const selectedUrls = Array.from(checkboxes)
              .filter(cb => (cb as HTMLInputElement).checked)
              .map(cb => (cb as HTMLInputElement).getAttribute('data-url'));
            
            if (selectedUrls.length === 0) {
              alert('선택된 PDF가 없습니다.');
              return;
            }

            selectedUrls.forEach((url, index) => {
              setTimeout(() => {
                const link = document.createElement('a');
                link.href = url!;
                link.target = '_blank';
                link.download = '';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }, index * 500); // 500ms delay between downloads
            });
          });
        </script>
      </body>
    </html>
  `;
}
