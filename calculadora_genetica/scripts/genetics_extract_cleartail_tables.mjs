import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('E:\\conversas antigrativit\\backend\\node_modules\\pdf-parse');

const SOURCE_DIR = 'E:\\02_Cursos_e_Estudos\\livros\\planilhas de acasalameno ring';
const OUT_JSON = path.join(process.cwd(), 'cleartail_table_sources.json');
const OUT_MD = path.join(process.cwd(), 'genetics_cleartail_table_sources.md');
const FILE_NAME = 'planilha-CLEARTAIL_E_PORTADORES.pdf';

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
    const heading = blockLines
      .map(cleanLine)
      .filter(Boolean)
      .find((line) => !isHeaderLine(line) && line !== 'X') || '';
    return {
      page: pageIndex,
      block: idx + 1,
      heading,
      lines: blockLines,
      preview: blockLines.slice(0, 12).join('\n')
    };
  });
}

async function main() {
  const filePath = path.join(SOURCE_DIR, FILE_NAME);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo nao encontrado: ${filePath}`);
  }

  const text = await readPdf(filePath);
  const pages = text.split(/-- \d+ of \d+ --/g).slice(1);
  const blocks = pages.flatMap((page, idx) => extractBlocks(page, idx + 1));

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        mutationId: 'cleartail',
        label: 'Cleartail e Portadores',
        file: FILE_NAME,
        path: filePath,
        pageCount: pages.length,
        blockCount: blocks.length,
        blocks
      }
    ]
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf-8');
  fs.writeFileSync(
    OUT_MD,
    [
      '# Fontes Cleartail extraidas',
      '',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      `- Arquivo: ${FILE_NAME}`,
      `- Paginas: ${pages.length}`,
      `- Blocos estruturados: ${blocks.length}`,
      '',
      '### Primeiros blocos',
      ...blocks.slice(0, 10).map((block) => `- Pagina ${block.page} / Bloco ${block.block}: ${block.heading || 'Bloco sem titulo'}`)
    ].join('\n'),
    'utf-8'
  );

  console.log(`[CLEARTAIL] JSON salvo em ${OUT_JSON}`);
  console.log(`[CLEARTAIL] MD salvo em ${OUT_MD}`);
}

main().catch((err) => {
  console.error(`[CLEARTAIL] ERRO: ${err.message}`);
  process.exitCode = 1;
});
