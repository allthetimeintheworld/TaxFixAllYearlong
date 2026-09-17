#!/usr/bin/env node
/**
 * serve.mjs — zero-dependency static file server for the prototype.
 *
 * The demo also works straight from the filesystem (run.js assigns to window,
 * so there is no fetch and no CORS problem). This server exists because a real
 * http:// URL looks better on a projector and lets you reload on another
 * device on the same network.
 *
 *   node serve.mjs            → http://127.0.0.1:5173
 *   node serve.mjs 8080       → http://127.0.0.1:8080
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, 'web');
const port = Number(process.argv[2] || process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    // Friendly aliases, so a presenter can type /app or /prototype.
    if (pathname === '/app' || pathname === '/prototype') pathname = '/app.html';

    // Prevent path traversal outside web/.
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(root, safe);
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(filePath);
    if (info.isDirectory()) {
      res.writeHead(404).end('Not found');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': TYPES[extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found — did you run `node run-demo.mjs` first?');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Taxfix Loop prototype → http://127.0.0.1:${port}`);
  console.log('  Ctrl+C to stop');
});
