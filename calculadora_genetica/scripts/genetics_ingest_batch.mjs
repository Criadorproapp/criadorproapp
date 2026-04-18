import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ROOT_BOOKS = 'E:\\02_Cursos_e_Estudos\\livros';
const OBSIDIAN_VAULT = 'E:\\conversas antigrativit';
const OBSIDIAN_LOG_DIR = path.join(OBSIDIAN_VAULT, '1. Agentes_Logs');
const MAX_ITEMS = Number(process.env.INGEST_MAX || 16);
const MAX_PER_FAMILY = Number(process.env.INGEST_MAX_PER_FAMILY || 3);
const FOCUS = (process.env.INGEST_FOCUS || 'all').toLowerCase(); // all | psitacideos | passariformes

const { PDFParse } = require('E:\\conversas antigrativit\\backend\\node_modules\\pdf-parse');
const dotenv = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\dotenv');
let createClient;
try {
  ({ createClient } = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\@supabase\\supabase-js'));
} catch {
  ({ createClient } = require('E:\\conversas antigrativit\\backend\\node_modules\\@supabase\\supabase-js'));
}

dotenv.config({ path: 'E:\\conversas antigrativit\\criador_pro_social_agent\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY não encontrados no .env');
}
const supabase = createClient(supabaseUrl, supabaseKey);

const RELEVANCE_PATTERNS = [
  /genet/i,
  /mutation|mutaç|muta/i,
  /psitac|parrot|papagaio|ringneck|cockatiel|calopsita/i,
  /passariform|canari|canário/i,
  /phylogeny|filogen/i,
  /reproductive|reprodut/i
];

const BONUS_PATTERNS = [
  /guide to colour mutations/i,
  /psittaculture/i,
  /passeriformes/i,
  /ringneck/i,
  /cockatiel/i
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.name.startsWith('~$')) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.pdf', '.docx', '.md', '.txt'].includes(ext)) continue;
    out.push(full);
  }
  return out;
}

function scoreFile(filePath) {
  const name = filePath.toLowerCase();
  let score = 0;
  for (const pattern of RELEVANCE_PATTERNS) {
    if (pattern.test(name)) score += 2;
  }
  for (const pattern of BONUS_PATTERNS) {
    if (pattern.test(name)) score += 3;
  }
  if (name.includes('traduzido')) score += 1;
  if (name.includes('vetbooks')) score += 1;
  if (FOCUS === 'psitacideos' && /psitac|parrot|papagaio|ringneck|cockatiel|calopsita/.test(name)) score += 5;
  if (FOCUS === 'passariformes' && /passariform|canari|canário/.test(name)) score += 5;
  return score;
}

function focusMatch(filePath) {
  const name = filePath.toLowerCase();
  if (FOCUS === 'psitacideos') {
    return /psitac|parrot|papagaio|ringneck|cockatiel|calopsita/.test(name);
  }
  if (FOCUS === 'passariformes') {
    return /passariform|canari|canário|avesdobrasil-vol2/.test(name);
  }
  return true;
}

