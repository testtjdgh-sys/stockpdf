import { createServer } from "node:http";
import { renderSearchPage } from "./searchPage";

export function startServer(port = 3000) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderSearchPage([]));
  });

  server.listen(port);
  return server;
}
