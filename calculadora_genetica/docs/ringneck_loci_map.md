# Ringneck - mapa de loci e herança

Data base: 2026-04-17

## Loci principais já confirmados na fonte

### Série azul
- `blue`
- `turquoise`
- `indigo`
- `sapphire`
- Base de herança: autossômica recessiva
- Leitura de séries: multialélica
- Saída visual pode combinar azul com turquesa/índigo/safira e derivados

### Cleartail
- `cleartail`
- Base de herança: autossômica recessiva
- Pode aparecer junto da série azul e também com opalino/violeta nos presets visuais

### Opalino
- `opaline`
- Base de herança: heterossômica recessiva
- Exige leitura por sexo
- Em machos aparece como visual ou split
- Em fêmeas aparece como visual ou normal, sem portadora silenciosa

### Pallid
- `pallid`
- Base de herança: heterossômica recessiva
- Exige leitura por sexo
- Comparte o mesmo bloco de leitura da série SLino no app fonte

### Violeta
- `violet`
- Base de herança: autossômica dominante
- Pode aparecer como fator simples e fator duplo

## Observações práticas para a calculadora
- A série azul deve ser tratada como um grupo, não como um único gene isolado.
- `cleartail` precisa combinar com a série azul para formar fenótipos como `Cleartail Azul`, `Cleartail Azul Índigo`, `Cleartail Violeta`, etc.
- `opalino` e `pallid` precisam de leitura por sexo na lógica.
- `violeta` precisa devolver intensidade de fator quando houver homozigose ou dupla dose.

## Fenótipos/presets visuais mais relevantes no catálogo
- Azul
- Azul Turquesa
- Azul Índigo
- Cleartail Azul
- Cleartail Azul Turquesa
- Cleartail Azul Índigo
- Opalino Azul
- Opalino Azul Turquesa
- Opalino Azul Índigo
- Pallid Azul
- Pallid Violeta
- Violeta
- Violeta Turquesa
- Violeta Índigo
- Cleartail Violeta
- Cleartail Opalino Violeta

## Próximo passo
- Usar este mapa para montar a matriz de cruzamento por locus.
