const { spawn } = require('child_process');
const path = require('path');

console.log('--- Iniciando Criador Pro Studio (n8n) ---');

// Tenta rodar n8n via npx para garantir que funcione mesmo sem estar no PATH
const child = spawn('npx', ['n8n', 'start'], {
  shell: true,
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Falha ao iniciar o n8n:', err);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`O processo n8n encerrou com o código ${code}`);
  }
});

console.log('n8n está sendo carregado...');
console.log('Acesse em: http://localhost:5678');
