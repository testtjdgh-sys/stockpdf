import { startServer } from "./server";
import { syncKrXStockMaster } from "../index/stockMaster";

const port = Number(process.env.PORT ?? 3000);

try {
  const count = await syncKrXStockMaster();
  console.log(`Synced ${count} KRX stock master rows`);
} catch (error) {
  console.warn("Failed to sync KRX stock master, using cached DB data instead.", error);
}

startServer(port);
console.log(`UI running at http://localhost:${port}`);
