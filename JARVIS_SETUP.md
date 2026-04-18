# Jarvis GPT Integration

Backend route ready:

- `POST /api/jarvis/chat`

## Configuration

Use one of the options below in environment variables:

1. External agent (recommended if you already have your GPT agent endpoint)
- `JARVIS_UPSTREAM_URL`
- `JARVIS_UPSTREAM_TOKEN` (optional, if your endpoint requires auth)

2. OpenAI direct
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default: `gpt-4.1-mini`)
- `JARVIS_CHARACTER` (optional, default: `Jarvis Dr. Aves Criador Pro`)

Example env file is available at:

- `.env.example`

## Request payload

```json
{
  "query": "Explique a herança do opalino",
  "context": {
    "species": "ringneck",
    "combinedConfig": {
      "opalino": { "enabled": true, "male": "split", "female": "normal" }
    }
  },
  "messages": [
    { "role": "user", "content": "Qual o melhor próximo cruzamento?" }
  ],
  "useLivros": true
}
```

## Response payload

```json
{
  "ok": true,
  "source": "upstream",
  "model": "external-agent",
  "reply": "texto da resposta",
  "evidence": [
    { "file": "livros\\\\...pdf", "source": "nome", "snippet": "" }
  ]
}
```

## Notes

- Route automatically includes evidence from local `livros/` when `useLivros` is not `false`.
- If no credentials are configured, route returns:
  - `503` with setup error message.
