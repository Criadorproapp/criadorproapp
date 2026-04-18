import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SOURCE_DIR = 'E:\\02_Cursos_e_Estudos\\livros\\Um guia para mutações de cores e genética em papagaios';
const OBSIDIAN_VAULT = 'E:\\conversas antigrativit';
const OBSIDIAN_LOG_DIR = path.join(OBSIDIAN_VAULT, '1. Agentes_Logs');
const MAX_ITEMS = Number(process.env.GUIDE_MAX || 45);

const { PDFParse } = require('E:\\conversas antigrativit\\backend\\node_modules\\pdf-parse');
const dotenv = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\dotenv');
const { createClient } = require('E:\\conversas antigrativit\\criador_pro_social_agent\\node_modules\\@supabase\\supabase-js');

dotenv.config({ path: 'E:\\conversas antigrativit\\criador_pro_social_agent\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY nao encontrados no .env');
}
const supabase = createClient(supabaseUrl, supabaseKey);

function makeFileUrl(winPath) {
  return `file:///${winPath.replace(/\\/g, '/')}`;
}

function sanitizeForJson(input) {
  return String(input ?? '')
    .replace(/\u0000/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== '.pdf') continue;
    out.push(full);
  }
  return out;
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

function scoreFile(filePath) {
  const n = filePath.toLowerCase();
  let score = 0;
  if (n.includes('a_guide_to_colour_mutations')) score += 6;
  if (n.includes('genetics_in_parrots')) score += 6;
  if (n.includes('traduzido')) score += 2;
  if (n.includes('word')) score -= 1;
  if (n.includes('nova pasta')) score -= 1;
  if (n.match(/\[\d{2,3}-\d{2,3}\]/)) score -= 1;
  return score;
}

async function extractPdfText(filePath) {
  const data = fs.readFileSync(filePath);
  const parser = new PDFParse({ data });
  const parsed = await parser.getText();
  await parser.destroy();
  return parsed?.text || '';
}

function topLines(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 30 && l.length < 220);

  const keys = ['mutation', 'genetic', 'allele', 'dominant', 'recessive', 'sex-linked', 'parrot', 'psittac'];
  const ranked = lines
    .map((line) => {
      const low = line.toLowerCase();
      let score = 0;
      for (const k of keys) if (low.includes(k)) score += 1;
      return { line, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.line.length - a.line.length);

  return ranked.slice(0, 8).map((x) => x.line);
}

function buildResumo(filePath, text) {
  const base = path.basename(filePath, '.pdf');
  const picks = topLines(text);
  const preview = sanitizeForJson(text).replace(/\s+/g, ' ').trim().slice(0, 1200);

  const bullets = picks.length
    ? picks.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '1. Extracao textual parcial.\n2. Recomendado OCR complementar para paginas em imagem.\n3. Manter como fonte de referencia primaria de mutacoes.';

  return [
    'Fonte canônica: Um guia para mutações de cores e genética em papagaios',
    'Escopo: psitacídeos (múltiplas espécies) com foco em herança de mutações',
    `Arquivo: ${filePath}`,
    `Tamanho extraido: ${text.length} caracteres`,
    '',
    'Resumo técnico:',
    preview || 'Sem preview textual disponivel.',
    '',
    'Pontos críticos para o motor genético:',
    bullets,
    '',
    'Regras para a calculadora:',
    '- Priorizar este conteúdo como base de mutações e conceitos de herança.',
    '- Mapear locus, tipo de herança e status de portador por mutação.',
    '- Usar o texto para explicabilidade do resultado (laudo técnico).',
    '- Cruzar com as planilhas de acasalamento Ring Neck para validação empírica.'
  ].join('\n');
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) throw new Error(`Pasta nao encontrada: ${SOURCE_DIR}`);

  const allPdfs = walk(SOURCE_DIR);
  const scored = allPdfs
    .map((f) => ({ f, score: scoreFile(f) }))
    .sort((a, b) => b.score - a.score || a.f.localeCompare(b.f));

  const dedup = [];
  const seen = new Set();
  for (const item of scored) {
    const k = canonicalKey(item.f);
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(item.f);
  }

  const selected = dedup.slice(0, MAX_ITEMS);
  if (!selected.length) throw new Error('Nenhum PDF selecionado.');

  const records = [];
  for (const filePath of selected) {
    try {
      const text = await extractPdfText(filePath);
      records.push({
        titulo: sanitizeForJson(`Psitacideos | Guia Mutacoes Canonico | ${path.basename(filePath, '.pdf')}`),
        resumo: sanitizeForJson(buildResumo(filePath, text)),
        url: sanitizeForJson(makeFileUrl(filePath)),
        fonte: sanitizeForJson('Biblioteca Interna (Guia Mutacoes Psitacideos)'),
        criado_em: new Date().toISOString()
      });
      console.log(`[GUIA] OK ${path.basename(filePath)}`);
    } catch (err) {
      console.warn(`[GUIA] FALHA ${path.basename(filePath)}: ${err.message}`);
    }
  }

  const { data: upserted, error } = await supabase
    .from('knowledge_base')
    .upsert(records, { onConflict: 'url' })
    .select('id,titulo,url');

  if (error) throw new Error(`Erro no upsert: ${error.message}`);

  const now = new Date();
  const mdName = `JARVIS_GUIA_MUTACOES_PSITACIDEOS_${now.toISOString().slice(0, 10)}_${Math.floor(Math.random() * 9999)}.md`;
  const mdPath = path.join(OBSIDIAN_LOG_DIR, mdName);
  const md = [
    '---',
    'Agente: JARVIS_GUIA_MUTACOES_INGEST',
    `Data: ${now.toLocaleString('pt-BR')}`,
    '---',
    '',
    '# Ingestao Canônica | Guia de Mutações e Genética em Papagaios',
    '',
    `PDFs totais na pasta: ${allPdfs.length}`,
    `PDFs selecionados (deduplicados): ${selected.length}`,
    `Registros enviados ao Supabase: ${upserted?.length || 0}`,
    '',
    '## Arquivos Processados',
    ...selected.map((f, i) => `${i + 1}. ${path.basename(f)}\n   - ${makeFileUrl(f)}`),
    '',
    '## Diretriz de uso no produto',
    '- Esta coleção deve ter peso alto no motor de inferência genética.',
    '- Em conflitos de regra, priorizar evidências desta fonte + planilhas Ring Neck.',
    '- Próximo passo: extrair tabela de mutação -> herança -> provável fenótipo.'
  ].join('\n');

  fs.mkdirSync(OBSIDIAN_LOG_DIR, { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');

  console.log(`[GUIA] Supabase OK: ${upserted?.length || 0}`);
  console.log(`[GUIA] Obsidian OK: ${mdPath}`);
}

main().catch((err) => {
  console.error(`[GUIA] ERRO: ${err.message}`);
  process.exitCode = 1;
});

