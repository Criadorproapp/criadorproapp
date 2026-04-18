# Changelog

## v0.3.0-phase3-app-scripts-deploy

- Scripts por app adicionados: `start:api`, `start:painel`, `start:all`.
- Servidor dev do painel adicionado (`scripts/serve-painel.js`).
- Orquestrador local API+painel adicionado (`scripts/start-all.js`).
- Deploy preparado com `Dockerfile` e `.dockerignore`.
- Guia operacional de deploy adicionado em `docs/DEPLOY.md`.

## v0.2.2-phase2-painel-bridge

- Frontend principal movido para `apps/painel/`.
- Arquivo raiz `index.html` convertido para redirecionamento para `/apps/painel/`.
- Arquivos raiz `style.css` e `script.js` convertidos para bridge.
- Caminhos internos do painel ajustados para `vendor/`, `config.js` e `packages/`.

## v0.2.1-phase2-api-bridge

- Backend principal movido para `apps/api/server.js`.
- `server.js` raiz convertido para bridge de compatibilidade.
- Script `start:api` adicionado no `package.json`.

## v0.2.0-phase2-internalized

- Motor genetico movido para `packages/genetics-engine/src`.
- Frontend consumindo API do pacote `packages/genetics-engine`.
- Arquivos em `calculadora_genetica/` convertidos para bridge de compatibilidade.
- Validacao executada para pacote e bridge legado.

## v0.1.0-baseline

- Organizacao inicial de release e preservacao.
- Calculadora genetica multi-locus com PDF completo.
- Locus multialelico por especie (configurado para serie azul Ringneck).
- Catalogo Ringneck integrado em painel.
- Guia de operacao e arquitetura modular criado.
