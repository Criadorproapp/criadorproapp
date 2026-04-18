import rulesData from './genetics_rules_psitacideos_v1.json';
import ringneckCatalog from './ringneck_catalogo_presets.json';
import arlequimTableSources from './arlequim_table_sources.json';
import cleartailTableSources from './cleartail_table_sources.json';
import sexlinkedTableSources from './sexlinked_table_sources.json';

const BASE_RULES = rulesData.rules || [];
const RINGNECK_CATALOG_ITEMS = ringneckCatalog.items || [];
const RINGNECK_OFFICIAL_PHENOTYPES = Array.from(new Set(RINGNECK_CATALOG_ITEMS.map((item) => item.label)));
const ARLEQUIM_TABLE_SOURCES = arlequimTableSources.sources || [];
const CLEARTAIL_TABLE_SOURCES = cleartailTableSources.sources || [];
const SEXLINKED_TABLE_SOURCES = sexlinkedTableSources.sources || [];

export const RINGNECK_CLEARTAIL_PRESETS = [
  { value: 'green', label: 'Verde Ancestral' },
  { value: 'green_split_blue', label: 'Verde / Azul' },
  { value: 'blue', label: 'Azul' },
  { value: 'green_split_cleartail', label: 'Verde / Cleartail' },
  { value: 'blue_split_cleartail', label: 'Azul / Cleartail' },
  { value: 'green_split_blue_cleartail', label: 'Verde / Azul / Cleartail' },
  { value: 'cleartail_green', label: 'Cleartail Verde' },
  { value: 'cleartail_green_split_blue', label: 'Cleartail Verde / Azul' },
  { value: 'cleartail_blue', label: 'Cleartail Azul' }
];

export const BLUE_SERIES_PRESETS = [
  { value: 'green', label: 'Verde' },
  { value: 'blue', label: 'Azul' },
  { value: 'turquoise', label: 'Turquesa' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'sapphire', label: 'Safira' },
  { value: 'green_blue', label: 'Verde / Azul' },
  { value: 'green_turquoise', label: 'Verde / Turquesa' },
  { value: 'green_indigo', label: 'Verde / Índigo' },
  { value: 'green_sapphire', label: 'Verde / Safira' },
  { value: 'blue_turquoise', label: 'Azul / Turquesa' },
  { value: 'blue_indigo', label: 'Azul / Índigo' },
  { value: 'blue_sapphire', label: 'Azul / Safira' },
  { value: 'turquoise_indigo', label: 'Turquesa / Índigo' },
  { value: 'turquoise_sapphire', label: 'Turquesa / Safira' },
  { value: 'indigo_sapphire', label: 'Índigo / Safira' }
];

export const SPECIES_ROADMAP = [
  {
    id: 'ringneck',
    label: 'Ringneck',
    status: 'ativo',
    note: 'Motor principal validado com Cleartail, serie azul, sex-linked e bibliografia carregada.'
  },
  {
    id: 'calopsita',
    label: 'Calopsita',
    status: 'em preparacao',
    note: 'Proxima familia em foco, aguardando tabelas e cruzamentos de referencia dedicados.'
  },
  {
    id: 'agapornis',
    label: 'Agapornis',
    status: 'planejado',
    note: 'Estrutura reservada para a fase seguinte do motor genetico.'
  },
  {
    id: 'outras_psitacideos',
    label: 'Outros psitacideos',
    status: 'planejado',
    note: 'Expansao posterior para novas especies da mesma familia.'
  }
];

export function getSpeciesRoadmap() {
  return SPECIES_ROADMAP.map((item) => ({ ...item }));
}

export function getRingneckOfficialPhenotypes() {
  return RINGNECK_OFFICIAL_PHENOTYPES.slice();
}

export function getRingneckOfficialPhenotypesByGroup() {
  const groups = new Map();
  for (const item of RINGNECK_CATALOG_ITEMS) {
    const group = item.group || 'Outros';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(item.label);
  }
  return Array.from(groups.entries()).map(([group, labels]) => ({
    group,
    labels: Array.from(new Set(labels)).sort()
  }));
}

