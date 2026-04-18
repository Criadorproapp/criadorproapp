import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('E:\\conversas antigrativit\\backend\\node_modules\\pdf-parse');

const SOURCE_DIR = 'E:\\02_Cursos_e_Estudos\\livros\\planilhas de acasalameno ring';
const OUT_JSON = path.join(process.cwd(), 'sexlinked_table_sources.json');
const OUT_MD = path.join(process.cwd(), 'genetics_sexlinked_table_sources.md');

const TABLE_FILES = [
  { file: 'planilha-OPALINO_E_PORTADORES.pdf', label: 'Opalino e Portadores', mutationId: 'opalino' },
  { file: 'planilha-pallids.pdf', label: 'Pallid e Portadores', mutationId: 'pallid' },
  { file: 'planilha-violetas.pdf', label: 'Violeta', mutationId: 'violeta' }
];

function readPdf(filePath) {
  const data = fs.readFileSync(filePath);
  return new PDFParse({ data }).getText().then((parsed) => parsed.text || '');
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

function isSexLine(line) {
  return /^\((M|F)\)\s+/i.test(line);
}

function isIgnoredLine(line) {
  return /^X$/i.test(line) || /^(Legenda:|Conforme a Lei 9\.610\/98)/i.test(line);
}

function formatSexLine(line) {
  const marker = line.match(/^\((M|F)\)\s*/i)?.[1]?.toUpperCase() || '';
  const text = cleanLine(line.replace(/^\((M|F)\)\s*/i, ''));
  if (!marker) return text;
  if (/^(macho|f[êe]mea)$/i.test(text)) {
    return marker === 'M' ? 'Macho' : 'Fêmea';
  }
  return `${marker === 'M' ? 'Macho' : 'Fêmea'}: ${text}`.replace(/:\s*$/, '');
}

function deriveBlockHeading(blockLines) {
  const cleaned = blockLines.map(cleanLine).filter(Boolean);
  const sexLines = cleaned.filter(isSexLine);
  if (sexLines.length >= 2) {
    return `${formatSexLine(sexLines[0])} x ${formatSexLine(sexLines[1])}`;
  }
  if (sexLines.length === 1) {
    return formatSexLine(sexLines[0]);
  }

  const content = cleaned.filter((line) => !isIgnoredLine(line) && !isSexLine(line) && !/^CriatÃƒÂ³rio/i.test(line));
  if (!content.length) return '';
  if (content.length === 1) return content[0];
  if (content[0].startsWith('CriatÃ³rio') && /:/.test(content[1] || '')) {
    return content[0];
  }

  const first = content[0];
  const second = content.find((line) => line !== first) || '';
  if (second) return `${first} x ${second}`;
  return first;
}

function extractBlocks(pageText, pageIndex) {
  const lines = pageText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^CriatÃ³rio Pingo D'Ouro/i.test(line))
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
    const head = deriveBlockHeading(blockLines);
    return {
      page: pageIndex,
      block: idx + 1,
      heading: head,
      lines: blockLines,
      preview: blockLines.slice(0, 12).join('\n')
    };
  });
}

async function main() {
  const sources = [];

  for (const entry of TABLE_FILES) {
    const filePath = path.join(SOURCE_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SEXLINKED] Arquivo nao encontrado: ${filePath}`);
      continue;
    }

    const text = await readPdf(filePath);
    const pages = text.split(/-- \d+ of \d+ --/g).slice(1);
    const blocks = pages.flatMap((page, idx) => extractBlocks(page, idx + 1));

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
  fs.writeFileSync(
    OUT_MD,
    [
      '# Fontes Sex-linked extraidas',
      '',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      ...sources.flatMap((source) => [
        `## ${source.label}`,
        `- Arquivo: ${source.file}`,
        `- Paginas: ${source.pageCount}`,
        `- Blocos estruturados: ${source.blockCount}`,
        '',
        '### Primeiros blocos',
        ...source.blocks.slice(0, 8).map((block) => `- Pagina ${block.page} / Bloco ${block.block}: ${block.heading || 'Bloco sem titulo'}`),
        ''
      ])
    ].join('\n'),
    'utf-8'
  );

  console.log(`[SEXLINKED] JSON salvo em ${OUT_JSON}`);
  console.log(`[SEXLINKED] MD salvo em ${OUT_MD}`);
}

main().catch((err) => {
  console.error(`[SEXLINKED] ERRO: ${err.message}`);
  process.exitCode = 1;
});
