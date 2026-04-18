# Deploy (Fase 3)

## Opcoes prontas

### 1) Docker (recomendado)

O projeto possui `Dockerfile` na raiz com entrada em `apps/api/server.js`.

Build local:
- `docker build -t criador-pro:latest .`

Run local:
- `docker run --rm -p 4173:4173 -e PORT=4173 criador-pro:latest`

### 2) Render / Railway

Configurar como Web Service usando Docker:
- Build: automatico via `Dockerfile`
- Port: `4173`
- Health check: `/`

## Variaveis de ambiente

- `PORT` (default `4173`)
- `OPENAI_API_KEY` (opcional, para Jarvis)
- `OPENAI_MODEL` (opcional)
- `JARVIS_UPSTREAM_URL` (opcional, se usar agente externo)
- `JARVIS_UPSTREAM_TOKEN` (opcional)
- `JARVIS_CHARACTER` (opcional)

## Observacao sobre base de livros

Por padrao, `.dockerignore` exclui `livros/` para imagem ficar leve.
Se for necessario busca em livros no deploy, remover essa exclusao e rebuildar a imagem.

