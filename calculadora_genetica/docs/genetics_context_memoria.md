# Memória de contexto - Calculadora Genética

Data base: 2026-04-16

## Objetivo principal
- Construir uma calculadora genética para psitacídeos, com foco inicial em Ringneck.
- Exibir resultado por sexo, com porcentagens, nomes fenotípicos e fórmulas genéticas.
- Produzir uma saída em formato de laudo para entrega ao cliente.

## Base já incorporada
- Planilhas de acasalamento Ring Neck.
- Guia de mutações de cores e genética em psitacídeos.
- Estrutura do motor do site público da Galpão das Aves.

## Prioridades atuais
- Ajustar o motor para devolver resultados mais fiéis ao padrão das planilhas.
- Garantir separação clara entre macho e fêmea.
- Expandir a lógica para azul, turquoise, indigo, sapphire, opalino, pallid e violeta.
- Manter um bloco separado para a série azul como locus multialélico.
- Corrigir e validar o cruzamento ligado ao sexo com exemplos reais.
- Sempre testar os cruzamentos centrais antes de considerar a regra como confiável.
- Evoluir o motor para um interpretador mendeliano explícito, com comparação de esperado vs calculado.

## Formato desejado de saída
- Nome do macho
- Nome da fêmea
- Resultado dos machos com percentuais
- Resultado das fêmeas com percentuais
- Fórmula genética de cada resultado
- Texto técnico resumido para laudo
- Casos fixos de validação na interface para comparação rápida

## Exemplos que ainda precisamos validar
- Cleartail x Cleartail
- Azul x Cleartail
- Verde x Azul
- Azul x Verde
- Turquesa x Índigo
- Opalino x normal
- Pallid x normal
- Violeta SF x normal
- Turquoise x Blue

## Observação técnica
- Se a lógica não bater com a planilha, a próxima correção deve ser feita com exemplos reais do cruzamento esperado.

## Critério de confiança
- Um cruzamento só pode ser promovido para a calculadora principal depois de passar na verificação mendeliana.
- Se a saída divergir da planilha, o caso fica marcado como `AJUSTAR` até a regra ser refinada.

## Nova camada adicionada
- Planilhas de Arlequim Dominante e Arlequim Recessivo extraídas para JSON interno.
- Arquivos de apoio: `arlequim_table_sources.json` e `genetics_arlequim_table_sources.md`.
- A interface agora mostra a biblioteca de tabelas Arlequim como referência de fonte.
- O próximo refinamento é calibrar a leitura final dos cruzamentos de arlequim com base nesses blocos extraídos.
- Planilha de Cleartail e Portadores extraída para JSON interno.
- Arquivos de apoio: `cleartail_table_sources.json` e `genetics_cleartail_table_sources.md`.
- A interface agora mostra a biblioteca de tabelas Cleartail como referência.
- Bibliografia do laudo passou a carregar Arlequim + Cleartail.
- Planilhas de Opalino, Pallid e Violeta extraídas para JSON interno.
- Arquivos de apoio: `sexlinked_table_sources.json` e `genetics_sexlinked_table_sources.md`.
- A interface agora mostra a biblioteca sex-linked como referência de interpretação ligada ao sexo.
- Bibliografia do laudo passou a carregar Arlequim + Cleartail + Sex-linked.

- A extra��o sex-linked passou a gerar t�tulos mais leg�veis por bloco, aproximando a leitura do formato da planilha.
- A pr�xima fam�lia foi preparada em um roadmap vis�vel na interface, com Calopsita como foco seguinte e outras esp�cies em fila.

