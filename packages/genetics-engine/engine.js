// Fase 2 (migracao incremental):
// Este modulo expõe o motor genetico por um caminho estavel em `packages/`.
// A implementacao real permanece no legado por enquanto para evitar quebra.
export {
  calculateLegacyCockatiel,
  calculateMultiLocus,
  runValidationSuite
} from '../../calculadora_genetica/genetics_engine_v2.js';

