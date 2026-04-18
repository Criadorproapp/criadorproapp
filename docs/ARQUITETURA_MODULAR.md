# Arquitetura Modular (Plano de Migracao)

## Direcao

Manter uma base unica (monorepo) e separar responsabilidades por modulo.

## Modelo alvo

- `apps/painel`
  - UI principal (`index.html`, `style.css`, `script.js`)
- `apps/api`
  - servidor e endpoints (`server.js`)
- `packages/genetics-engine`
  - motor genetico e dados (`calculadora_genetica/`)
- `packages/shared`
  - utilitarios comuns

## Fases

### Fase 1 - Congelamento

- Versao estavel em `main`.
- Tag de baseline.
- Documentacao de operacao e release.

### Fase 2 - Extracao sem quebra

- Encapsular motor genetico em modulo dedicado.
- Ajustar imports para usar modulo.
- Manter mesma interface do frontend.

Status atual:
- `packages/genetics-engine` criado como camada de pacote.
- Frontend principal ja consumindo o modulo via `packages/`.
- Implementacao interna movida para `packages/genetics-engine/src/`.
- Arquivos legados em `calculadora_genetica/` mantidos como bridge (re-export).
- Backend HTTP movido para `apps/api/server.js`.
- `server.js` na raiz mantido como bridge para preservar `npm start`.
- Frontend principal movido para `apps/painel/`.
- `index.html`, `style.css` e `script.js` na raiz mantidos como bridges de compatibilidade.

### Fase 3 - Split de apps

- Mover frontend para `apps/painel`.
- Mover backend para `apps/api`.
- Configurar scripts de execucao por app.

### Fase 4 - Times/agentes por dominio

- Agente 1: motor genetico
- Agente 2: frontend
- Agente 3: API/integracoes
- Agente 4: QA/release

## Criterio de sucesso

- Nenhuma perda de funcionalidade durante migracao.
- Tempo de carregamento menor.
- Mudancas por modulo com menos conflito.
