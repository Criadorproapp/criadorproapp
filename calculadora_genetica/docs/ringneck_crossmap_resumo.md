# Ringneck Crossmap - Resumo de base

Data base: 2026-04-17

## Arquivos fonte já lidos
- `tmp_galpao_app.js`
- `tmp_galpao_config.js`
- `genetics_rules_psitacideos_v1.json`
- `ringneck_catalogo_presets.md`

## Mutacoes Ringneck identificadas na base fonte
- blue
- turquoise
- indigo
- sapphire
- cleartail
- violet
- opaline
- pallid

## Catálogo Ringneck extraído do config.js
- Total de presets únicos: 145
- O catálogo foi separado em grupos: Base/Blue line, Cleartail, Opalino, Pallid, Violeta e Outros
- Os nomes do catálogo incluem combinações simples e compostas, como `Azul`, `Azul Turquesa`, `Cleartail Azul Índigo`, `Opalino Violeta Turquesa` e `Pallid Violeta Índigo`
- O catálogo oficial já está sendo exibido na interface da calculadora como referência de fenótipos reconhecidos
- A matriz base de cruzamentos Ringneck já está calculada na interface com os casos centrais da planilha

## Padrões visuais/combinações já explicitamente nomeados no `config.js`
- Verde
- Azul
- Cinza
- Lutino
- Albino
- Azul Turquesa
- Cleartail Azul Turquesa
- Cleartail Azul
- Cleartail Verde
- Cleartail Violeta
- Cleartail Opalino Violeta
- Opalino Azul
- Opalino Azul Turquesa
- Opalino Azul Índigo
- Opalino Cobalto
- Opalino Lutino
- Opalino Verde
- Opalino Violeta
- Pallid Azul
- Pallid Violeta
- Violeta
- Violeta Turquesa
- Violeta Índigo
- Violeta Esmeralda
- Esmeralda Azul
- Cobalto
- Azul Índigo
- Verde Violeta
- Dominante Edged Violeta

## Leitura prática
- A calculadora precisa tratar a série azul como base multialélica e não como “azul simples” apenas.
- `cleartail` aparece em combinação com `opalino`, `violeta` e `azul` em vários presets do visual.
- `opaline` e `pallid` devem ser tratados como ligação sexual, com leitura por sexo obrigatória.
- `violet` aparece em múltiplas combinações de intensidade e deve suportar fator simples e duplo.

## Próximo passo recomendado
- Mapear cada preset para seu locus e sua regra de herança.
- Usar esse mapa para montar a tabela de cruzamentos esperados da calculadora.
- Priorizar validação dos casos base: `Azul x Verde`, `Cleartail x Cleartail`, `Opalino x normal`, `Pallid x normal` e `Violeta SF x normal`.
