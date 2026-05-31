import { startServer } from "./server";

const port = Number(process.env.PORT ?? 3000);
startServer(port);
console.log(`UI running at http://localhost:${port}`);
