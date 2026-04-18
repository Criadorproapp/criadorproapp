# Criador Pro - Trabalho

Painel de criador com foco em genetica de aves, relatorios tecnicos e ferramentas de apoio para manejo.

## Execucao local

1. Instale dependencias:
   - `npm install`
2. Inicie o app completo:
   - `npm start`
3. Acesse:
   - `http://127.0.0.1:4173`

## Scripts de desenvolvimento por app

- `npm run start:api` - inicia somente API/backend em `:4173`.
- `npm run start:painel` - inicia servidor estatico do painel em `:4180`.
- `npm run start:all` - sobe API e painel em paralelo.

## Estado atual

- Calculadora genetica multi-locus com painel por mutacao.
- Locus multialelico configurado para Ringneck (serie azul por planilha).
- Exportacao de laudo PDF completo.
- Busca de evidencia na pasta `livros` via backend.

## Estrutura principal

- `apps/painel/`: frontend principal (HTML/CSS/JS).
- `apps/api/server.js`: backend local (API e busca em livros).
- `index.html` / `style.css` / `script.js`: bridges de compatibilidade.
- `calculadora_genetica/`: motor e dados geneticos.
- `vendor/`: bibliotecas locais.
- `docs/`: operacao, arquitetura e release.

## Versionamento recomendado

- Branch principal: `main`
- Branch de integracao: `develop`
- Features: `feature/<tema>`
- Releases: tags semanticas (`v1.0.0`, `v1.1.0`, ...)

Detalhes em `docs/OPERACAO_RELEASE.md`.

## Deploy

- Docker pronto na raiz (`Dockerfile` + `.dockerignore`).
- Guia de deploy em `docs/DEPLOY.md`.
