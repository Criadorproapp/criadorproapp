# Operacao de Release

## Objetivo

Congelar o que ja foi construido, evitar retrabalho e publicar com rastreabilidade.

## Fluxo minimo (todo ciclo)

1. `git checkout main`
2. `git pull` (quando houver remoto)
3. `git checkout -b feature/<nome-da-entrega>`
4. Implementar + validar local
5. `git add .`
6. `git commit -m "feat: <descricao curta>"`
7. `git checkout main`
8. `git merge --no-ff feature/<nome-da-entrega>`
9. `git tag vX.Y.Z`
10. `git push origin main --tags`

## Politicas praticas

- Nunca desenvolver direto em `main`.
- Sempre gerar tag em versao estavel.
- Salvar changelog a cada entrega importante.
- Manter assets pesados fora do Git (ja coberto no `.gitignore`).

## Primeiro push para GitHub

1. Criar repositorio vazio no GitHub.
2. Conectar remoto:
   - `git remote add origin <URL_DO_REPOSITORIO>`
3. Publicar:
   - `git push -u origin main`
4. Publicar tags:
   - `git push origin --tags`

## Checklist antes de tag

- `node --check script.js`
- `npm start` sobe sem erro.
- App responde em `http://127.0.0.1:4173`.
- PDF exporta.
- Cruzamento genetico calcula.
