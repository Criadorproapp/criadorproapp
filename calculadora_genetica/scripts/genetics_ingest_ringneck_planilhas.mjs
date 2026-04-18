import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SOURCE_DIR = 'E:\\02_Cursos_e_Estudos\\livros\\planilhas de acasalameno ring';
const OBSIDIAN_VAULT = 'E:\\conversas antigrativit';
const OBSIDIAN_LOG_DIR = path.join(OBSIDIAN_VAULT, '1. Agentes_Logs');

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

async function extractPdfText(filePath) {
  const data = fs.readFileSync(filePath);
  const parser = new PDFParse({ data });
  const parsed = await parser.getText();
  await parser.destroy();
  return parsed?.text || '';
}

function detectMutationFromName(name) {
  const n = name.toLowerCase();
  if (n.includes('opalino')) return 'Opalino (ligada ao sexo)';
  if (n.includes('pallid')) return 'Pallid (ligada ao sexo)';
  if (n.includes('arlequin-dominante')) return 'Arlequim Dominante';
  if (n.includes('arlequin-recessivo')) return 'Arlequim Recessivo';
  if (n.includes('cleartail')) return 'Cleartail';
  if (n.includes('violet')) return 'Violeta';
  return 'Ring Neck - mutacao nao classificada automaticamente';
}

function buildResumo(filePath, text) {
  const base = path.basename(filePath, path.extname(filePath));
  const mutation = detectMutationFromName(base);
  const preview = sanitizeForJson(text).replace(/\s+/g, ' ').trim().slice(0, 1300);

  return [
    `Fonte principal: Planilha de acasalamento Ring Neck`,
    `Mutacao alvo: ${mutation}`,
    `Arquivo: ${filePath}`,
    `Texto extraido: ${text.length} caracteres`,
    '',
    'Resumo tecnico:',
    preview || 'Documento com baixa extracao textual (provavel foco em tabela/imagem).',
    '',
    'Aplicacao direta na calculadora genetica:',
    '- Modelar grade de cruzamentos por combinacao parental.',
    '- Definir probabilidades fenotipicas e genotipicas por mutacao.',
    '- Marcar sex-linkage, dominante/recessivo e portadores.',
    '- Gerar explicacao do resultado no laudo tecnico.'
  ].join('\n');
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Pasta nao encontrada: ${SOURCE_DIR}`);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => path.join(SOURCE_DIR, f))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    throw new Error('Nenhum PDF encontrado na pasta de planilhas Ring Neck.');
  }

  const records = [];
  for (const filePath of files) {
    try {
      const text = await extractPdfText(filePath);
      records.push({
        titulo: sanitizeForJson(`Ring Neck | Planilha Acasalamento | ${path.basename(filePath, '.pdf')}`),
        resumo: buildResumo(filePath, text),
        url: sanitizeForJson(makeFileUrl(filePath)),
        fonte: 'Biblioteca Interna (Planilhas Ring Neck)',
        criado_em: new Date().toISOString()
      });
      console.log(`[RINGNECK] OK ${path.basename(filePath)}`);
    } catch (err) {
      console.warn(`[RINGNECK] FALHA ${path.basename(filePath)}: ${err.message}`);
    }
  }

  const { data: upserted, error } = await supabase
    .from('knowledge_base')
    .upsert(records, { onConflict: 'url' })
    .select('id,titulo,url');

  if (error) throw new Error(`Erro no upsert: ${error.message}`);

  const now = new Date();
  const mdName = `JARVIS_RINGNECK_PLANILHAS_${now.toISOString().slice(0, 10)}_${Math.floor(Math.random() * 9999)}.md`;
  const mdPath = path.join(OBSIDIAN_LOG_DIR, mdName);
  const md = [
    '---',
    'Agente: JARVIS_RINGNECK_INGEST',
    `Data: ${now.toLocaleString('pt-BR')}`,
    '---',
    '',
    '# Ingestao dedicada | Planilhas de Acasalamento Ring Neck',
    '',
    `Arquivos processados: ${files.length}`,
    `Registros enviados ao Supabase: ${upserted?.length || 0}`,
    '',
    '## Arquivos',
    ...files.map((f, i) => `${i + 1}. ${path.basename(f)}\n   - ${makeFileUrl(f)}`),
    '',
    '## Observacoes',
    '- Este pacote deve ser tratado como fonte de alta prioridade para regras de cruzamento.',
    '- Proximo passo: converter tabelas em estrutura de regras por mutacao e sexo.'
  ].join('\n');

  fs.mkdirSync(OBSIDIAN_LOG_DIR, { recursive: true });
  fs.writeFileSync(mdPath, md, 'utf-8');

  console.log(`[RINGNECK] Supabase OK: ${upserted?.length || 0}`);
  console.log(`[RINGNECK] Obsidian OK: ${mdPath}`);
}

main().catch((err) => {
  console.error(`[RINGNECK] ERRO: ${err.message}`);
  process.exitCode = 1;
});