function canonicalKey(filePath) {
  return path
    .basename(filePath)
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\([^)]+\)/g, '')
    .replace(/-\d+-\d+/g, '')
    .replace(/_+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function familyKey(filePath) {
  const rel = path.relative(ROOT_BOOKS, filePath);
  const parts = rel.split(path.sep);
  return (parts[0] || path.dirname(rel) || 'misc').toLowerCase();
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (ext === '.pdf') {
    const data = fs.readFileSync(filePath);
    const parser = new PDFParse({ data });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed?.text || '';
  }
  return '';
}

function topSentences(text) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
  if (!clean) return [];
  const sentences = clean
    .split(/(?<=[\.\!\?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 80 && s.length < 380);

  const keywords = [
    'gene', 'genetic', 'genética', 'allele', 'alelo', 'inherit', 'herança',
    'mutation', 'mutação', 'dominant', 'dominante', 'recessive', 'recessiva',
    'sex-linked', 'ligada ao sexo', 'psittac', 'parrot', 'passeriform', 'ringneck', 'cockatiel'
  ];

  const ranked = sentences.map((s) => {
    const low = s.toLowerCase();
    let score = 0;
    for (const k of keywords) if (low.includes(k)) score += 1;
    return { s, score };
  }).sort((a, b) => b.score - a.score || b.s.length - a.s.length);

  return ranked.filter((x) => x.score > 0).slice(0, 8).map((x) => x.s);
}

function detectScope(filePath, text) {
  const base = `${filePath} ${text.slice(0, 2000)}`.toLowerCase();
  const psit = /psitac|parrot|papagaio|ringneck|cockatiel|calopsita/.test(base);
  const pass = /passariform|canari|canário/.test(base);
  if (psit && pass) return 'Psitacídeos e Passariformes';
  if (psit) return 'Psitacídeos';
  if (pass) return 'Passariformes';
  return 'Aves (escopo geral)';
}

function buildResumo({ filePath, text }) {
  const title = path.basename(filePath, path.extname(filePath));
  const scope = detectScope(filePath, text);
  const key = topSentences(text);
  const textLen = text.length;
  const textPreview = text.slice(0, 1200).replace(/\s+/g, ' ').trim();

  const pontos = key.length
    ? key.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '1. Documento sem extração textual suficiente (arquivo escaneado ou conteúdo não textual).\n2. Recomendado OCR para extração integral.\n3. Manter como referência bibliográfica até OCR.';

  const resumo = [
    `Título-base: ${title}`,
    `Escopo taxonômico: ${scope}`,
    `Arquivo-fonte: ${filePath}`,
    `Tamanho textual extraído: ${textLen} caracteres`,
    '',
    'Resumo técnico:',
    textPreview || 'Sem preview textual disponível.',
    '',
    'Pontos aplicáveis à calculadora genética:',
    pontos,
    '',
    'Aplicações no motor da calculadora:',
    '- Validar regras de herança por espécie/locus.',
    '- Refinar mapa de mutações fenótipo->genótipo.',
    '- Alimentar módulo de explicabilidade (laudo técnico).',
    '- Criar testes de regressão para cruzamentos conhecidos.'
  ].join('\n');

  return { title, scope, resumo };
}

function makeFileUrl(winPath) {
  const p = winPath.replace(/\\/g, '/');
  return `file:///${p}`;
}

function sanitizeForJson(input) {
  return String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

async function main() {
  console.log('[INGEST] Varredura de livros iniciada...');
  const allFiles = walk(ROOT_BOOKS);
  const focusedFiles = allFiles.filter(focusMatch);
  const scored = focusedFiles
    .map((f) => ({ f, score: scoreFile(f) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.f.localeCompare(b.f));

  const dedup = [];
  const seen = new Set();
  for (const item of scored) {
    const key = canonicalKey(item.f);
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(item);
  }

  const selected = [];
  const familyCounter = new Map();
  for (const item of dedup) {
    if (selected.length >= MAX_ITEMS) break;
    const fam = familyKey(item.f);
    const used = familyCounter.get(fam) || 0;
    if (used >= MAX_PER_FAMILY) continue;
    selected.push(item.f);
    familyCounter.set(fam, used + 1);
  }

  if (selected.length < MAX_ITEMS) {
    for (const item of dedup) {
      if (selected.length >= MAX_ITEMS) break;
      if (selected.includes(item.f)) continue;
      selected.push(item.f);
    }
  }
  console.log(`[INGEST] Candidatos relevantes: ${scored.length} | selecionados: ${selected.length}`);

  const records = [];
  for (const filePath of selected) {
    try {
      const text = await extractText(filePath);
      const built = buildResumo({ filePath, text });
      records.push({
        titulo: sanitizeForJson(`Genética Aves | ${built.title}`),
        resumo: sanitizeForJson(built.resumo),
        url: sanitizeForJson(makeFileUrl(filePath)),
        fonte: sanitizeForJson('Biblioteca Interna (Livros)'),
        criado_em: new Date().toISOString()
      });
      console.log(`[INGEST] OK ${path.basename(filePath)}`);
    } catch (err) {
      console.warn(`[INGEST] FALHA ${filePath}: ${err.message}`);
    }
  }

  if (!records.length) {
    console.log('[INGEST] Nenhum resumo gerado.');
    return;
  }

  const { data: upserted, error: upsertError } = await supabase
    .from('knowledge_base')
    .upsert(records, { onConflict: 'url' })
    .select('id,titulo,url');

  if (upsertError) {
    throw new Error(`Erro no upsert Supabase: ${upsertError.message}`);
  }

  const now = new Date();
  const dateSlug = now.toISOString().split('T')[0];
  const obsidianName = `JARVIS_INGEST_GENETICA_${dateSlug}_${Math.floor(Math.random() * 9999)}.md`;
  const obsidianPath = path.join(OBSIDIAN_LOG_DIR, obsidianName);
  const md = [
    '---',
    'Agente: JARVIS_INGEST',
    `Data: ${now.toLocaleString('pt-BR')}`,
    '---',
    '',
    '# Ingestão Genética | Psitacídeos e Passariformes',
    '',
    `Total resumido: ${records.length}`,
    `Total enviado ao Supabase: ${upserted?.length || 0}`,
    '',
    '## Documentos Processados',
    ...records.map((r, i) => `${i + 1}. ${r.titulo}\n   - ${r.url}`),
    '',
    '## Resumos Detalhados',
    ...records.map((r, i) => `### ${i + 1}) ${r.titulo}\nFonte: ${r.url}\n\n${r.resumo}\n`),
    '',
    '## Observações',
    '- Lote inicial focado em material mais relevante por nome/escopo.',
    '- Próximo ciclo: OCR dos PDFs sem texto para ampliar cobertura.',
    '- Próximo ciclo: normalização por espécie, locus e evidência.'
  ].join('\n');

  fs.mkdirSync(OBSIDIAN_LOG_DIR, { recursive: true });
  fs.writeFileSync(obsidianPath, md, 'utf-8');

  console.log(`[INGEST] Supabase OK: ${upserted?.length || 0} itens`);
  console.log(`[INGEST] Obsidian OK: ${obsidianPath}`);
}

main().catch((err) => {
  console.error(`[INGEST] ERRO: ${err.message}`);
  process.exitCode = 1;
});