const RINGNECK_PRESET_MAP = {
  green: { blue: 'BB', cleartail: 'CC' },
  green_split_blue: { blue: 'Bb', cleartail: 'CC' },
  blue: { blue: 'bb', cleartail: 'CC' },
  green_split_cleartail: { blue: 'BB', cleartail: 'Cc' },
  blue_split_cleartail: { blue: 'bb', cleartail: 'Cc' },
  green_split_blue_cleartail: { blue: 'Bb', cleartail: 'Cc' },
  cleartail_green: { blue: 'BB', cleartail: 'cc' },
  cleartail_green_split_blue: { blue: 'Bb', cleartail: 'cc' },
  cleartail_blue: { blue: 'bb', cleartail: 'cc' }
};

const BLUE_SERIES_PRESET_MAP = {
  green: 'BB',
  blue: 'UU',
  turquoise: 'TT',
  indigo: 'II',
  sapphire: 'SS',
  green_blue: 'BU',
  green_turquoise: 'BT',
  green_indigo: 'BI',
  green_sapphire: 'BS',
  blue_turquoise: 'UT',
  blue_indigo: 'UI',
  blue_sapphire: 'US',
  turquoise_indigo: 'TI',
  turquoise_sapphire: 'TS',
  indigo_sapphire: 'IS'
};

const MUTATION_VISUAL_LABELS = {
  cleartail: {
    visual: 'Cleartail visual',
    carrier: 'Portador de Cleartail',
    normal: 'Verde / normal'
  },
  arlequim_recessivo: {
    visual: 'Arlequim recessivo visual',
    carrier: 'Portador de arlequim recessivo',
    normal: 'Verde / normal'
  },
  arlequim_dominante: {
    sf: 'Arlequim dominante visual',
    df: 'Arlequim dominante fator duplo',
    normal: 'Verde / normal'
  },
  violeta: {
    sf: 'Violeta fator simples',
    df: 'Violeta fator duplo',
    normal: 'Sem fator violeta'
  },
  opalino: {
    visual: 'Opalino visual',
    carrier: 'Portador de opalino',
    normal: 'Sem opalino'
  },
  pallid: {
    visual: 'Pallid visual',
    carrier: 'Portador de pallid',
    normal: 'Sem pallid'
  }
};

function groupByLabel(items) {
  const acc = new Map();
  for (const item of items) {
    const key = item.label;
    acc.set(key, (acc.get(key) || 0) + item.probability);
  }
  return Array.from(acc.entries()).map(([label, probability]) => ({ label, probability }));
}

function normalizeTo100(items) {
  const sum = items.reduce((s, x) => s + x.probability, 0);
  if (!sum) return items;
  return items.map((x) => ({ ...x, probability: x.probability / sum }));
}

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

function crossTwoAlleles(gen1, gen2) {
  const out = {};
  for (const a of gen1.split('')) {
    for (const b of gen2.split('')) {
      const genotype = [a, b].sort().join('');
      out[genotype] = (out[genotype] || 0) + 0.25;
    }
  }
  return Object.entries(out).map(([genotype, probability]) => ({ genotype, probability }));
}

function combineIndependentLoci(locusA, locusB) {
  const out = [];
  for (const a of locusA) {
    for (const b of locusB) {
      out.push({
        blue: a.genotype,
        cleartail: b.genotype,
        probability: a.probability * b.probability
      });
    }
  }
  return out;
}

function presetToRingneckGenes(preset) {
  return RINGNECK_PRESET_MAP[preset] || RINGNECK_PRESET_MAP.green;
}

