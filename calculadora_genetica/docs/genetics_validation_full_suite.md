# Su?te Completa de Valida??o Gen?tica

Gerado em: 17/04/2026, 10:29:07

## Resumo Ringneck
- Casos OK: 7/7
- Status geral: OK

## Opalino (linked sex)
- split x visual: OK
  - Resultado macho: [{"label":"Opalino: Portador de opalino","probability":0.5,"phenotype":"Portador de opalino"},{"label":"Opalino: Opalino visual","probability":0.5,"phenotype":"Opalino visual"}]
  - Resultado f?mea: [{"label":"Opalino: Sem opalino","probability":0.5,"phenotype":"Sem opalino"},{"label":"Opalino: Opalino visual","probability":0.5,"phenotype":"Opalino visual"}]
- normal x visual: OK
  - Resultado macho: [{"label":"Opalino: Portador de opalino","probability":1,"phenotype":"Portador de opalino"}]
  - Resultado f?mea: [{"label":"Opalino: Sem opalino","probability":1,"phenotype":"Sem opalino"}]

## Pallid (linked sex)
- split x visual: OK
  - Resultado macho: [{"label":"Pallid: Portador de pallid","probability":0.5,"phenotype":"Portador de pallid"},{"label":"Pallid: Pallid visual","probability":0.5,"phenotype":"Pallid visual"}]
  - Resultado f?mea: [{"label":"Pallid: Sem pallid","probability":0.5,"phenotype":"Sem pallid"},{"label":"Pallid: Pallid visual","probability":0.5,"phenotype":"Pallid visual"}]
- normal x visual: OK
  - Resultado macho: [{"label":"Pallid: Portador de pallid","probability":1,"phenotype":"Portador de pallid"}]
  - Resultado f?mea: [{"label":"Pallid: Sem pallid","probability":1,"phenotype":"Sem pallid"}]

## Arlequim Dominante
- sf x normal: OK
  - Resultado macho: [{"label":"Arlequim Dominante: Arlequim dominante visual","probability":0.5,"phenotype":"Arlequim dominante visual"},{"label":"Arlequim Dominante: Verde / normal","probability":0.5,"phenotype":"Verde / normal"}]
  - Resultado f?mea: [{"label":"Arlequim Dominante: Arlequim dominante visual","probability":0.5,"phenotype":"Arlequim dominante visual"},{"label":"Arlequim Dominante: Verde / normal","probability":0.5,"phenotype":"Verde / normal"}]
- df x normal: OK
  - Resultado macho: [{"label":"Arlequim Dominante: Arlequim dominante visual","probability":1,"phenotype":"Arlequim dominante visual"}]
  - Resultado f?mea: [{"label":"Arlequim Dominante: Arlequim dominante visual","probability":1,"phenotype":"Arlequim dominante visual"}]

## Arlequim Recessivo
- carrier x carrier: OK
  - Resultado macho: [{"label":"Arlequim Recessivo: Portador de arlequim recessivo","probability":0.5,"phenotype":"Portador de arlequim recessivo"},{"label":"Arlequim Recessivo: Verde / normal","probability":0.25,"phenotype":"Verde / normal"},{"label":"Arlequim Recessivo: Arlequim recessivo visual","probability":0.25,"phenotype":"Arlequim recessivo visual"}]
  - Resultado f?mea: [{"label":"Arlequim Recessivo: Portador de arlequim recessivo","probability":0.5,"phenotype":"Portador de arlequim recessivo"},{"label":"Arlequim Recessivo: Verde / normal","probability":0.25,"phenotype":"Verde / normal"},{"label":"Arlequim Recessivo: Arlequim recessivo visual","probability":0.25,"phenotype":"Arlequim recessivo visual"}]
- visual x carrier: OK
  - Resultado macho: [{"label":"Arlequim Recessivo: Portador de arlequim recessivo","probability":0.5,"phenotype":"Portador de arlequim recessivo"},{"label":"Arlequim Recessivo: Arlequim recessivo visual","probability":0.5,"phenotype":"Arlequim recessivo visual"}]
  - Resultado f?mea: [{"label":"Arlequim Recessivo: Portador de arlequim recessivo","probability":0.5,"phenotype":"Portador de arlequim recessivo"},{"label":"Arlequim Recessivo: Arlequim recessivo visual","probability":0.5,"phenotype":"Arlequim recessivo visual"}]

## Cleartail
- carrier x carrier: OK
  - Resultado macho: [{"label":"Cleartail: Portador de Cleartail","probability":0.5,"phenotype":"Portador de Cleartail"},{"label":"Cleartail: Verde / normal","probability":0.25,"phenotype":"Verde / normal"},{"label":"Cleartail: Cleartail visual","probability":0.25,"phenotype":"Cleartail visual"}]
  - Resultado f?mea: [{"label":"Cleartail: Portador de Cleartail","probability":0.5,"phenotype":"Portador de Cleartail"},{"label":"Cleartail: Verde / normal","probability":0.25,"phenotype":"Verde / normal"},{"label":"Cleartail: Cleartail visual","probability":0.25,"phenotype":"Cleartail visual"}]
- visual x carrier: OK
  - Resultado macho: [{"label":"Cleartail: Portador de Cleartail","probability":0.5,"phenotype":"Portador de Cleartail"},{"label":"Cleartail: Cleartail visual","probability":0.5,"phenotype":"Cleartail visual"}]
  - Resultado f?mea: [{"label":"Cleartail: Portador de Cleartail","probability":0.5,"phenotype":"Portador de Cleartail"},{"label":"Cleartail: Cleartail visual","probability":0.5,"phenotype":"Cleartail visual"}]

## Violeta
- sf x normal: OK
  - Resultado macho: [{"label":"Violeta: Violeta fator simples","probability":0.5,"phenotype":"Violeta fator simples"},{"label":"Violeta: Sem fator violeta","probability":0.5,"phenotype":"Sem fator violeta"}]
  - Resultado f?mea: [{"label":"Violeta: Violeta fator simples","probability":0.5,"phenotype":"Violeta fator simples"},{"label":"Violeta: Sem fator violeta","probability":0.5,"phenotype":"Sem fator violeta"}]
- df x normal: OK
  - Resultado macho: [{"label":"Violeta: Violeta fator simples","probability":1,"phenotype":"Violeta fator simples"}]
  - Resultado f?mea: [{"label":"Violeta: Violeta fator simples","probability":1,"phenotype":"Violeta fator simples"}]

## Observa??es
- A su?te Ringneck base est? est?vel e os casos de opalino/pallid/violeta j? batem com a leitura mendeliana esperada.
- Arlequim dominante e recessivo existem no motor como base estrutural, mas ainda precisam de cruzamentos de refer?ncia pr?prios para valida??o fina.
- O pr?ximo passo ? adicionar casos reais espec?ficos de arlequim e ampliar para outras esp?cies de psitac?deos com a mesma metodologia.