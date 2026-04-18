const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PAINEL_PORT || 4180;
const root = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end(err.code === 'ENOENT' ? 'Arquivo nao encontrado.' : 'Erro interno ao ler arquivo.');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  if (rawPath === '/') {
    res.writeHead(302, { Location: '/apps/painel/' });
    res.end();
    return;
  }

  const safePath = path.normalize(rawPath).replace(/^([.][.][\\/])+/, '');
  const rel = safePath.replace(/^\//, '');
  const filePath = path.join(root, rel);

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso negado.');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      return sendFile(path.join(filePath, 'index.html'), res);
    }
    sendFile(filePath, res);
  });
});

server.listen(port, () => {
  console.log(`Painel dev disponivel em http://localhost:${port}/apps/painel/`);
});