function ringneckPhenotypeFromGenes(genes) {
  const isBlue = genes.blue === 'bb';
  const splitBlue = genes.blue === 'Bb';
  const isCleartail = genes.cleartail === 'cc';
  const splitCleartail = genes.cleartail === 'Cc';

  if (isCleartail) {
    let label = isBlue ? 'Cleartail Azul' : 'Cleartail Verde';
    if (splitBlue) label += ' / Azul';
    return label;
  }

  let label = isBlue ? 'Azul' : 'Verde';
  if (splitBlue && !isBlue) label += ' / Azul';
  if (splitCleartail) label += ' / Cleartail';
  return label;
}

function ringneckFormulaFromGenes(genes) {
  return `blue:${genes.blue} | cleartail:${genes.cleartail}`;
}

function ringneckSexRowFromChild(child) {
  const phenotype = ringneckPhenotypeFromGenes(child);
  return {
    phenotype,
    formula: ringneckFormulaFromGenes(child),
    probability: child.probability,
    percent: toPercent(child.probability)
  };
}

function makeRingneckSexSummary(rows) {
  if (!rows.length) return 'Sem resultado';
  if (rows.length === 1) return `${rows[0].phenotype} (${rows[0].percent})`;
  const top = rows.slice(0, 3).map((row) => `${row.phenotype} (${row.percent})`);
  const extra = rows.length > 3 ? ` + ${rows.length - 3} combinações` : '';
  return `${top.join(' | ')}${extra}`;
}

function blueSeriesPresetToGenotype(preset) {
  return BLUE_SERIES_PRESET_MAP[preset] || BLUE_SERIES_PRESET_MAP.green;
}

function blueSeriesPhenotypeFromGenotype(genotype) {
  const alleleOrder = { B: 0, U: 1, T: 2, I: 3, S: 4 };
  const key = genotype
    .split('')
    .sort((a, b) => (alleleOrder[a] ?? 99) - (alleleOrder[b] ?? 99))
    .join('');
  const labels = {
    BB: 'Verde',
    UU: 'Azul',
    TT: 'Turquesa',
    II: 'Índigo',
    SS: 'Safira',
    BU: 'Verde / Azul',
    BT: 'Verde / Turquesa',
    BI: 'Verde / Índigo',
    BS: 'Verde / Safira',
    UT: 'Azul / Turquesa',
    UI: 'Azul / Índigo',
    US: 'Azul / Safira',
    TI: 'Turquesa / Índigo',
    TS: 'Turquesa / Safira',
    IS: 'Índigo / Safira'
  };
  return labels[key] || key;
}

