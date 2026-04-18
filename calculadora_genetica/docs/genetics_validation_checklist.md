# Checklist de Valida??o Gen?tica

Gerado em: 17/04/2026, 10:26:57

## Resumo
- Casos da su?te de verifica??o Ringneck: 7
- Casos com status OK: 7
- Su?te geral: OK

## Ringneck base
- Azul x Verde: OK
  - Esperado: Macho/F?mea 100% Verde / Azul
  - Sa?da: "Macho: Verde / Azul 100.00% | Fêmea: Verde / Azul 100.00%"
- Azul x Azul: OK
  - Esperado: Macho/F?mea 100% Azul
  - Sa?da: "Macho: Azul 100.00% | Fêmea: Azul 100.00%"
- Verde x Verde: OK
  - Esperado: Macho/F?mea 100% Verde
  - Sa?da: "Macho: Verde 100.00% | Fêmea: Verde 100.00%"
- Cleartail x Cleartail: OK
  - Esperado: Macho/F?mea 100% Cleartail Verde
  - Sa?da: "Macho: Cleartail Verde (100.00%) | Fêmea: Cleartail Verde (100.00%)"

## Sex-linked and dominant
- Opalino split x visual: OK
  - Esperado: Machos 50% portador / 50% visual; f?meas 50% sem opalino / 50% visual
  - Sa?da: {"male":[{"label":"Opalino: Portador de opalino","probability":0.5,"phenotype":"Portador de opalino"},{"label":"Opalino: Opalino visual","probability":0.5,"phenotype":"Opalino visual"}],"female":[{"label":"Opalino: Sem opalino","probability":0.5,"phenotype":"Sem opalino"},{"label":"Opalino: Opalino visual","probability":0.5,"phenotype":"Opalino visual"}]}
- Pallid split x visual: OK
  - Esperado: Machos 50% portador / 50% visual; f?meas 50% sem pallid / 50% visual
  - Sa?da: {"male":[{"label":"Pallid: Portador de pallid","probability":0.5,"phenotype":"Portador de pallid"},{"label":"Pallid: Pallid visual","probability":0.5,"phenotype":"Pallid visual"}],"female":[{"label":"Pallid: Sem pallid","probability":0.5,"phenotype":"Sem pallid"},{"label":"Pallid: Pallid visual","probability":0.5,"phenotype":"Pallid visual"}]}
- Violeta SF x Normal: OK
  - Esperado: Machos 50% violeta SF / 50% sem fator; f?meas 50% violeta SF / 50% sem fator
  - Sa?da: {"male":[{"label":"Violeta: Violeta fator simples","probability":0.5,"phenotype":"Violeta fator simples"},{"label":"Violeta: Sem fator violeta","probability":0.5,"phenotype":"Sem fator violeta"}],"female":[{"label":"Violeta: Violeta fator simples","probability":0.5,"phenotype":"Violeta fator simples"},{"label":"Violeta: Sem fator violeta","probability":0.5,"phenotype":"Sem fator violeta"}]}

## Blue series multiallelic
- Verde x Turquesa: OK
  - Esperado: 100% Verde / Turquesa
  - Sa?da: "Macho: Verde / Turquesa 100.00% | Fêmea: Verde / Turquesa 100.00%"
- Turquesa x ?ndigo: OK
  - Esperado: 100% Turquesa / ?ndigo
  - Sa?da: "Macho: Turquesa / Índigo 100.00% | Fêmea: Turquesa / Índigo 100.00%"
- Turquesa x Safira: OK
  - Esperado: 100% Turquesa / Safira
  - Sa?da: "Macho: Turquesa / Safira 100.00% | Fêmea: Turquesa / Safira 100.00%"
- ?ndigo x Safira: OK
  - Esperado: 100% ?ndigo / Safira
  - Sa?da: "Macho: Índigo / Safira 100.00% | Fêmea: Índigo / Safira 100.00%"

## Su?te Ringneck
- Azul x Verde: OK
- Azul x Azul: OK
- Verde x Verde: OK
- Cleartail x Cleartail: OK
- Opalino split x visual: OK
- Pallid split x visual: OK
- Violeta SF x Normal: OK

## Observa??es
- A s?rie azul multial?lica agora retorna nomes leg?veis como Azul, Verde / Azul, Verde / Turquesa, Turquesa / ?ndigo e Turquesa / Safira.
- Opalino, Pallid e Violeta est?o batendo com os casos de refer?ncia da planilha.
- O pr?ximo passo pode ser adicionar mais cruzamentos hist?ricos reais de criat?rio para ampliar a cobertura.