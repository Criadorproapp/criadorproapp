import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('E:\\conversas antigrativit\\backend\\node_modules\\pdf-parse');

const SOURCE_DIR = 'E:\\02_Cursos_e_Estudos\\livros\\planilhas de acasalameno ring';
const OUT_JSON = path.join(process.cwd(), 'arlequim_table_sources.json');
const OUT_MD = path.join(process.cwd(), 'genetics_arlequim_table_sources.md');

const TABLE_FILES = [
  {
    file: 'planilha-ARLEQUIN-DOMINANTE.pdf',
    label: 'Arlequim Dominante',
    mutationId: 'arlequim_dominante'
  },
  {
    file: 'planilha-ARLEQUIN-RECESSIVO.pdf',
    label: 'Arlequim Recessivo',
    mutationId: 'arlequim_recessivo'
  }
];

function readPdf(filePath) {
  const data = fs.readFileSync(filePath);
  return new PDFParse({ data })
    .getText()
    .then((parsed) => parsed.text || '');
}

function cleanLine(line) {
  return String(line || '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeaderLine(line) {
  return /^\(?M\)?\s+/i.test(line) || /^\(?F\)?\s+/i.test(line);
}

function normalizeHeaderLines(lines) {
  return lines
    .map((line) => cleanLine(line))
    .filter(Boolean)
    .map((line) => line.replace(/^M\)\s*/i, '(M) ').replace(/^F\)\s*/i, '(F) '));
}

function blockToPairing(blockLines) {
  const lines = normalizeHeaderLines(blockLines);
  const male = lines.find((line) => line.startsWith('(M) ')) || '';
  const female = lines.find((line) => line.startsWith('(F) ')) || '';
  const body = lines.filter((line) => !line.startsWith('(M) ') && !line.startsWith('(F) ') && line !== 'X');
  const firstBody = body.find((line) => !/^Legenda:$/i.test(line) && !/^Dominantes$/i.test(line) && !/^Recessivo$/i.test(line)) || '';
  return {
    male: male.replace(/^\(M\)\s*/i, '').trim(),
    female: female.replace(/^\(F\)\s*/i, '').trim(),
    firstBody
  };
}

function parsePage(pageText, pageIndex) {
  const lines = pageText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Criatório Pingo D'Ouro/i.test(line))
    .filter((line) => !/^\(\d{2}\)\s*\d+/.test(line))
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));

  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (isHeaderLine(line) && current.length) {
      blocks.push(current);
      current = [line];
      continue;
    }
    current.push(line);
  }
  if (current.length) blocks.push(current);

  return blocks.map((blockLines, idx) => {
    const pairing = blockToPairing(blockLines);
    const readableTitle =
      pairing.male && pairing.female
        ? `${pairing.male} x ${pairing.female}`
        : pairing.male && pairing.firstBody
          ? `${pairing.male} → ${pairing.firstBody}`
          : pairing.female && pairing.firstBody
            ? `${pairing.female} → ${pairing.firstBody}`
            : pairing.male || pairing.female || pairing.firstBody || '';
    return {
      page: pageIndex,
      block: idx + 1,
      pairing,
      heading: readableTitle,
      lines: blockLines,
      preview: blockLines.slice(0, 16).join('\n')
    };
  });
}

async function main() {
  const sources = [];

  for (const entry of TABLE_FILES) {
    const filePath = path.join(SOURCE_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[ARLEQUIM] Arquivo nao encontrado: ${filePath}`);
      continue;
    }

    const text = await readPdf(filePath);
    const pages = text.split(/-- \d+ of \d+ --/g).slice(1);
    const blocks = [];
    for (let i = 0; i < pages.length; i += 1) {
      blocks.push(...parsePage(pages[i], i + 1));
    }

    sources.push({
      mutationId: entry.mutationId,
      label: entry.label,
      file: entry.file,
      path: filePath,
      pageCount: pages.length,
      blockCount: blocks.length,
      blocks
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), sources }, null, 2), 'utf-8');

  const md = [
    '# Fontes Arlequim extraidas',
    '',
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    ...sources.flatMap((source) => [
      `## ${source.label}`,
      `- Arquivo: ${source.file}`,
      `- Paginas: ${source.pageCount}`,
      `- Blocos extraidos: ${source.blockCount}`,
      '',
      '### Primeiros blocos',
      ...source.blocks.slice(0, 6).map((block) => `- Pagina ${block.page} / Bloco ${block.block}: ${block.heading}`),
      ''
    ])
  ].join('\n');

  fs.writeFileSync(OUT_MD, md, 'utf-8');
  console.log(`[ARLEQUIM] JSON salvo em ${OUT_JSON}`);
  console.log(`[ARLEQUIM] MD salvo em ${OUT_MD}`);
}

main().catch((err) => {
  console.error(`[ARLEQUIM] ERRO: ${err.message}`);
  process.exitCode = 1;
});