function calculateBlueSeriesCross(malePreset, femalePreset) {
  const male = blueSeriesPresetToGenotype(malePreset);
  const female = blueSeriesPresetToGenotype(femalePreset);
  const cross = crossTwoAlleles(male, female);
  const grouped = new Map();

  for (const child of cross) {
    const phenotype = blueSeriesPhenotypeFromGenotype(child.genotype);
    const current = grouped.get(phenotype) || { phenotype, probability: 0, formulas: new Set() };
    current.probability += child.probability;
    current.formulas.add(`blue_series:${child.genotype}`);
    grouped.set(phenotype, current);
  }

  const rows = Array.from(grouped.values())
    .map((item) => ({
      phenotype: item.phenotype,
      probability: item.probability,
      percent: toPercent(item.probability),
      formulas: Array.from(item.formulas)
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    father: {
      name: BLUE_SERIES_PRESETS.find((item) => item.value === malePreset)?.label || 'Verde',
      formula: `blue_series:${male}`
    },
    mother: {
      name: BLUE_SERIES_PRESETS.find((item) => item.value === femalePreset)?.label || 'Verde',
      formula: `blue_series:${female}`
    },
    male: rows,
    female: rows,
    headline: `Macho: ${rows.map((row) => `${row.phenotype} ${row.percent}`).join(' | ')} | Fêmea: ${rows.map((row) => `${row.phenotype} ${row.percent}`).join(' | ')}`,
    notes: 'Série azul modelada como locus multialélico base para psitacídeos. Resultado igual para macho e fêmea por ser locus autossômico.'
  };
}

export function calculateRingneckCleartail(malePreset, femalePreset) {
  const maleGenes = presetToRingneckGenes(malePreset);
  const femaleGenes = presetToRingneckGenes(femalePreset);

  const blueCross = crossTwoAlleles(maleGenes.blue, femaleGenes.blue);
  const cleartailCross = crossTwoAlleles(maleGenes.cleartail, femaleGenes.cleartail);
  const combined = combineIndependentLoci(blueCross, cleartailCross);

  const grouped = new Map();
  for (const child of combined) {
    const phenotype = ringneckPhenotypeFromGenes(child);
    grouped.set(phenotype, (grouped.get(phenotype) || 0) + child.probability);
  }

  const rows = Array.from(grouped.entries())
    .map(([phenotype, probability]) => ({
      phenotype,
      probability,
      percent: toPercent(probability)
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    male: rows,
    female: rows,
    notes: 'Cleartail e Azul tratados como loci autossômicos independentes neste modo baseado na planilha.'
  };
}

class RingneckMutation {
  constructor(name, genotype) {
    this.name = name;
    this.genotype = genotype;
  }

  getFormula() {
    return `${this.name}:${this.genotype}`;
  }
}

class RingneckBird {
  constructor(gender, preset) {
    this.gender = gender;
    this.preset = preset;
    this.label = RINGNECK_CLEARTAIL_PRESETS.find((item) => item.value === preset)?.label || 'Verde Ancestral';
    const genes = presetToRingneckGenes(preset);
    this.mutations = [
      new RingneckMutation('blue', genes.blue),
      new RingneckMutation('cleartail', genes.cleartail)
    ];
  }

  getMutationFullName() {
    return this.label;
  }

  getGenePair(name) {
    return this.mutations.find((item) => item.name === name)?.genotype || 'CC';
  }

  getGenFormula() {
    return this.mutations.map((item) => item.getFormula()).join(' | ');
  }
}

class RingneckGenCalcEngine {
  constructor(father, mother) {
    this.father = father;
    this.mother = mother;
  }

  calculate() {
    const blueCross = crossTwoAlleles(this.father.getGenePair('blue'), this.mother.getGenePair('blue'));
    const cleartailCross = crossTwoAlleles(this.father.getGenePair('cleartail'), this.mother.getGenePair('cleartail'));
    const combined = combineIndependentLoci(blueCross, cleartailCross);
    const grouped = new Map();

    for (const child of combined) {
      const phenotype = ringneckPhenotypeFromGenes(child);
      const formula = `blue:${child.blue} | cleartail:${child.cleartail}`;
      const current = grouped.get(phenotype) || { phenotype, probability: 0, formulas: new Set() };
      current.probability += child.probability;
      current.formulas.add(formula);
      grouped.set(phenotype, current);
    }

    const rows = Array.from(grouped.values())
      .map((item) => ({
        phenotype: item.phenotype,
        probability: item.probability,
        percent: toPercent(item.probability),
        formulas: Array.from(item.formulas)
      }))
      .sort((a, b) => b.probability - a.probability);

    const sexSummary = {
      male: makeRingneckSexSummary(rows),
      female: makeRingneckSexSummary(rows)
    };

    return {
      father: {
        name: this.father.getMutationFullName(),
        formula: this.father.getGenFormula()
      },
      mother: {
        name: this.mother.getMutationFullName(),
        formula: this.mother.getGenFormula()
      },
      male: rows,
      female: rows,
      headline: `Macho: ${sexSummary.male} | Fêmea: ${sexSummary.female}`,
      sexSummary,
      notes: 'Motor Ringneck baseado em loci autossomicos independentes para azul e cleartail, estruturado em Bird + Mutation + Engine.'
    };
  }
}

export function calculateRingneckCleartailAdvanced(malePreset, femalePreset) {
  const father = new RingneckBird('male', malePreset);
  const mother = new RingneckBird('female', femalePreset);
  return new RingneckGenCalcEngine(father, mother).calculate();
}

export function calculateBlueSeriesAdvanced(malePreset, femalePreset) {
  return calculateBlueSeriesCross(malePreset, femalePreset);
}

function buildSingleRuleSelection(ruleId, maleState, femaleState) {
  const rule = BASE_RULES.find((item) => item.id === ruleId);
  if (!rule) return null;
  const opts = getParentOptions(rule);
  return {
    [ruleId]: {
      enabled: true,
      male: maleState || opts.male[0].value,
      female: femaleState || opts.female[0].value
    }
  };
}

export function getRingneckBaseMatrix() {
  const blueGreen = calculateBlueSeriesCross('blue', 'green');
  const blueBlue = calculateBlueSeriesCross('blue', 'blue');
  const blueGreenToGreen = calculateBlueSeriesCross('green', 'green');

  const cleartail = calculateRingneckCleartailAdvanced('cleartail_green', 'cleartail_green');

  const opalino = calculateMultiLocus(buildSingleRuleSelection('opalino', 'split', 'visual'));
  const pallid = calculateMultiLocus(buildSingleRuleSelection('pallid', 'split', 'visual'));
  const violeta = calculateMultiLocus(buildSingleRuleSelection('violeta', 'sf', 'normal'));

  return [
    {
      title: 'Azul x Verde',
      expected: '100% Verde/Azul',
      result: blueGreen
    },
    {
      title: 'Azul x Azul',
      expected: '100% Azul',
      result: blueBlue
    },
    {
      title: 'Verde x Verde',
      expected: '100% Verde',
      result: blueGreenToGreen
    },
    {
      title: 'Cleartail x Cleartail',
      expected: '100% Cleartail Verde',
      result: cleartail
    },
    {
      title: 'Opalino',
      expected: 'Macho split x Fêmea visual',
      result: {
        father: { name: 'Opalino', formula: 'opalino:selecionado' },
        mother: { name: 'Opalino', formula: 'opalino:selecionado' },
        male: opalino.summary.male,
        female: opalino.summary.female,
        headline: `Macho: ${opalino.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${opalino.summary.female[0]?.phenotype || 'Sem resultado'}`
      }
    },
    {
      title: 'Pallid',
      expected: 'Macho split x Fêmea visual',
      result: {
        father: { name: 'Pallid', formula: 'pallid:selecionado' },
        mother: { name: 'Pallid', formula: 'pallid:selecionado' },
        male: pallid.summary.male,
        female: pallid.summary.female,
        headline: `Macho: ${pallid.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${pallid.summary.female[0]?.phenotype || 'Sem resultado'}`
      }
    },
    {
      title: 'Violeta SF x Normal',
      expected: '50% Violeta SF / 50% Normal',
      result: {
        father: { name: 'Violeta', formula: 'violeta:selecionado' },
        mother: { name: 'Violeta', formula: 'violeta:selecionado' },
        male: violeta.summary.male,
        female: violeta.summary.female,
        headline: `Macho: ${violeta.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${violeta.summary.female[0]?.phenotype || 'Sem resultado'}`
      }
    }
  ];
}

function rowMap(rows) {
  const out = new Map();
  for (const row of rows || []) {
    const rawLabel = row.phenotype || row.label || '';
    const cleanLabel = rawLabel
      .split(' | ')
      .map((part) => part.replace(/^[^:]+:\s*/, '').trim())
      .filter(Boolean)
      .join(' | ');
    const probability = Number(row.probability ?? (parseFloat(String(row.percent).replace('%', '')) / 100) ?? 0);
    out.set(rawLabel, probability);
    out.set(cleanLabel, probability);
  }
  return out;
}

function percentClose(a, b, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

function verifyRowExpectation(rows, expectations) {
  const map = rowMap(rows);
  return expectations.every((exp) => {
    const actual = map.get(exp.label) ?? 0;
    return percentClose(actual, exp.probability);
  });
}

function summarizeVerification(result, expectedMale, expectedFemale) {
  return {
    status:
      verifyRowExpectation(result.male, expectedMale) &&
      verifyRowExpectation(result.female, expectedFemale)
        ? 'ok'
        : 'ajustar',
    male: result.male,
    female: result.female,
    headline:
      result.headline ||
      `Macho: ${result.male?.map((r) => `${r.phenotype} ${r.percent}`).join(' | ')} | Fêmea: ${result.female?.map((r) => `${r.phenotype} ${r.percent}`).join(' | ')}`
  };
}

export function getRingneckVerificationSuite() {
  const cases = [
    {
      title: 'Azul x Verde',
      expectedMale: [{ label: 'Verde / Azul', probability: 1 }],
      expectedFemale: [{ label: 'Verde / Azul', probability: 1 }],
      result: calculateBlueSeriesCross('blue', 'green')
    },
    {
      title: 'Azul x Azul',
      expectedMale: [{ label: 'Azul', probability: 1 }],
      expectedFemale: [{ label: 'Azul', probability: 1 }],
      result: calculateBlueSeriesCross('blue', 'blue')
    },
    {
      title: 'Verde x Verde',
      expectedMale: [{ label: 'Verde', probability: 1 }],
      expectedFemale: [{ label: 'Verde', probability: 1 }],
      result: calculateBlueSeriesCross('green', 'green')
    },
    {
      title: 'Cleartail x Cleartail',
      expectedMale: [{ label: 'Cleartail Verde', probability: 1 }],
      expectedFemale: [{ label: 'Cleartail Verde', probability: 1 }],
      result: calculateRingneckCleartailAdvanced('cleartail_green', 'cleartail_green')
    },
    {
      title: 'Opalino split x visual',
      expectedMale: [
        { label: 'Portador de opalino', probability: 0.5 },
        { label: 'Opalino visual', probability: 0.5 }
      ],
      expectedFemale: [
        { label: 'Sem opalino', probability: 0.5 },
        { label: 'Opalino visual', probability: 0.5 }
      ],
      result: (() => {
        const op = calculateMultiLocus(buildSingleRuleSelection('opalino', 'split', 'visual'));
        return {
          male: op.summary.male,
          female: op.summary.female,
          headline: `Macho: ${op.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${op.summary.female[0]?.phenotype || 'Sem resultado'}`
        };
      })()
    },
    {
      title: 'Pallid split x visual',
      expectedMale: [
        { label: 'Portador de pallid', probability: 0.5 },
        { label: 'Pallid visual', probability: 0.5 }
      ],
      expectedFemale: [
        { label: 'Sem pallid', probability: 0.5 },
        { label: 'Pallid visual', probability: 0.5 }
      ],
      result: (() => {
        const pa = calculateMultiLocus(buildSingleRuleSelection('pallid', 'split', 'visual'));
        return {
          male: pa.summary.male,
          female: pa.summary.female,
          headline: `Macho: ${pa.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${pa.summary.female[0]?.phenotype || 'Sem resultado'}`
        };
      })()
    },
    {
      title: 'Violeta SF x Normal',
      expectedMale: [
        { label: 'Violeta fator simples', probability: 0.5 },
        { label: 'Sem fator violeta', probability: 0.5 }
      ],
      expectedFemale: [
        { label: 'Violeta fator simples', probability: 0.5 },
        { label: 'Sem fator violeta', probability: 0.5 }
      ],
      result: (() => {
        const vi = calculateMultiLocus(buildSingleRuleSelection('violeta', 'sf', 'normal'));
        return {
          male: vi.summary.male,
          female: vi.summary.female,
          headline: `Macho: ${vi.summary.male[0]?.phenotype || 'Sem resultado'} | Fêmea: ${vi.summary.female[0]?.phenotype || 'Sem resultado'}`
        };
      })()
    }
  ];

  return cases.map((item) => ({
    title: item.title,
    status:
      verifyRowExpectation(item.result.male, item.expectedMale) &&
      verifyRowExpectation(item.result.female, item.expectedFemale)
        ? 'ok'
        : 'ajustar',
    expectedMale: item.expectedMale,
    expectedFemale: item.expectedFemale,
    result: item.result
  }));
}

function labelAutosomal(rule, genotype) {
  const inh = rule.inheritance;
  const labels = MUTATION_VISUAL_LABELS[rule.id] || {};

  if (inh === 'autosomal_recessive') {
    if (genotype === 'aa') return labels.visual || 'visual';
    if (genotype === 'Aa') return labels.carrier || 'portador';
    return labels.normal || 'normal';
  }
  if (inh === 'autosomal_dominant') {
    if (genotype === 'AA') return labels.df || 'visual fator duplo';
    if (genotype === 'Aa') return labels.sf || 'visual fator simples';
    return labels.normal || 'normal';
  }
  if (inh === 'autosomal_incomplete_dominant') {
    if (genotype === 'AA') return labels.df || 'visual fator duplo';
    if (genotype === 'Aa') return labels.sf || 'visual fator simples';
    return labels.normal || 'normal';
  }
  return 'nao classificado';
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
  const labels = MUTATION_VISUAL_LABELS[rule.id] || {};

  for (const sperm of maleGametes) {
    for (const egg of femaleGametes) {
      const p = sperm.p * egg.p;
      if (egg.w) {
        const label = sperm.z === 'm' ? labels.visual || 'visual' : labels.normal || 'normal';
        femaleOffspring.push({ label, probability: p });
      } else {
        const hasMutation = sperm.z === 'm' || egg.z === 'm';
        const isVisual = sperm.z === 'm' && egg.z === 'm';
        let label = labels.normal || 'normal';
        if (isVisual) label = labels.visual || 'visual';
        else if (hasMutation) label = labels.carrier || 'portador';
        maleOffspring.push({ label, probability: p });
      }
    }
  }

  return {
    male: normalizeTo100(groupByLabel(maleOffspring)),
    female: normalizeTo100(groupByLabel(femaleOffspring))
  };
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

function combineBySex(mutationResults, sex) {
  let acc = [{ label: 'base', probability: 1 }];
  for (const mr of mutationResults) {
    const cats = mr[sex] || [];
    if (!cats.length) continue;
    const next = [];
    for (const a of acc) {
      for (const c of cats) {
        const lbl = `${a.label === 'base' ? '' : `${a.label} | `}${mr.mutation}: ${c.label}`;
        next.push({ label: lbl, probability: a.probability * c.probability });
      }
    }
    acc = next;
  }
  const sorted = acc.sort((a, b) => b.probability - a.probability);
  const top = sorted.slice(0, 18);
  const rest = sorted.slice(18).reduce((s, x) => s + x.probability, 0);
  if (rest > 0) top.push({ label: 'Outras combinacoes', probability: rest });
  return top;
}

function summarizePhenotypeLabel(label) {
  const parts = label
    .split(' | ')
    .map((part) => part.replace(/^[^:]+:\s*/, '').trim())
    .filter((part) => part.toLowerCase() !== 'base' && part.length > 0);

  if (!parts.length) return 'Verde / normal';

  const hasArlequim = parts.some((part) => /arlequim/i.test(part));
  if (hasArlequim) {
    const normalized = parts
      .map((part) => {
        if (/portador de arlequim recessivo/i.test(part)) return '/ Arlequim Recessivo';
        if (/arlequim recessivo visual/i.test(part)) return 'Arlequim Recessivo';
        if (/arlequim recessivo/i.test(part)) return 'Arlequim Recessivo';
        if (/arlequim dominante/i.test(part)) {
          if (/df|fator duplo/i.test(part)) return 'DF Arlequim Dominante';
          return 'SF Arlequim Dominante';
        }
        return part;
      })
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized || 'Arlequim';
  }

  return parts.join(' + ') || 'Verde / normal';
}

export function getRules() {
  return BASE_RULES;
}

export function getParentOptions(rule) {
  if (rule.inheritance === 'sex_linked_recessive') {
    return {
      male: [
        { value: 'normal', label: 'Normal' },
        { value: 'split', label: 'Portador (split)' },
        { value: 'visual', label: 'Visual' }
      ],
      female: [
        { value: 'normal', label: 'Normal' },
        { value: 'visual', label: 'Visual' }
      ]
    };
  }

  if (rule.inheritance === 'autosomal_recessive') {
    const opts = [
      { value: 'normal', label: 'Normal' },
      { value: 'carrier', label: 'Portador' },
      { value: 'visual', label: 'Visual' }
    ];
    return { male: opts, female: opts };
  }

  const opts = [
    { value: 'normal', label: 'Normal' },
    { value: 'sf', label: 'Visual fator simples' },
    { value: 'df', label: 'Visual fator duplo' }
  ];
  return { male: opts, female: opts };
}

export function calculateMultiLocus(selectedMutations) {
  const activeRules = BASE_RULES.filter((r) => selectedMutations[r.id]?.enabled);
  const byMutation = activeRules.map((rule) => {
    const parentConfig = selectedMutations[rule.id];
    const result = crossSingleRule(rule, parentConfig);
    return {
      mutation: rule.mutation,
      inheritance: rule.inheritance,
      confidence: rule.confidence,
      notes: rule.notes,
      evidence_urls: rule.evidence_urls || [],
      male: result.male,
      female: result.female
    };
  });

  const combined = {
    male: combineBySex(byMutation, 'male'),
    female: combineBySex(byMutation, 'female')
  };

  return {
    byMutation,
    combined,
    summary: {
      male: combined.male.map((item) => ({
        ...item,
        phenotype: summarizePhenotypeLabel(item.label)
      })),
      female: combined.female.map((item) => ({
        ...item,
        phenotype: summarizePhenotypeLabel(item.label)
      }))
    }
  };
}

export function formatProbabilityRows(rows) {
  return rows.map((r) => ({ ...r, percent: toPercent(r.probability) }));
}

export function getArlequimTableSources() {
  return ARLEQUIM_TABLE_SOURCES.map((source) => ({
    mutationId: source.mutationId,
    label: source.label,
    file: source.file,
    pageCount: source.pageCount,
    blockCount: source.blockCount,
    sampleHeadings: (source.blocks || [])
      .slice(0, 6)
      .map((block) => block.heading)
      .filter(Boolean)
  }));
}

export function getCleartailTableSources() {
  return CLEARTAIL_TABLE_SOURCES.map((source) => ({
    mutationId: source.mutationId,
    label: source.label,
    file: source.file,
    pageCount: source.pageCount,
    blockCount: source.blockCount,
    sampleHeadings: (source.blocks || [])
      .slice(0, 6)
      .map((block) => block.heading)
      .filter(Boolean)
  }));
}

export function getReferenceBibliographySources() {
  return [
    ...getArlequimTableSources().map((source) => ({ ...source, category: 'Arlequim' })),
    ...getCleartailTableSources().map((source) => ({ ...source, category: 'Cleartail' })),
    ...SEXLINKED_TABLE_SOURCES.map((source) => ({
      mutationId: source.mutationId,
      label: source.label,
      file: source.file,
      pageCount: source.pageCount,
      blockCount: source.blockCount,
      sampleHeadings: (source.blocks || [])
        .slice(0, 6)
        .map((block) => block.heading)
        .filter(Boolean),
      category: 'Sex-linked'
    }))
  ];
}

export function getSexlinkedTableSources() {
  return SEXLINKED_TABLE_SOURCES.map((source) => ({
    mutationId: source.mutationId,
    label: source.label,
    file: source.file,
    pageCount: source.pageCount,
    blockCount: source.blockCount,
    sampleHeadings: (source.blocks || [])
      .slice(0, 6)
      .map((block) => block.heading)
      .filter(Boolean)
  }));
}
