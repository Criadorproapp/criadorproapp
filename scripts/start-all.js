const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const processes = [];

function start(name, args, env = {}) {
  const child = spawn(nodeBin, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
  processes.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] encerrado com codigo ${code}`);
    }
  });
}

start('api', ['apps/api/server.js'], { PORT: process.env.PORT || '4173' });
start('painel_jarvis', ['apps/jarvis-command/jarvis_server.js'], { PAINEL_PORT: process.env.PAINEL_PORT || '4180' });
start('studio', ['scripts/start-studio.js']);

console.log('API:    http://localhost:4173');
console.log('Painel: http://localhost:4180/apps/painel/');
console.log('Studio: http://localhost:5678');

function shutdown() {
  for (const p of processes) {
    try {
      p.kill('SIGTERM');
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

