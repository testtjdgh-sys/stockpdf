import { crawlReports } from "./crawl";

const [, , stockQuery = "", from = "", to = ""] = process.argv;

if (!stockQuery || !from || !to) {
  console.error("Usage: npm run crawl -- <stockQuery> <from> <to>");
  process.exit(1);
}

const saved = await crawlReports(stockQuery, from, to);
console.log(JSON.stringify({ saved: saved.length }, null, 2));
