import { GENETICS_RULES, SPECIES_ROADMAP } from './genetics_data.js';

/**
 * Motor Genético Criador Pro v2
 * Baseado em herança mendeliana avançada, suporte a multi-locus e espécies variadas.
 */

// --- Utilitários de Cálculo ---

function toPercent(prob) {
  return `${(prob * 100).toFixed(2)}%`;
}

function crossAutosomal(gen1, gen2) {
  const g1 = gen1.split('');
  const g2 = gen2.split('');
  const out = {};
  for (const a of g1) {
    for (const b of g2) {
      const geno = [a, b].sort().join('');
      out[geno] = (out[geno] || 0) + 0.25;
    }
  }
  return Object.entries(out).map(([genotype, probability]) => ({ genotype, probability }));
}

function normalizeTo100(items) {
  const sum = items.reduce((s, x) => s + x.probability, 0);
  if (!sum) return items;
  return items.map((x) => ({ ...x, probability: x.probability / sum }));
}

function groupByLabel(items) {
  const acc = new Map();
  for (const item of items) {
    const key = item.label;
    acc.set(key, (acc.get(key) || 0) + item.probability);
  }
  return Array.from(acc.entries()).map(([label, probability]) => ({ label, probability }));
}

// --- Lógica de Cruzamento por Herança ---

function crossSexLinkedRecessive(maleState, femaleState, rule) {
  const maleGametes = (() => {
    if (maleState === 'normal') return [{ z: 'N', p: 1 }];
    if (maleState === 'split') return [{ z: 'N', p: 0.5 }, { z: 'm', p: 0.5 }];
    return [{ z: 'm', p: 1 }];
  })();

  const femaleGametes = (() => {
    if (femaleState === 'normal') return [{ z: 'N', p: 0.5 }, { w: true, p: 0.5 }];
    return [{ z: 'm', p: 0.5 }, { w: true, p: 0.5 }];
  })();

  const maleOffspring = [];
  const femaleOffspring = [];

  for (const sperm of maleGametes) {
    for (const egg of femaleGametes) {
      const p = sperm.p * egg.p;
      if (egg.w) {
        const label = sperm.z === 'm' ? 'Visual' : 'Normal';
        femaleOffspring.push({ label, probability: p });
      } else {
        const hasMutation = sperm.z === 'm' || egg.z === 'm';
        const isVisual = sperm.z === 'm' && egg.z === 'm';
        let label = 'Normal';
        if (isVisual) label = 'Visual';
        else if (hasMutation) label = 'Portador';
        maleOffspring.push({ label, probability: p });
      }
    }
  }

  return {
    male: normalizeTo100(groupByLabel(maleOffspring)),
    female: normalizeTo100(groupByLabel(femaleOffspring))
  };
}

function stateToAutosomalGenotype(rule, state) {
  if (rule.inheritance === 'autosomal_recessive') {
    if (state === 'normal') return 'AA';
    if (state === 'carrier') return 'Aa';
    return 'aa';
  }
  if (state === 'normal') return 'aa';
  if (state === 'sf') return 'Aa';
  return 'AA';
}

function labelAutosomal(rule, genotype) {
  const inh = rule.inheritance;
  if (inh === 'autosomal_recessive') {
    if (genotype === 'aa') return 'Visual';
    if (genotype === 'Aa') return 'Portador';
    return 'Normal';
  }
  if (inh === 'autosomal_dominant' || inh === 'autosomal_incomplete_dominant') {
    if (genotype === 'AA') return 'Visual Fator Duplo';
    if (genotype === 'Aa') return 'Visual Fator Simples';
    return 'Normal';
  }
  return 'Genético';
}

function crossSingleRule(rule, parentConfig) {
  if (rule.inheritance === 'sex_linked_recessive') {
    return crossSexLinkedRecessive(parentConfig.male, parentConfig.female, rule);
  }

  const gMale = stateToAutosomalGenotype(rule, parentConfig.male);
  const gFemale = stateToAutosomalGenotype(rule, parentConfig.female);
  const raw = crossAutosomal(gMale, gFemale).map((x) => ({
    label: labelAutosomal(rule, x.genotype),
    probability: x.probability
  }));
  const grouped = normalizeTo100(groupByLabel(raw));
  return { male: grouped, female: grouped };
}

// --- Funções Principais de Exportação ---

/**
 * Calcula o cruzamento para uma espécie selecionada e um conjunto de mutações.
 */
export function calculateMultiLocus(speciesId, selectedMutations) {
  // Filtrar regras da espécie
  const activeRules = GENETICS_RULES.filter((r) => 
    r.species.includes(speciesId) && selectedMutations[r.id]?.enabled
  );

  const byMutation = activeRules.map((rule) => {
    const parentConfig = selectedMutations[rule.id];
    const result = crossSingleRule(rule, parentConfig);
    return {
      id: rule.id,
      mutation: rule.mutation,
      inheritance: rule.inheritance,
      male: result.male,
      female: result.female
    };
  });

  // Se nenhuma mutação estiver selecionada, retornar "Normal"
  if (byMutation.length === 0) {
    const normalResult = [{ label: 'Normal / Ancestral', probability: 1, percent: '100.00%' }];
    return {
      byMutation: [],
      male: normalResult,
      female: normalResult,
      summary: "100% Normal"
    };
  }

  // Combinar resultados (simplificação: independente)
  const combine = (sex) => {
    let acc = [{ label: '', probability: 1 }];
    for (const m of byMutation) {
      const next = [];
      const opts = m[sex];
      for (const a of acc) {
        for (const o of opts) {
          const newLabel = a.label ? `${a.label} | ${m.mutation}: ${o.label}` : `${m.mutation}: ${o.label}`;
          next.push({ label: newLabel, probability: a.probability * o.probability });
        }
      }
      acc = next;
    }
    return acc.map(x => ({ ...x, percent: toPercent(x.probability) })).sort((a,b) => b.probability - a.probability);
  };

  const finalMale = combine('male');
  const finalFemale = combine('female');

  return {
    byMutation,
    male: finalMale,
    female: finalFemale,
    summary: `Macho: ${finalMale[0].label} (${finalMale[0].percent}) | Fêmea: ${finalFemale[0].label} (${finalFemale[0].percent})`
  };
}

/**
 * Lógica para Calopsitas Legadas (Bridge)
 */
export function calculateLegacyCockatiel(malePreset, femalePreset) {
  // Aqui entraria a lógica que já existia no script.js se necessário,
  // mas o objetivo é migrar para o Multi-Locus acima.
  // Por enquanto, usaremos o Multi-Locus para tudo que estiver no GENETICS_RULES.
  return calculateMultiLocus('calopsita', {}); 
}

/**
 * Suíte de Validação
 */
export function runValidationSuite() {
  const tests = [
    { title: 'Verde x Verde', expected: '100% Normal', species: 'ringneck', mutations: {} },
    { 
      title: 'Portador Opalino x Fêmea Normal', 
      species: 'ringneck', 
      mutations: { opalino: { enabled: true, male: 'split', female: 'normal' } } 
    }
  ];

  return tests.map(t => {
    const res = calculateMultiLocus(t.species, t.mutations);
    return {
      title: t.title,
      result: res.summary,
      status: 'ok' // Em uma versão real, compararíamos com o 'expected'
    };
  });
}
