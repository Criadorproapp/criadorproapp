import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const OUTPUT_JSON = 'E:\\conversas antigrativit\\criador_pro_social_agent\\dashboard\\src\\pages\\genetics_rules_psitacideos_v1.json';
const OBSIDIAN_VAULT = 'E:\\conversas antigrativit';
const OBSIDIAN_LOG_DIR = path.join(OBSIDIAN_VAULT, '1. Agentes_Logs');

const dotenv = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\dotenv');
const { createClient } = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\@supabase\\supabase-js');

dotenv.config({ path: 'E:\\conversas antigrativit\\criador_pro_social_agent\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY nao encontrados no .env');
}
const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeForJson(input) {
  return String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function isoNow() {
  return new Date().toISOString();
}

function pct(n) {
  return `${Number(n).toFixed(1)}%`;
}

function crossAutosomalSimple(a, b) {
  const out = {};
  for (const ga of a.gametes) {
    for (const gb of b.gametes) {
      const child = [ga.allele, gb.allele].sort().join('');
      out[child] = (out[child] || 0) + ga.p * gb.p;
    }
  }
  return Object.entries(out).map(([geno, p]) => ({ genotype: geno, probability: p }));
}

function summarizeAutosomalDominant(children, dominantAllele = 'V') {
  let visualMut = 0;
  let visualNormal = 0;
  for (const c of children) {
    if (c.genotype.includes(dominantAllele)) visualMut += c.probability;
    else visualNormal += c.probability;
  }
  return {
    visual_mutation: pct(visualMut * 100),
    visual_normal: pct(visualNormal * 100)
  };
}

function summarizeAutosomalRecessive(children, recessiveAllele = 'r') {
  let visualRec = 0;
  let carrier = 0;
  let normal = 0;
  for (const c of children) {
    if (c.genotype === `${recessiveAllele}${recessiveAllele}`) visualRec += c.probability;
    else if (c.genotype.includes(recessiveAllele)) carrier += c.probability;
    else normal += c.probability;
  }
  return {
    visual_recessive: pct(visualRec * 100),
    carriers: pct(carrier * 100),
    normal_non_carrier: pct(normal * 100)
  };
}

function ruleDefinitions(evidence) {
  const dominantExample = crossAutosomalSimple(
    { gametes: [{ allele: 'V', p: 0.5 }, { allele: 'v', p: 0.5 }] },
    { gametes: [{ allele: 'v', p: 1.0 }] }
  );

  const recessiveExample = crossAutosomalSimple(
    { gametes: [{ allele: 'R', p: 0.5 }, { allele: 'r', p: 0.5 }] },
    { gametes: [{ allele: 'R', p: 0.5 }, { allele: 'r', p: 0.5 }] }
  );

  return [
    {
      id: 'opalino',
      mutation: 'Opalino',
      aliases: ['opaline'],
      inheritance: 'sex_linked_recessive',
      chromosome: 'Z',
      priority: 'high',
      confidence: 'high',
      species_scope: ['psittacidae', 'ringneck'],
      evidence_urls: evidence.opalino,
      notes: 'Regra base para calculadora: tratar macho ZZ e femea ZW; femea nao e portadora silenciosa em locus Z.',
      engine_flags: ['requires_sex_input', 'show_carrier_male'],
      validation_status: 'active_v1'
    },
    {
      id: 'pallid',
      mutation: 'Pallid',
      aliases: ['pallids'],
      inheritance: 'sex_linked_recessive',
      chromosome: 'Z',
      priority: 'high',
      confidence: 'high',
      species_scope: ['psittacidae', 'ringneck'],
      evidence_urls: evidence.pallid,
      notes: 'Mesmo modelo de segregacao ligada ao sexo usado em opalino.',
      engine_flags: ['requires_sex_input', 'show_carrier_male'],
      validation_status: 'active_v1'
    },
    {
      id: 'arlequim_dominante',
      mutation: 'Arlequim Dominante',
      aliases: ['harlequin dominant'],
      inheritance: 'autosomal_dominant',
      priority: 'high',
      confidence: 'medium_high',
      species_scope: ['psittacidae', 'ringneck'],
      evidence_urls: evidence.arlequim_dominante,
      example_cross: {
        pairing: 'Vv x vv',
        expected: summarizeAutosomalDominant(dominantExample, 'V')
      },
      notes: 'Heterozigoto visual esperado em media de 50% quando cruzado com normal.',
      engine_flags: ['allow_dominant_heterozygous'],
      validation_status: 'active_v1'
    },
    {
      id: 'arlequim_recessivo',
      mutation: 'Arlequim Recessivo',
      aliases: ['harlequin recessive'],
      inheritance: 'autosomal_recessive',
      priority: 'high',
      confidence: 'medium_high',
      species_scope: ['psittacidae', 'ringneck'],
      evidence_urls: evidence.arlequim_recessivo,
      example_cross: {
        pairing: 'Rr x Rr',
        expected: summarizeAutosomalRecessive(recessiveExample, 'r')
      },
      notes: 'Portadores devem ser exibidos explicitamente no resultado da calculadora.',
      engine_flags: ['show_carriers'],
      validation_status: 'active_v1'
    },
    {
      id: 'cleartail',
      mutation: 'Cleartail',
      aliases: ['clear tail'],
      inheritance: 'autosomal_recessive',
      priority: 'high',
      confidence: 'medium',
      species_scope: ['psittacidae', 'ringneck'],
      evidence_urls: evidence.cleartail,
      notes: 'Validar nomenclatura local de portador no front para consistencia com criatorio.',
      engine_flags: ['show_carriers'],
      validation_status: 'active_v1'
    },
    {
      id: 'violeta',
      mutation: 'Violeta',
      aliases: ['violet'],
      inheritance: 'autosomal_incomplete_dominant',
      priority: 'high',
      confidence: 'medium',
      species_scope: ['psittacidae', 'ringneck', 'multi_species_psittacidae'],
      evidence_urls: evidence.violeta,
      notes: 'Motor deve distinguir dose simples e dupla quando o fenotipo diferir por intensidade.',
      engine_flags: ['support_single_double_factor'],
      validation_status: 'active_v1'
    }
  ];
}

function selectEvidence(rows) {
  const byKeyword = (keywords, fonte) =>
    rows
      .filter((r) => r.fonte === fonte)
      .filter((r) => {
        const t = `${r.titulo}\n${r.resumo}`.toLowerCase();
        return keywords.some((k) => t.includes(k));
      })
      .slice(0, 6)
      .map((r) => r.url);

  return {
    opalino: byKeyword(['opalino', 'opaline'], 'Biblioteca Interna (Planilhas Ring Neck)'),
    pallid: byKeyword(['pallid'], 'Biblioteca Interna (Planilhas Ring Neck)'),
    arlequim_dominante: byKeyword(['arlequim-dominante', 'arlequim dominante'], 'Biblioteca Interna (Planilhas Ring Neck)'),
    arlequim_recessivo: byKeyword(['arlequim-recessivo', 'arlequim recessivo'], 'Biblioteca Interna (Planilhas Ring Neck)'),
    cleartail: byKeyword(['cleartail'], 'Biblioteca Interna (Planilhas Ring Neck)'),
    violeta: byKeyword(['violeta', 'violet'], 'Biblioteca Interna (Planilhas Ring Neck)')
  };
}

async function main() {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id,titulo,resumo,url,fonte,criado_em')
    .in('fonte', [
      'Biblioteca Interna (Planilhas Ring Neck)',
      'Biblioteca Interna (Guia Mutacoes Psitacideos)'
    ])
    .order('criado_em', { ascending: false });

  if (error) throw new Error(`Erro ao ler knowledge_base: ${error.message}`);
  const rows = data || [];
  if (!rows.length) throw new Error('Nenhuma base encontrada para montar regras v1.');

  const evidence = selectEvidence(rows);
  const rules = ruleDefinitions(evidence);

  const payload = {
    version: 'psitacideos-v1',
    generated_at: isoNow(),
    source_priority: [
      'Biblioteca Interna (Guia Mutacoes Psitacideos)',
      'Biblioteca Interna (Planilhas Ring Neck)'
    ],
    assumptions: [
      'Regra por mutacao modelada para motor base v1 com foco em psitacideos.',
      'Algumas mutacoes devem receber calibracao por especie na v2.',
      'Quando faltarem evidencias estruturadas, manter confidence medio e exigir validacao.',
      'Para mutacoes ligadas ao sexo, sexo dos parentais e obrigatorio.'
    ],
    rules
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(payload, null, 2), 'utf-8');

  const resumo = [
    `Versao: ${payload.version}`,
    `Gerado em: ${payload.generated_at}`,
    `Regras ativas: ${rules.length}`,
    '',
    'Mutacoes modeladas:',
    ...rules.map((r, i) => `${i + 1}. ${r.mutation} | ${r.inheritance} | confidence=${r.confidence}`),
    '',
    'Observacao:',
    '- Esta base foi desenhada para alimentar o cerebro inicial da calculadora.',
    '- Na proxima etapa, adicionar tabela de cruzamento por especie e epistasia.'
  ].join('\n');

  const { error: upsertError } = await supabase
    .from('knowledge_base')
    .upsert(
      [{
        titulo: sanitizeForJson('Motor Genetico Psitacideos | Regras Estruturadas v1'),
        resumo: sanitizeForJson(resumo),
        url: sanitizeForJson(`file:///${OUTPUT_JSON.replace(/\\/g, '/')}`),
        fonte: sanitizeForJson('Motor Genetico Psitacideos (Regras v1)'),
        criado_em: isoNow()
      }],
      { onConflict: 'url' }
    );

  if (upsertError) throw new Error(`Erro ao salvar resumo no Supabase: ${upsertError.message}`);

  const now = new Date();
  const mdName = `JARVIS_REGRAS_PSITACIDEOS_V1_${now.toISOString().slice(0, 10)}_${Math.floor(Math.random() * 9999)}.md`;
  const mdPath = path.join(OBSIDIAN_LOG_DIR, mdName);
  const md = [
    '---',
    'Agente: JARVIS_RULES_ENGINE',
    `Data: ${now.toLocaleString('pt-BR')}`,
    '---',
    '',
    '# Motor Genetico | Psitacideos v1',
    '',
    `Arquivo de regras: ${OUTPUT_JSON}`,
    `Regras modeladas: ${rules.length}`,
    `Base consultada: ${rows.length} registros da knowledge_base`,
    '',
    '## Mutacoes ativas',
    ...rules.map((r, i) => `${i + 1}. ${r.mutation} | heranca=${r.inheritance} | confianca=${r.confidence}`),
    '',
    '## Proximo passo tecnico',
    '- Implementar resolvedor de cruzamento multi-locus com sexo e portadores.',
    '- Adicionar regressao com casos reais de criatorio (amostras historicas).',
    '- Criar laudo explicavel com regra aplicada e fonte de evidencia.'
  ].join('\n');

  fs.mkdirSync(OBSIDIAN_LOG_DIR, { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');

  console.log(`[RULES] JSON OK: ${OUTPUT_JSON}`);
  console.log(`[RULES] Supabase resumo OK`);
  console.log(`[RULES] Obsidian OK: ${mdPath}`);
}

main().catch((err) => {
  console.error(`[RULES] ERRO: ${err.message}`);
  process.exitCode = 1;
});
