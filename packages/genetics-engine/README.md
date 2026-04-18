# genetics-engine

Camada de pacote para o motor genetico do Criador Pro.

## Objetivo

- Expor API estavel para o frontend via `packages/`.
- Reduzir acoplamento com caminhos legados em `calculadora_genetica/`.
- Permitir migracao gradual sem quebra.

## API publica atual

- `calculateMultiLocus(speciesId, selectedMutations)`
- `runValidationSuite()`
- `calculateLegacyCockatiel(malePreset, femalePreset)`
- `GENETICS_RULES`
- `RINGNECK_CATALOG`
- `SPECIES_ROADMAP`

## Nota

Nesta fase, a implementacao ainda referencia os arquivos legados.
Nas proximas fases, o codigo-fonte sera movido para este pacote.

