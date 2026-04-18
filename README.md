# Criador Pro - Trabalho

Painel de criador com foco em genetica de aves, relatorios tecnicos e ferramentas de apoio para manejo.

## Execucao local

1. Instale dependencias:
   - `npm install`
2. Inicie o servidor:
   - `npm start`
3. Acesse:
   - `http://127.0.0.1:4173`

## Estado atual

- Calculadora genetica multi-locus com painel por mutacao.
- Locus multialelico configurado para Ringneck (serie azul por planilha).
- Exportacao de laudo PDF completo.
- Busca de evidencia na pasta `livros` via backend.

## Estrutura principal

- `index.html` / `style.css` / `script.js`: frontend principal.
- `server.js`: backend local (API e busca em livros).
- `calculadora_genetica/`: motor e dados geneticos.
- `vendor/`: bibliotecas locais.
- `docs/`: operacao, arquitetura e release.

## Versionamento recomendado

- Branch principal: `main`
- Branch de integracao: `develop`
- Features: `feature/<tema>`
- Releases: tags semanticas (`v1.0.0`, `v1.1.0`, ...)

Detalhes em `docs/OPERACAO_RELEASE.md`.
