import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filename = path.resolve(root, relative);

  if (!filename.startsWith(`${path.resolve(root)}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    if (!statSync(filename).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types[path.extname(filename)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(4174, "127.0.0.1", () => {
  console.log("Local site: http://127.0.0.1:4174");
});
