import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dna, Beaker, CheckCircle2, FileText, Download, BookOpen, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getRules,
  getParentOptions,
  calculateMultiLocus,
  formatProbabilityRows,
  getRingneckOfficialPhenotypesByGroup,
  getRingneckBaseMatrix,
  getRingneckVerificationSuite,
  getArlequimTableSources,
  getCleartailTableSources,
  getSexlinkedTableSources,
  getReferenceBibliographySources,
  getSpeciesRoadmap,
  RINGNECK_CLEARTAIL_PRESETS,
  BLUE_SERIES_PRESETS,
  calculateRingneckCleartailAdvanced,
  calculateBlueSeriesAdvanced
} from './geneticsEngine';

const RULES = getRules();

function initialState() {
  const out = {};
  for (const r of RULES) {
    const opts = getParentOptions(r);
    out[r.id] = {
      enabled: false,
      male: opts.male[0].value,
      female: opts.female[0].value
    };
  }
  return out;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
        active
          ? 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan'
          : 'bg-white/5 border-white/10 text-brand-text-muted hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ResultTable({ title, rows }) {
  return (
    <div className="bg-[#0D1F2D] border border-white/10 rounded-xl p-4">
      <h4 className="text-sm font-black text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={`${title}-${idx}`} className="flex items-center justify-between text-xs">
            <span className="text-gray-300">{row.label}</span>
            <span className="font-bold text-brand-cyan">{row.percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryTable({ title, rows }) {
  return (
    <div className="bg-[#0D1F2D] border border-white/10 rounded-xl p-4">
      <h4 className="text-sm font-black text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={`${title}-summary-${idx}`} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-200">{row.phenotype}</span>
            <span className="font-bold text-brand-cyan whitespace-nowrap">{row.percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanilhaResultTable({ title, rows }) {
  return (
    <div className="bg-[#0D1F2D] border border-white/10 rounded-xl p-4">
      <h4 className="text-sm font-black text-white mb-3">{title}</h4>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={`${title}-planilha-${idx}`} className="rounded-lg border border-white/10 bg-black/10 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white font-semibold">{row.phenotype}</span>
              <span className="font-black text-brand-cyan whitespace-nowrap">{row.percent}</span>
            </div>
            {!!row.formula && (
              <div className="mt-2 text-[11px] text-brand-text-muted">
                {row.formula}
              </div>
            )}
            {!!row.formulas?.length && (
              <div className="mt-2 text-[11px] text-brand-text-muted">
                {row.formulas.join(' | ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationCard({ title, expected, result, status = 'ajustar' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-white">{title}</p>
          <span
            className={`text-[11px] font-black px-2 py-1 rounded-full ${
              status === 'ok'
                ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
            }`}
          >
            {status === 'ok' ? 'OK' : 'AJUSTAR'}
          </span>
        </div>
        <p className="text-[11px] text-brand-text-muted">Esperado: {expected}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-brand-text-muted mb-1">Machos</p>
          <p className="text-sm font-bold text-white">{result?.maleHeadline || 'Sem resultado'}</p>
          {!!result?.maleRows?.length && (
            <div className="mt-2 space-y-1">
              {result.maleRows.map((row, idx) => (
                <div key={`${title}-male-${idx}`} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">{row.phenotype}</span>
                  <span className="font-bold text-brand-cyan">{row.percent}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-brand-text-muted mb-1">FÃªmeas</p>
          <p className="text-sm font-bold text-white">{result?.femaleHeadline || 'Sem resultado'}</p>
          {!!result?.femaleRows?.length && (
            <div className="mt-2 space-y-1">
              {result.femaleRows.map((row, idx) => (
                <div key={`${title}-female-${idx}`} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">{row.phenotype}</span>
                  <span className="font-bold text-brand-cyan">{row.percent}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ title, report, onDownloadMd, onOpenHtml, onCopy, onExplain }) {
  if (!report) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0D1F2D] p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-black text-white">{title}</p>
          <p className="text-[11px] text-brand-text-muted mt-1">{report.subtitle}</p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full border border-brand-cyan/30 text-brand-cyan font-bold">
          RelatÃ³rio pronto
        </span>
      </div>

      <p className="text-sm text-gray-200 leading-relaxed mb-4">{report.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-brand-text-muted mb-1">Machos</p>
          <p className="text-sm font-bold text-white">{topPhenotypes(report.maleRows, 2) || 'Sem resultado'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-brand-text-muted mb-1">FÃªmeas</p>
          <p className="text-sm font-bold text-white">{topPhenotypes(report.femaleRows, 2) || 'Sem resultado'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onDownloadMd}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-cyan text-black font-bold text-xs hover:brightness-110 transition-all"
        >
          <Download size={14} />
          Baixar .md
        </button>
        <button
          onClick={onOpenHtml}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-green/20 border border-brand-green/30 text-brand-green font-bold text-xs hover:bg-brand-green/30 transition-all"
        >
          <BookOpen size={14} />
          Abrir ebook
        </button>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs hover:border-white/20 transition-all"
        >
          <Copy size={14} />
          Copiar resumo
        {onExplain && (
          <button
            onClick={onExplain}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-200 font-bold text-xs hover:bg-amber-400/25 transition-all"
          >
            <FileText size={14} />
            Explicar no Jarvis
          </button>
        )}
        </button>
      </div>
    </div>
  );
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlRows(rows) {
  return rows
    .map(
      (r) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#0f172a;">${esc(r.label)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0ea5e9;">${esc(r.percent)}</td>
        </tr>
      `
    )
    .join('');
}

function topPhenotypes(rows, limit = 3) {
  return (rows || [])
    .slice(0, limit)
    .map((row) => `${row.phenotype} ${row.percent}`)
    .join(' | ');
}

function rowsToMarkdown(rows) {
  if (!rows?.length) return '- Sem resultado';
  return rows
    .map((row) => `- ${row.phenotype}: ${row.percent}${row.formula ? ` (${row.formula})` : ''}`)
    .join('\n');
}

function buildBreederNarrative({ title, parents, maleRows, femaleRows, notes, verdict }) {
  const maleTop = topPhenotypes(maleRows, 2) || 'Sem resultado';
  const femaleTop = topPhenotypes(femaleRows, 2) || 'Sem resultado';
  return [
    `Cruzamento analisado: ${title}.`,
    parents?.male ? `Pai: ${parents.male}` : null,
    parents?.female ? `MÃ£e: ${parents.female}` : null,
    `Resumo dos machos: ${maleTop}.`,
    `Resumo das fÃªmeas: ${femaleTop}.`,
    verdict ? `Leitura tÃ©cnica: ${verdict}.` : null,
    notes ? `ObservaÃ§Ã£o do motor: ${notes}.` : null
  ]
    .filter(Boolean)
    .join(' ');
}

function groupBibliographyByCategory(sources) {
  const groups = new Map();
  for (const source of sources || []) {
    const category = source.category || 'Referência';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(source);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
}

function buildBibliographyMarkdown(sources) {
  if (!sources?.length) return '- Biblioteca de referência indisponível';
  return groupBibliographyByCategory(sources)
    .map((group) => {
      const items = group.items
        .map(
          (source) =>
            `- ${source.label}: ${source.pageCount} páginas, ${source.blockCount} blocos estruturados, arquivo ${source.file}`
        )
        .join('\n');
      return `### ${group.category}\n${items}`;
    })
    .join('\n\n');
}

function buildBibliographyHtml(sources) {
  if (!sources?.length) {
    return '<li>Biblioteca de referência indisponível</li>';
  }
  return groupBibliographyByCategory(sources)
    .map(
      (group) => `
        <li style="margin-bottom:10px;">
          <strong>${esc(group.category)}</strong>
          <ul style="margin:6px 0 0;padding-left:18px;">
            ${group.items
              .map(
                (source) =>
                  `<li style="margin-bottom:6px;">${esc(source.label)}: ${esc(source.pageCount)} páginas, ${esc(
                    source.blockCount
                  )} blocos estruturados, arquivo ${esc(source.file)}</li>`
              )
              .join('')}
          </ul>
        </li>
      `
    )
    .join('');
}

function buildCrossReportMarkdown({
  title,
  subtitle,
  parents,
  maleRows,
  femaleRows,
  notes,
  verdict,
  technicalRows,
  bibliography = [],
  generatedAt = new Date().toLocaleString('pt-BR')
}) {
  const narrative = buildBreederNarrative({ title, parents, maleRows, femaleRows, notes, verdict });
  const technicalBlock = technicalRows?.length
    ? technicalRows
        .map((item) => `- ${item.mutation}: macho ${item.male} | fÃªmea ${item.female} | heranÃ§a ${item.inheritance}`)
        .join('\n')
    : '- Sem mutaÃ§Ãµes ativas';

  return `# ${title}

${subtitle ? `${subtitle}\n` : ''}
Gerado em: ${generatedAt}

## Pais
- Macho: ${parents?.male || 'NÃ£o informado'}
- FÃªmea: ${parents?.female || 'NÃ£o informado'}

## Leitura para o criador
${narrative}

## Filhotes Macho
${rowsToMarkdown(maleRows)}

## Filhotes FÃªmea
${rowsToMarkdown(femaleRows)}

## Regras aplicadas
${technicalBlock}

## Bibliografia de Referência
${buildBibliographyMarkdown(bibliography)}

## Notas
${notes || 'Sem notas adicionais.'}
`;
}

function buildCrossReportHtml({
  title,
  subtitle,
  parents,
  maleRows,
  femaleRows,
  notes,
  verdict,
  technicalRows,
  bibliography = [],
  generatedAt = new Date().toLocaleString('pt-BR')
}) {
  const narrative = buildBreederNarrative({ title, parents, maleRows, femaleRows, notes, verdict });
  const technicalBlock = technicalRows?.length
    ? technicalRows
        .map(
          (item) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(item.mutation)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(item.male)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(item.female)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(item.inheritance)}</td>
            </tr>
          `
        )
        .join('')
    : `<tr><td colspan="4" style="padding:8px;border-bottom:1px solid #e5e7eb;">Sem mutaÃ§Ãµes ativas</td></tr>`;
  const bibliographyBlock = buildBibliographyHtml(bibliography);

  return `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>${esc(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 24px; }
      h1, h2, h3, p { margin-top: 0; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; background: #f8fafc; }
      td, th { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      .meta { color: #475569; font-size: 12px; }
      .muted { color: #64748b; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .pill { display: inline-block; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; margin: 4px 6px 0 0; font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="card" style="border-left:4px solid #0ea5e9;">
      <h1 style="margin-bottom:6px;">${esc(title)}</h1>
      ${subtitle ? `<p class="meta">${esc(subtitle)}</p>` : ''}
      <p class="meta">Gerado em ${esc(generatedAt)}</p>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Pais</h2>
      <p><strong>Macho:</strong> ${esc(parents?.male || 'NÃ£o informado')}</p>
      <p><strong>FÃªmea:</strong> ${esc(parents?.female || 'NÃ£o informado')}</p>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Leitura para o criador</h2>
      <p style="line-height:1.6;">${esc(narrative)}</p>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Resultado dos machos</h2>
      <table><tbody>${htmlRows(maleRows)}</tbody></table>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Resultado das fÃªmeas</h2>
      <table><tbody>${htmlRows(femaleRows)}</tbody></table>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Regras aplicadas</h2>
      <table>
        <thead>
          <tr><th>MutaÃ§Äo</th><th>Macho</th><th>FÃªmea</th><th>HeranÃ§a</th></tr>
        </thead>
        <tbody>${technicalBlock}</tbody>
      </table>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Notas</h2>
      <p class="muted">${esc(notes || 'Sem notas adicionais.')}</p>
    </div>

    <div class="card">
      <h2 style="font-size:16px;margin-bottom:8px;">Bibliografia de Referência</h2>
      <ul style="margin:0;padding-left:18px;">${bibliographyBlock}</ul>
    </div>
  </body>
</html>`;
}

function downloadTextFile(filename, content, mimeType = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openHtmlPreview(html) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  el.remove();
  return Promise.resolve();
}

function buildLaudoHtml({ meta, selections, result, maleCombined, femaleCombined, bibliography = [] }) {
  const now = new Date().toLocaleString('pt-BR');
  const activeRules = RULES.filter((r) => selections[r.id]?.enabled);
  const rulesTable = activeRules
    .map((r) => {
      const sel = selections[r.id];
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(r.mutation)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(sel.male)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(sel.female)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(r.inheritance)}</td>
        </tr>
      `;
    })
    .join('');

  const perMutation = result.byMutation
    .map(
      (m) => `
        <div style="margin-bottom:14px;padding:10px;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="font-weight:700;color:#0f172a;">${esc(m.mutation)}</div>
          <div style="font-size:12px;color:#475569;margin:4px 0 8px;">HeranÃ§a: ${esc(m.inheritance)} | ConfianÃ§a: ${esc(m.confidence)}</div>
          <div style="font-size:12px;color:#334155;line-height:1.4;">${esc(m.notes)}</div>
        </div>
      `
    )
    .join('');

  return `
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>Laudo GenÃ©tico - ${esc(meta.animalNome || 'Animal')}</title>
  </head>
  <body style="font-family: Arial, sans-serif;background:#fff;color:#0f172a;margin:0;padding:24px;">
    <header style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0ea5e9;padding-bottom:12px;margin-bottom:18px;">
      <div>
        <h1 style="margin:0;font-size:24px;">Laudo GenÃ©tico de Acasalamento</h1>
        <div style="font-size:12px;color:#475569;margin-top:6px;">Gerado em ${esc(now)}</div>
      </div>
      ${
        meta.logoUrl
          ? `<img src="${esc(meta.logoUrl)}" alt="Logo criatÃ³rio" style="max-width:140px;max-height:70px;object-fit:contain;" />`
          : ''
      }
    </header>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">Dados do CriatÃ³rio</h2>
      <div style="font-size:13px;line-height:1.6;">
        <div><strong>CriatÃ³rio:</strong> ${esc(meta.criatorio || '-')}</div>
        <div><strong>ResponsÃ¡vel:</strong> ${esc(meta.responsavel || '-')}</div>
        <div><strong>Contato:</strong> ${esc(meta.contato || '-')}</div>
        <div><strong>Cliente:</strong> ${esc(meta.cliente || '-')}</div>
      </div>
    </section>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">Dados do Animal / Projeto</h2>
      <div style="font-size:13px;line-height:1.6;">
        <div><strong>EspÃ©cie:</strong> ${esc(meta.especie || 'PsitacÃ­deo')}</div>
        <div><strong>IdentificaÃ§Ã£o:</strong> ${esc(meta.animalId || '-')}</div>
        <div><strong>Nome:</strong> ${esc(meta.animalNome || '-')}</div>
        <div><strong>ObservaÃ§Ãµes:</strong> ${esc(meta.observacoes || '-')}</div>
      </div>
    </section>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">ConfiguraÃ§Ã£o das MutaÃ§Ãµes</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="text-align:left;padding:8px;">MutaÃ§Ã£o</th>
            <th style="text-align:left;padding:8px;">Macho</th>
            <th style="text-align:left;padding:8px;">FÃªmea</th>
            <th style="text-align:left;padding:8px;">HeranÃ§a</th>
          </tr>
        </thead>
        <tbody>${rulesTable}</tbody>
      </table>
    </section>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">Resultado Combinado (Motor Multi-locus v1)</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <h3 style="font-size:13px;margin:0 0 6px;">Filhotes Macho (ZZ)</h3>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tbody>${htmlRows(maleCombined)}</tbody>
          </table>
        </div>
        <div>
          <h3 style="font-size:13px;margin:0 0 6px;">Filhotes FÃªmea (ZW)</h3>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <tbody>${htmlRows(femaleCombined)}</tbody>
          </table>
        </div>
      </div>
    </section>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">ExplicaÃ§Ã£o TÃ©cnica</h2>
      ${perMutation}
    </section>

    <section style="margin-bottom:18px;">
      <h2 style="font-size:15px;margin:0 0 8px;color:#0f172a;">Bibliografia de ReferÃªncia</h2>
      <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.5;">
        ${buildArlequimBibliographyHtml(bibliography)}
      </ul>
    </section>

    <footer style="margin-top:22px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#64748b;">
      Fontes principais: Guia CanÃ´nico de MutaÃ§Ãµes em PsitacÃ­deos + Planilhas de Acasalamento Ring Neck.
    </footer>
  </body>
</html>`;
}

export default function GeneticsCalculator() {
  const [selections, setSelections] = useState(initialState);
  const [species, setSpecies] = useState('ringneck');
  const [blueMalePreset, setBlueMalePreset] = useState('green');
  const [blueFemalePreset, setBlueFemalePreset] = useState('green');
  const [blueResult, setBlueResult] = useState(() => calculateBlueSeriesAdvanced('green', 'green'));
  const [ringneckMalePreset, setRingneckMalePreset] = useState('cleartail_green');
  const [ringneckFemalePreset, setRingneckFemalePreset] = useState('cleartail_green');
  const [ringneckResult, setRingneckResult] = useState(() =>
    calculateRingneckCleartailAdvanced('cleartail_green', 'cleartail_green')
  );
  const [meta, setMeta] = useState({
    criatorio: '',
    responsavel: '',
    contato: '',
    cliente: '',
    especie: 'PsitacÃ­deo',
    animalId: '',
    animalNome: '',
    observacoes: '',
    logoUrl: ''
  });
  const [crossHistory, setCrossHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('genetics_cross_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [geneticsPanel, setGeneticsPanel] = useState('processo');

  const result = useMemo(() => calculateMultiLocus(selections), [selections]);
  const maleCombined = useMemo(() => formatProbabilityRows(result.combined.male), [result]);
  const femaleCombined = useMemo(() => formatProbabilityRows(result.combined.female), [result]);
  const maleSummary = useMemo(() => formatProbabilityRows(result.summary.male), [result]);
  const femaleSummary = useMemo(() => formatProbabilityRows(result.summary.female), [result]);
  const ringneckOfficialGroups = useMemo(() => getRingneckOfficialPhenotypesByGroup(), []);
  const ringneckBaseMatrix = useMemo(() => getRingneckBaseMatrix(), []);
  const ringneckVerificationSuite = useMemo(() => getRingneckVerificationSuite(), []);
  const arlequimTableSources = useMemo(() => getArlequimTableSources(), []);
  const cleartailTableSources = useMemo(() => getCleartailTableSources(), []);
  const sexlinkedTableSources = useMemo(() => getSexlinkedTableSources(), []);
  const referenceBibliography = useMemo(() => getReferenceBibliographySources(), []);
  const speciesRoadmap = useMemo(() => getSpeciesRoadmap(), []);
  const jumpToSection = (id) => {
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const panelPillClass = (panel) =>
    `px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
      geneticsPanel === panel
        ? 'bg-brand-cyan text-black border-brand-cyan shadow-lg shadow-brand-cyan/10'
        : 'bg-white/5 text-white border-white/10 hover:border-brand-cyan/40 hover:text-brand-cyan'
    }`;
  useEffect(() => {
    try {
      localStorage.setItem('genetics_cross_history', JSON.stringify(crossHistory.slice(0, 12)));
    } catch {
      // ignore storage errors
    }
  }, [crossHistory]);
  useEffect(() => {
    let cancelled = false;
    async function loadHistoryFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('knowledge_base')
          .select('titulo,resumo,url,fonte,criado_em')
          .eq('fonte', 'Histórico Genético')
          .order('criado_em', { ascending: false })
          .limit(12);

        if (error || cancelled || !data?.length) return;

        const parsed = data.map((item) => {
          let payload = {};
          try {
            payload = JSON.parse(item.resumo || '{}');
          } catch {
            payload = { summary: item.resumo || '' };
          }
          return {
            id: item.url || `${item.titulo}-${item.criado_em}`,
            createdAt: item.criado_em || new Date().toISOString(),
            type: payload.type || 'history',
            title: payload.title || item.titulo || 'Cruzamento',
            summary: payload.summary || item.titulo || '',
            markdown: payload.markdown || item.resumo || '',
            html: payload.html || '',
            savedOnServer: true
          };
        });

        setCrossHistory((prev) => {
          const merged = [...parsed, ...prev];
          const seen = new Set();
          return merged.filter((entry) => {
            const key = `${entry.title}|${entry.createdAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 12);
        });
      } catch {
        // ignore loading errors
      }
    }

    loadHistoryFromSupabase();
    return () => {
      cancelled = true;
    };
  }, []);
  const activeRules = useMemo(() => RULES.filter((r) => selections[r.id]?.enabled), [selections]);

  const mainCrossReport = useMemo(() => {
    const parents = activeRules.map((r) => ({
      mutation: r.mutation,
      male: selections[r.id]?.male,
      female: selections[r.id]?.female,
      inheritance: r.inheritance
    }));
    const parentText = parents.length
      ? parents
          .map((item) => `${item.mutation}: macho ${item.male || '-'} | fÃªmea ${item.female || '-'}`)
          .join(' ; ')
      : 'Nenhuma mutaÃ§Ã£o ativa';
    return {
      title: 'RelatÃ³rio do Cruzamento Multi-Locus',
      subtitle: 'Resumo automÃ¡tico com leitura tÃ©cnica em portuguÃªs',
      parents: { male: parentText, female: parentText },
      maleRows: maleCombined,
      femaleRows: femaleCombined,
      summary: buildBreederNarrative({
        title: 'cruzamento multi-locus',
        parents: { male: parentText, female: parentText },
        maleRows: maleCombined,
        femaleRows: femaleCombined,
        notes: result.byMutation.length
          ? `Motor com ${result.byMutation.length} mutaÃ§Ã£o(Ãµes) ativa(s)`
          : 'Motor sem mutaÃ§Ãµes ativas',
        verdict: 'resultado calculado pelo motor mendeliano da calculadora',
        bibliography: referenceBibliography
      }),
      notes: result.byMutation.length
        ? `Motor com ${result.byMutation.length} mutaÃ§Ã£o(Ãµes) ativa(s).`
        : 'Motor sem mutaÃ§Ãµes ativas.',
      technicalRows: result.byMutation.map((m) => ({
        mutation: m.mutation,
        male: topPhenotypes(m.male, 1) || 'Sem resultado',
        female: topPhenotypes(m.female, 1) || 'Sem resultado',
        inheritance: m.inheritance
      })),
      markdown: buildCrossReportMarkdown({
        title: 'RelatÃ³rio do Cruzamento Multi-Locus',
        subtitle: 'Resumo automÃ¡tico com leitura tÃ©cnica em portuguÃªs',
        parents: { male: parentText, female: parentText },
        maleRows: maleCombined,
        femaleRows: femaleCombined,
        notes: result.byMutation.length
          ? `Motor com ${result.byMutation.length} mutaÃ§Ã£o(Ãµes) ativa(s).`
          : 'Motor sem mutaÃ§Ãµes ativas.',
        verdict: 'resultado calculado pelo motor mendeliano da calculadora',
        bibliography: referenceBibliography,
        technicalRows: result.byMutation.map((m) => ({
          mutation: m.mutation,
          male: topPhenotypes(m.male, 1) || 'Sem resultado',
          female: topPhenotypes(m.female, 1) || 'Sem resultado',
          inheritance: m.inheritance
        }))
      }),
      html: buildCrossReportHtml({
        title: 'RelatÃ³rio do Cruzamento Multi-Locus',
        subtitle: 'Resumo automÃ¡tico com leitura tÃ©cnica em portuguÃªs',
        parents: { male: parentText, female: parentText },
        maleRows: maleCombined,
        femaleRows: femaleCombined,
        notes: result.byMutation.length
          ? `Motor com ${result.byMutation.length} mutaÃ§Ã£o(Ãµes) ativa(s).`
          : 'Motor sem mutaÃ§Ãµes ativas.',
        verdict: 'resultado calculado pelo motor mendeliano da calculadora',
        bibliography: referenceBibliography,
        technicalRows: result.byMutation.map((m) => ({
          mutation: m.mutation,
          male: topPhenotypes(m.male, 1) || 'Sem resultado',
          female: topPhenotypes(m.female, 1) || 'Sem resultado',
          inheritance: m.inheritance
        }))
      }),
      filename: `relatorio-cruzamento-mendeliano-${new Date().toISOString().slice(0, 10)}.md`
    };
  }, [activeRules, selections, maleCombined, femaleCombined, result]);

  const blueSeriesReport = useMemo(() => ({
    title: 'RelatÃ³rio SÃ©rie Azul Psitacideos',
    subtitle: `${blueResult.father.name} x ${blueResult.mother.name}`,
    parents: {
      male: `${blueResult.father.name} (${blueResult.father.formula})`,
      female: `${blueResult.mother.name} (${blueResult.mother.formula})`
    },
    maleRows: blueResult.male,
    femaleRows: blueResult.female,
    summary: buildBreederNarrative({
      title: 'sÃ©rie azul',
      parents: {
        male: `${blueResult.father.name} (${blueResult.father.formula})`,
        female: `${blueResult.mother.name} (${blueResult.mother.formula})`
      },
      maleRows: blueResult.male,
      femaleRows: blueResult.female,
      notes: blueResult.notes,
      verdict: 'resultado igual para macho e fÃªmea porque o bloco usa locus autossÃ´mico'
    }),
    notes: blueResult.notes,
    technicalRows: [
      { mutation: 'blue_series', male: blueResult.father.formula, female: blueResult.mother.formula, inheritance: 'autosomal_multiallelic' }
    ],
    markdown: buildCrossReportMarkdown({
      title: 'RelatÃ³rio SÃ©rie Azul Psitacideos',
      subtitle: `${blueResult.father.name} x ${blueResult.mother.name}`,
      parents: {
        male: `${blueResult.father.name} (${blueResult.father.formula})`,
        female: `${blueResult.mother.name} (${blueResult.mother.formula})`
      },
      maleRows: blueResult.male,
      femaleRows: blueResult.female,
      notes: blueResult.notes,
      verdict: 'resultado igual para macho e fÃªmea porque o bloco usa locus autossÃ´mico',
      technicalRows: [
        { mutation: 'blue_series', male: blueResult.father.formula, female: blueResult.mother.formula, inheritance: 'autosomal_multiallelic' }
      ]
    }),
    html: buildCrossReportHtml({
      title: 'RelatÃ³rio SÃ©rie Azul Psitacideos',
      subtitle: `${blueResult.father.name} x ${blueResult.mother.name}`,
      parents: {
        male: `${blueResult.father.name} (${blueResult.father.formula})`,
        female: `${blueResult.mother.name} (${blueResult.mother.formula})`
      },
      maleRows: blueResult.male,
      femaleRows: blueResult.female,
      notes: blueResult.notes,
      verdict: 'resultado igual para macho e fÃªmea porque o bloco usa locus autossÃ´mico',
      technicalRows: [
        { mutation: 'blue_series', male: blueResult.father.formula, female: blueResult.mother.formula, inheritance: 'autosomal_multiallelic' }
      ]
    }),
    filename: `relatorio-serie-azul-${new Date().toISOString().slice(0, 10)}.md`
  }), [blueResult]);

  const ringneckCrossReport = useMemo(() => ({
    title: 'RelatÃ³rio Ringneck Cleartail',
    subtitle: `${ringneckResult.father.name} x ${ringneckResult.mother.name}`,
    parents: {
      male: `${ringneckResult.father.name} (${ringneckResult.father.formula})`,
      female: `${ringneckResult.mother.name} (${ringneckResult.mother.formula})`
    },
    maleRows: ringneckResult.male,
    femaleRows: ringneckResult.female,
    summary: buildBreederNarrative({
      title: 'Ringneck Cleartail',
      parents: {
        male: `${ringneckResult.father.name} (${ringneckResult.father.formula})`,
        female: `${ringneckResult.mother.name} (${ringneckResult.mother.formula})`
      },
      maleRows: ringneckResult.male,
      femaleRows: ringneckResult.female,
      notes: ringneckResult.notes,
      verdict: 'resultado calculado pelo motor Bird + Mutation + Engine'
    }),
    notes: ringneckResult.notes,
    technicalRows: [
      { mutation: 'blue', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal' },
      { mutation: 'cleartail', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal_recessive' }
    ],
    markdown: buildCrossReportMarkdown({
      title: 'RelatÃ³rio Ringneck Cleartail',
      subtitle: `${ringneckResult.father.name} x ${ringneckResult.mother.name}`,
      parents: {
        male: `${ringneckResult.father.name} (${ringneckResult.father.formula})`,
        female: `${ringneckResult.mother.name} (${ringneckResult.mother.formula})`
      },
      maleRows: ringneckResult.male,
      femaleRows: ringneckResult.female,
      notes: ringneckResult.notes,
      verdict: 'resultado calculado pelo motor Bird + Mutation + Engine',
      technicalRows: [
        { mutation: 'blue', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal' },
        { mutation: 'cleartail', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal_recessive' }
      ]
    }),
    html: buildCrossReportHtml({
      title: 'RelatÃ³rio Ringneck Cleartail',
      subtitle: `${ringneckResult.father.name} x ${ringneckResult.mother.name}`,
      parents: {
        male: `${ringneckResult.father.name} (${ringneckResult.father.formula})`,
        female: `${ringneckResult.mother.name} (${ringneckResult.mother.formula})`
      },
      maleRows: ringneckResult.male,
      femaleRows: ringneckResult.female,
      notes: ringneckResult.notes,
      verdict: 'resultado calculado pelo motor Bird + Mutation + Engine',
      technicalRows: [
        { mutation: 'blue', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal' },
        { mutation: 'cleartail', male: ringneckResult.father.formula, female: ringneckResult.mother.formula, inheritance: 'autosomal_recessive' }
      ]
    }),
    filename: `relatorio-ringneck-cleartail-${new Date().toISOString().slice(0, 10)}.md`
  }), [ringneckResult]);

  const validationCases = useMemo(() => {
    const opalinoOnly = initialState();
    opalinoOnly.opalino.enabled = true;
    opalinoOnly.opalino.male = 'split';
    opalinoOnly.opalino.female = 'visual';

    const pallidOnly = initialState();
    pallidOnly.pallid.enabled = true;
    pallidOnly.pallid.male = 'split';
    pallidOnly.pallid.female = 'visual';

    const violetaOnly = initialState();
    violetaOnly.violeta.enabled = true;
    violetaOnly.violeta.male = 'sf';
    violetaOnly.violeta.female = 'normal';

    const opalinoResult = calculateMultiLocus(opalinoOnly);
    const pallidResult = calculateMultiLocus(pallidOnly);
    const violetaResult = calculateMultiLocus(violetaOnly);

    return [
      {
        title: 'Ringneck Cleartail',
        expected: 'Cleartail Verde x Cleartail Verde',
        result: {
          maleHeadline: ringneckResult.headline,
          femaleHeadline: ringneckResult.headline,
          maleRows: ringneckResult.male,
          femaleRows: ringneckResult.female
        }
      },
      {
        title: 'SÃ©rie Azul 1',
        expected: 'Verde x Azul',
        result: {
          maleHeadline: blueResult.father.name + ' x ' + blueResult.mother.name,
          femaleHeadline: blueResult.father.name + ' x ' + blueResult.mother.name,
          maleRows: blueResult.male,
          femaleRows: blueResult.female
        }
      },
      {
        title: 'SÃ©rie Azul 2',
        expected: 'Turquesa x Ãndigo',
        result: {
          maleHeadline: calculateBlueSeriesAdvanced('turquoise', 'indigo').father.name + ' x ' + calculateBlueSeriesAdvanced('turquoise', 'indigo').mother.name,
          femaleHeadline: calculateBlueSeriesAdvanced('turquoise', 'indigo').father.name + ' x ' + calculateBlueSeriesAdvanced('turquoise', 'indigo').mother.name,
          maleRows: calculateBlueSeriesAdvanced('turquoise', 'indigo').male,
          femaleRows: calculateBlueSeriesAdvanced('turquoise', 'indigo').female
        }
      },
      {
        title: 'Opalino',
        expected: 'Macho split x FÃªmea visual',
        result: {
          maleHeadline: opalinoResult.summary.male[0]?.phenotype || 'Sem resultado',
          femaleHeadline: opalinoResult.summary.female[0]?.phenotype || 'Sem resultado',
          maleRows: opalinoResult.summary.male,
          femaleRows: opalinoResult.summary.female
        }
      },
      {
        title: 'Pallid',
        expected: 'Macho split x FÃªmea visual',
        result: {
          maleHeadline: pallidResult.summary.male[0]?.phenotype || 'Sem resultado',
          femaleHeadline: pallidResult.summary.female[0]?.phenotype || 'Sem resultado',
          maleRows: pallidResult.summary.male,
          femaleRows: pallidResult.summary.female
        }
      },
      {
        title: 'Violeta',
        expected: 'Macho SF x FÃªmea normal',
        result: {
          maleHeadline: violetaResult.summary.male[0]?.phenotype || 'Sem resultado',
          femaleHeadline: violetaResult.summary.female[0]?.phenotype || 'Sem resultado',
          maleRows: violetaResult.summary.male,
          femaleRows: violetaResult.summary.female
        }
      }
    ];
  }, [ringneckResult, blueResult, result]);

  const updateRule = (ruleId, patch) => {
    setSelections((prev) => ({ ...prev, [ruleId]: { ...prev[ruleId], ...patch } }));
  };

  const updateMeta = (field, value) => {
    setMeta((prev) => ({ ...prev, [field]: value }));
  };

  const pushHistoryEntry = (entry) => {
    const createdAt = new Date().toISOString();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const normalized = {
      id,
      createdAt,
      ...entry
    };

    setCrossHistory((prev) => [normalized, ...prev].slice(0, 12));

    const payload = {
      titulo: normalized.title || 'Cruzamento genético',
      resumo: JSON.stringify({
        title: normalized.title || 'Cruzamento genético',
        summary: normalized.summary || '',
        markdown: normalized.markdown || '',
        html: normalized.html || '',
        type: normalized.type || 'history',
        createdAt
      }),
      url: `genetics-history/${id}`,
      fonte: 'Histórico Genético',
      criado_em: createdAt
    };

    supabase
      .from('knowledge_base')
      .upsert([payload], { onConflict: 'url' })
      .then(({ error }) => {
        if (error) console.warn('Falha ao salvar histórico no Supabase:', error.message);
      })
      .catch((error) => {
        console.warn('Falha ao salvar histórico no Supabase:', error?.message || error);
      });
  };

  const enviarResumoAoJarvis = (summary, title) => {
    localStorage.setItem(
      'jarvis_genetics_prompt',
      JSON.stringify({ title, summary, createdAt: new Date().toISOString() })
    );
    navigate('/jarvis');
  };

  const abrirHistoricoItem = (item) => {
    if (!item?.html) return;
    openHtmlPreview(item.html);
  };

  const baixarHistoricoItem = (item) => {
    if (!item?.markdown) return;
    downloadTextFile(
      `${String(item.title || 'cruzamento').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.md`,
      item.markdown
    );
  };

  const baixarRelatorioPrincipal = async () => {
    downloadTextFile(mainCrossReport.filename, mainCrossReport.markdown);
  };

  const abrirEbookPrincipal = () => {
    openHtmlPreview(mainCrossReport.html);
  };

  const copiarResumoPrincipal = async () => {
    await copyTextToClipboard(mainCrossReport.summary);
  };

  const baixarRelatorioBlue = async () => {
    downloadTextFile(blueSeriesReport.filename, blueSeriesReport.markdown);
  };

  const abrirEbookBlue = () => {
    openHtmlPreview(blueSeriesReport.html);
  };

  const copiarResumoBlue = async () => {
    await copyTextToClipboard(blueSeriesReport.summary);
  };

  const baixarRelatorioRingneck = async () => {
    downloadTextFile(ringneckCrossReport.filename, ringneckCrossReport.markdown);
  };

  const abrirEbookRingneck = () => {
    openHtmlPreview(ringneckCrossReport.html);
  };

  const copiarResumoRingneck = async () => {
    await copyTextToClipboard(ringneckCrossReport.summary);
  };

  const salvarMainNoHistorico = () => {
    pushHistoryEntry({
      type: 'multi_locus',
      title: mainCrossReport.title,
      summary: mainCrossReport.summary,
      markdown: mainCrossReport.markdown,
      html: mainCrossReport.html
    });
  };

  const gerarLaudoPdf = () => {
    const html = buildLaudoHtml({
      meta,
      selections,
      result,
      maleCombined,
      femaleCombined,
      bibliography: referenceBibliography
    });
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const calcularRingneck = () => {
    const next = calculateRingneckCleartailAdvanced(ringneckMalePreset, ringneckFemalePreset);
    setRingneckResult(next);
    pushHistoryEntry({
      type: 'ringneck',
      title: `Ringneck Cleartail - ${next.father.name} x ${next.mother.name}`,
      summary: next.headline,
      markdown: buildCrossReportMarkdown({
        title: `Ringneck Cleartail - ${next.father.name} x ${next.mother.name}`,
        subtitle: 'Cruzamento salvo automaticamente no histórico',
        parents: { male: `${next.father.name} (${next.father.formula})`, female: `${next.mother.name} (${next.mother.formula})` },
        maleRows: next.male,
        femaleRows: next.female,
        notes: next.notes,
        verdict: 'resultado salvo automaticamente pela calculadora',
        bibliography: referenceBibliography,
        technicalRows: [
          { mutation: 'blue', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal' },
          { mutation: 'cleartail', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal_recessive' }
        ]
      }),
      html: buildCrossReportHtml({
        title: `Ringneck Cleartail - ${next.father.name} x ${next.mother.name}`,
        subtitle: 'Cruzamento salvo automaticamente no histórico',
        parents: { male: `${next.father.name} (${next.father.formula})`, female: `${next.mother.name} (${next.mother.formula})` },
        maleRows: next.male,
        femaleRows: next.female,
        notes: next.notes,
        verdict: 'resultado salvo automaticamente pela calculadora',
        bibliography: referenceBibliography,
        technicalRows: [
          { mutation: 'blue', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal' },
          { mutation: 'cleartail', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal_recessive' }
        ]
      })
    });
  };

  const calcularBlueSeries = () => {
    const next = calculateBlueSeriesAdvanced(blueMalePreset, blueFemalePreset);
    setBlueResult(next);
    pushHistoryEntry({
      type: 'blue_series',
      title: `Série Azul - ${next.father.name} x ${next.mother.name}`,
      summary: next.headline,
      markdown: buildCrossReportMarkdown({
        title: `Série Azul - ${next.father.name} x ${next.mother.name}`,
        subtitle: 'Cruzamento salvo automaticamente no histórico',
        parents: { male: `${next.father.name} (${next.father.formula})`, female: `${next.mother.name} (${next.mother.formula})` },
        maleRows: next.male,
        femaleRows: next.female,
        notes: next.notes,
        verdict: 'resultado salvo automaticamente pela calculadora',
        bibliography: referenceBibliography,
        technicalRows: [
          { mutation: 'blue_series', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal_multiallelic' }
        ]
      }),
      html: buildCrossReportHtml({
        title: `Série Azul - ${next.father.name} x ${next.mother.name}`,
        subtitle: 'Cruzamento salvo automaticamente no histórico',
        parents: { male: `${next.father.name} (${next.father.formula})`, female: `${next.mother.name} (${next.mother.formula})` },
        maleRows: next.male,
        femaleRows: next.female,
        notes: next.notes,
        verdict: 'resultado salvo automaticamente pela calculadora',
        bibliography: referenceBibliography,
        technicalRows: [
          { mutation: 'blue_series', male: next.father.formula, female: next.mother.formula, inheritance: 'autosomal_multiallelic' }
        ]
      })
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-elevated rounded-2xl border border-brand-cyan/20 p-6" id="genetics-overview">
        <h1 className="font-heading font-black text-2xl text-white flex items-center gap-3">
          <Dna className="text-brand-cyan" size={28} />
          Calculadora GenÃ©tica PsitacÃ­deos
        </h1>
        <p className="text-brand-text-muted text-sm mt-2">
          Motor multi-locus v1 com base no Guia CanÃ´nico de MutaÃ§Ãµes e nas planilhas de acasalamento Ring Neck.
        </p>
      </div>

      <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-[#07111b]/85 backdrop-blur-xl">
        <div className="rounded-2xl border border-white/10 bg-[#0B1722]/90 p-3 shadow-2xl shadow-black/15">
          <div className="flex flex-wrap gap-2">
            {[
              ['Processo', 'processo'],
              ['Validação', 'validacao'],
              ['Bibliografias', 'bibliografias'],
              ['Laudo', 'laudo']
            ].map(([label, key]) => (
              <button key={key} type="button" onClick={() => setGeneticsPanel(key)} className={panelPillClass(key)}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-brand-text-muted">
            Nomes das tabelas e das planilhas permanecem iguais aos do criador. Só reorganizei a navegação.
          </p>
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-4 ${geneticsPanel === 'processo' ? '' : 'hidden'}`} id="genetics-menu">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Beaker size={16} className="text-brand-cyan" />
              Mutações X
            </h3>
            <p className="text-xs text-brand-text-muted mt-1">
              Menu único para abrir o processo completo sem ficar pulando entre blocos soltos.
            </p>
          </div>
          <button
            onClick={() => jumpToSection('genetics-overview')}
            className="self-start lg:self-auto px-4 py-2 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-xs font-bold hover:bg-brand-cyan/30 transition-all"
          >
            Abrir processo completo
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['Visão geral', 'genetics-overview'],
            ['Ringneck', 'genetics-ringneck'],
            ['Série Azul', 'genetics-blue'],
            ['Matriz Base', 'genetics-matrix'],
            ['Bibliografia', 'genetics-bibliography'],
            ['Laudo', 'genetics-laudo'],
            ['Futuro', 'genetics-roadmap']
          ].map(([label, id]) => (
            <button
              key={id}
              onClick={() => jumpToSection(id)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white hover:border-brand-cyan/40 hover:text-brand-cyan transition-all"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-brand-elevated rounded-2xl border border-white/10 p-5" id="genetics-blue">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Beaker size={16} className="text-brand-cyan" />
          SÃ©rie Azul PsitacÃ­deos
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Modelo base para testar a sÃ©rie azul como locus multialÃ©lico. O resultado Ã© igual para macho e fÃªmea porque este bloco trata o locus como autossÃ´mico.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <label className="text-xs text-brand-text-muted">
            Macho (Pai)
            <select
              className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-white"
              value={blueMalePreset}
              onChange={(e) => setBlueMalePreset(e.target.value)}
            >
              {BLUE_SERIES_PRESETS.map((preset) => (
                <option key={`blue-male-${preset.value}`} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-brand-text-muted">
            FÃªmea (MÃ£e)
            <select
              className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-white"
              value={blueFemalePreset}
              onChange={(e) => setBlueFemalePreset(e.target.value)}
            >
              {BLUE_SERIES_PRESETS.map((preset) => (
                <option key={`blue-female-${preset.value}`} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={calcularBlueSeries}
          className="w-full py-3 rounded-xl bg-brand-cyan text-black font-black tracking-wide hover:brightness-110 transition-all"
        >
          Calcular SÃ©rie Azul
        </button>

        <div className="mt-5 rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
          <p className="text-sm font-black text-white mb-2">
            Estimativa de Filhotes - {blueResult.father.name} x {blueResult.mother.name}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-white/10 bg-[#0B1722] p-3">
              <p className="text-xs text-brand-text-muted mb-1">Macho (Pai)</p>
              <p className="text-sm font-bold text-white">{blueResult.father.name}</p>
              <p className="text-[11px] text-brand-text-muted mt-1">{blueResult.father.formula}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B1722] p-3">
              <p className="text-xs text-brand-text-muted mb-1">FÃªmea (MÃ£e)</p>
              <p className="text-sm font-bold text-white">{blueResult.mother.name}</p>
              <p className="text-[11px] text-brand-text-muted mt-1">{blueResult.mother.formula}</p>
            </div>
          </div>
          {blueResult.headline && (
            <div className="mb-4 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-sm font-bold text-white">
              {blueResult.headline}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlanilhaResultTable title="Machos" rows={blueResult.male} />
            <PlanilhaResultTable title="FÃªmeas" rows={blueResult.female} />
          </div>
          <p className="text-xs text-brand-text-muted mt-3">{blueResult.notes}</p>

          <div className="mt-4">
            <ReportCard
              title="RelatÃ³rio automÃ¡tico da SÃ©rie Azul"
              report={blueSeriesReport}
              onDownloadMd={baixarRelatorioBlue}
              onOpenHtml={abrirEbookBlue}
              onCopy={copiarResumoBlue}
              onExplain={() => enviarResumoAoJarvis(blueSeriesReport.summary, blueSeriesReport.title)}
            />
          </div>
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'validacao' ? '' : 'hidden'}`} id="genetics-validation">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand-green" />
          Casos Fixos de ValidaÃ§Ã£o
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Bloco para conferÃªncia rÃ¡pida com exemplos reais da planilha. Use isso para comparar o resultado do motor com o que vocÃª jÃ¡ espera visualizar.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {validationCases.map((item) => (
            <ValidationCard key={item.title} title={item.title} expected={item.expected} result={item.result} status={item.status} />
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'validacao' ? '' : 'hidden'}`} id="genetics-verification">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand-cyan" />
          VerificaÃ§Ã£o Mendeliana
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Essa seÃ§Ã£o compara o que o motor calcula com a expectativa dos cruzamentos centrais. Se aparecer `AJUSTAR`, a regra precisa ser refinada antes de confiar no resultado.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ringneckVerificationSuite.map((item) => (
            <ValidationCard
              key={item.title}
              title={item.title}
              expected={`Macho/FÃªmea previstos na planilha`}
              result={item.result}
              status={item.status}
            />
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'validacao' ? '' : 'hidden'}`} id="genetics-matrix">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Beaker size={16} className="text-brand-cyan" />
          Matriz Base Ringneck
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Casos centrais jÃ¡ calculados diretamente pelo motor para servir de referÃªncia rÃ¡pida na leitura da planilha.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ringneckBaseMatrix.map((item) => (
            <ValidationCard
              key={item.title}
              title={item.title}
              expected={item.expected}
              result={{
                maleHeadline: item.result.headline,
                femaleHeadline: item.result.headline,
                maleRows: item.result.male,
                femaleRows: item.result.female
              }}
            />
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'validacao' ? '' : 'hidden'}`} id="genetics-official-catalog">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <Dna size={16} className="text-brand-cyan" />
          CatÃ¡logo Oficial Ringneck
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          FenÃ³tipos deduplicados extraÃ­dos do `config.js` da calculadora original, agrupados para servir como lista oficial reconhecida pelo motor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ringneckOfficialGroups.map((group) => (
            <div key={group.group} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-black text-white">{group.group}</p>
                <span className="text-[11px] text-brand-cyan font-bold">{group.labels.length} itens</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.labels.slice(0, 12).map((label) => (
                  <span key={`${group.group}-${label}`} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'bibliografias' ? '' : 'hidden'}`} id="genetics-bibliography">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-green" />
          Biblioteca de Tabelas Arlequim
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Estrutura extraída diretamente das planilhas de arlequim dominante e recessivo para servir como base de referência e validação do motor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {arlequimTableSources.map((source) => (
            <div key={source.mutationId} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-black text-white">{source.label}</p>
                <span className="text-[11px] text-brand-cyan font-bold">{source.pageCount} pgs</span>
              </div>
              <div className="text-[11px] text-brand-text-muted mb-2">
                {source.blockCount} blocos estruturados extraídos
              </div>
              <div className="flex flex-wrap gap-2">
                {source.sampleHeadings.slice(0, 6).map((heading, idx) => (
                  <span
                    key={`${source.mutationId}-${idx}`}
                    className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200"
                  >
                    {heading || 'Bloco sem título'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'bibliografias' ? '' : 'hidden'}`}>
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-cyan" />
          Biblioteca de Tabelas Cleartail
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Estrutura extraída diretamente da planilha de Cleartail e Portadores para servir como segunda referência estruturada do Ringneck.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cleartailTableSources.map((source) => (
            <div key={source.mutationId} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-black text-white">{source.label}</p>
                <span className="text-[11px] text-brand-cyan font-bold">{source.pageCount} pgs</span>
              </div>
              <div className="text-[11px] text-brand-text-muted mb-2">
                {source.blockCount} blocos estruturados extraídos
              </div>
              <div className="flex flex-wrap gap-2">
                {source.sampleHeadings.slice(0, 6).map((heading, idx) => (
                  <span
                    key={`${source.mutationId}-${idx}`}
                    className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200"
                  >
                    {heading || 'Bloco sem título'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'bibliografias' ? '' : 'hidden'}`}>
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={16} className="text-amber-300" />
          Biblioteca Sex-linked
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Estrutura extraída das planilhas de Opalino, Pallid e Violeta para apoiar a interpretação ligada ao sexo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sexlinkedTableSources.map((source) => (
            <div key={source.mutationId} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-black text-white">{source.label}</p>
                <span className="text-[11px] text-brand-cyan font-bold">{source.pageCount} pgs</span>
              </div>
              <div className="text-[11px] text-brand-text-muted mb-2">
                {source.blockCount} blocos estruturados extraídos
              </div>
              <div className="flex flex-wrap gap-2">
                {source.sampleHeadings.slice(0, 6).map((heading, idx) => (
                  <span
                    key={`${source.mutationId}-${idx}`}
                    className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-200"
                  >
                    {heading || 'Bloco sem título'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'bibliografias' ? '' : 'hidden'}`} id="genetics-roadmap">
        <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-cyan" />
          Próxima família em preparação
        </h3>
        <p className="text-xs text-brand-text-muted mb-4">
          Ringneck segue como motor ativo. A próxima trilha já fica reservada para expandir o mesmo padrão
          mendeliano para outras famílias de psitacídeos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {speciesRoadmap.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-black text-white">{item.label}</p>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                    item.status === 'ativo'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : item.status === 'em preparacao'
                        ? 'bg-amber-500/15 text-amber-200'
                        : 'bg-white/5 text-gray-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-brand-text-muted leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" id="genetics-ringneck">
        <div className="bg-brand-elevated rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Beaker size={16} className="text-brand-cyan" />
            Modo Planilha Ringneck - Cleartail
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <label className="text-xs text-brand-text-muted">
              EspÃ©cie
              <select
                className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-white"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              >
                <option value="ringneck">Ringneck</option>
              </select>
            </label>

            <label className="text-xs text-brand-text-muted">
              Macho (Pai)
              <select
                className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-white"
                value={ringneckMalePreset}
                onChange={(e) => setRingneckMalePreset(e.target.value)}
              >
                {RINGNECK_CLEARTAIL_PRESETS.map((preset) => (
                  <option key={`male-${preset.value}`} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-brand-text-muted">
              FÃªmea (MÃ£e)
              <select
                className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-white"
                value={ringneckFemalePreset}
                onChange={(e) => setRingneckFemalePreset(e.target.value)}
              >
                {RINGNECK_CLEARTAIL_PRESETS.map((preset) => (
                  <option key={`female-${preset.value}`} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={calcularRingneck}
            className="w-full mb-5 py-3 rounded-xl bg-amber-400 text-black font-black tracking-wide hover:bg-amber-300 transition-all"
          >
            Calcular Cruzamento
          </button>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 mb-5">
            <p className="text-sm font-black text-white mb-2">
              Estimativa de Filhotes - {ringneckResult.father.name} x {ringneckResult.mother.name}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-white/10 bg-[#0D1F2D] p-3">
                <p className="text-xs text-brand-text-muted mb-1">Macho (Pai)</p>
                <p className="text-sm font-bold text-white">{ringneckResult.father.name}</p>
                <p className="text-[11px] text-brand-text-muted mt-1">{ringneckResult.father.formula}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0D1F2D] p-3">
                <p className="text-xs text-brand-text-muted mb-1">FÃªmea (MÃ£e)</p>
                <p className="text-sm font-bold text-white">{ringneckResult.mother.name}</p>
                <p className="text-[11px] text-brand-text-muted mt-1">{ringneckResult.mother.formula}</p>
              </div>
            </div>
            {ringneckResult.headline && (
              <div className="mb-4 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-sm font-bold text-white">
                {ringneckResult.headline}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlanilhaResultTable title="Machos" rows={ringneckResult.male} />
              <PlanilhaResultTable title="FÃªmeas" rows={ringneckResult.female} />
            </div>
            <p className="text-xs text-brand-text-muted mt-3">{ringneckResult.notes}</p>
            <div className="mt-4">
              <ReportCard
                title="RelatÃ³rio automÃ¡tico Ringneck Cleartail"
                report={ringneckCrossReport}
                onDownloadMd={baixarRelatorioRingneck}
                onOpenHtml={abrirEbookRingneck}
                onCopy={copiarResumoRingneck}
                onExplain={() => enviarResumoAoJarvis(ringneckCrossReport.summary, ringneckCrossReport.title)}
              />
            </div>
          </div>

          <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Beaker size={16} className="text-brand-cyan" />
            Motor Multi-locus Experimental
          </h3>

          <div className="space-y-4">
            {RULES.map((rule) => {
              const conf = selections[rule.id];
              const opts = getParentOptions(rule);
              return (
                <div key={rule.id} className="rounded-xl border border-white/10 p-4 bg-[#0D1F2D]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{rule.mutation}</p>
                      <p className="text-[11px] text-brand-text-muted">
                        {rule.inheritance} | confianÃ§a: {rule.confidence}
                      </p>
                    </div>
                    <Chip active={conf.enabled} onClick={() => updateRule(rule.id, { enabled: !conf.enabled })}>
                      {conf.enabled ? 'Ativa' : 'Inativa'}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-xs text-brand-text-muted">
                      Macho
                      <select
                        className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-2 py-2 text-white"
                        value={conf.male}
                        onChange={(e) => updateRule(rule.id, { male: e.target.value })}
                        disabled={!conf.enabled}
                      >
                        {opts.male.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs text-brand-text-muted">
                      FÃªmea
                      <select
                        className="mt-1 w-full bg-brand-base border border-white/10 rounded-lg px-2 py-2 text-white"
                        value={conf.female}
                        onChange={(e) => updateRule(rule.id, { female: e.target.value })}
                        disabled={!conf.enabled}
                      >
                        {opts.female.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5" id="genetics-laudo">
          <div className={`bg-brand-elevated rounded-2xl border border-white/10 p-5 ${geneticsPanel === 'laudo' ? '' : 'hidden'}`}>
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-cyan" />
              Modo Laudo (PDF)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="CriatÃ³rio" value={meta.criatorio} onChange={(e) => updateMeta('criatorio', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="ResponsÃ¡vel tÃ©cnico" value={meta.responsavel} onChange={(e) => updateMeta('responsavel', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Contato" value={meta.contato} onChange={(e) => updateMeta('contato', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Cliente" value={meta.cliente} onChange={(e) => updateMeta('cliente', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="EspÃ©cie" value={meta.especie} onChange={(e) => updateMeta('especie', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="ID/Anilha do animal" value={meta.animalId} onChange={(e) => updateMeta('animalId', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white md:col-span-2" placeholder="Nome do animal" value={meta.animalNome} onChange={(e) => updateMeta('animalNome', e.target.value)} />
              <input className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white md:col-span-2" placeholder="URL da logo do criatÃ³rio (opcional)" value={meta.logoUrl} onChange={(e) => updateMeta('logoUrl', e.target.value)} />
              <textarea className="bg-brand-base border border-white/10 rounded-lg px-3 py-2 text-sm text-white md:col-span-2 min-h-[80px]" placeholder="ObservaÃ§Ãµes para o laudo" value={meta.observacoes} onChange={(e) => updateMeta('observacoes', e.target.value)} />
            </div>

            <button
              onClick={gerarLaudoPdf}
              className="w-full py-2.5 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan font-bold hover:bg-brand-cyan/30 transition-all"
            >
              Gerar Laudo para Imprimir em PDF
            </button>
          </div>

          <div className="bg-brand-elevated rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-green" />
              Resultado Combinado Multi-Locus
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <SummaryTable title="Resumo FenotÃ­pico Macho" rows={maleSummary} />
              <SummaryTable title="Resumo FenotÃ­pico FÃªmea" rows={femaleSummary} />
              <ResultTable title="Filhotes Macho (ZZ)" rows={maleCombined} />
              <ResultTable title="Filhotes FÃªmea (ZW)" rows={femaleCombined} />
            </div>
            <div className="mt-4">
              <ReportCard
                title="Relatório automático do cruzamento"
                report={mainCrossReport}
                onDownloadMd={baixarRelatorioPrincipal}
                onOpenHtml={abrirEbookPrincipal}
                onCopy={copiarResumoPrincipal}
                onExplain={() => enviarResumoAoJarvis(mainCrossReport.summary, mainCrossReport.title)}
              />
            </div>
            <button
              onClick={salvarMainNoHistorico}
              className="mt-3 w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:border-brand-cyan/40 hover:text-brand-cyan transition-all"
            >
              Salvar este cruzamento no histórico
            </button>
          </div>

          <div className="bg-brand-elevated rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4">ExplicaÃ§Ã£o TÃ©cnica por MutaÃ§Ã£o</h3>
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {result.byMutation.map((m) => (
                <div key={m.mutation} className="rounded-xl border border-white/10 p-4 bg-[#0D1F2D]">
                  <p className="text-sm font-bold text-white">{m.mutation}</p>
                  <p className="text-[11px] text-brand-text-muted mb-3">
                    heranÃ§a: {m.inheritance} | confianÃ§a: {m.confidence}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <ResultTable title="Macho" rows={formatProbabilityRows(m.male)} />
                    <ResultTable title="FÃªmea" rows={formatProbabilityRows(m.female)} />
                  </div>

                  <p className="text-xs text-gray-300">{m.notes}</p>
                  {!!m.evidence_urls?.length && (
                    <p className="text-[11px] text-brand-cyan mt-2 break-all">
                      EvidÃªncia: {m.evidence_urls[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-elevated rounded-2xl border border-white/10 p-5">
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-brand-cyan" />
              Histórico dos Cruzamentos
            </h3>
            <p className="text-xs text-brand-text-muted mb-4">
              Os cruzamentos calculados ficam salvos neste navegador para você comparar, baixar ou mandar para o Jarvis depois.
            </p>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {crossHistory.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-black/10 p-3 text-sm text-brand-text-muted">
                  Nenhum cruzamento salvo ainda.
                </div>
              )}
              {crossHistory.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-[#0D1F2D] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-brand-text-muted mt-1">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full border border-brand-cyan/30 text-brand-cyan font-bold">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 mt-3 leading-relaxed">{item.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => baixarHistoricoItem(item)}
                      className="px-3 py-2 rounded-lg bg-brand-cyan text-black text-xs font-bold"
                    >
                      Baixar .md
                    </button>
                    <button
                      onClick={() => abrirHistoricoItem(item)}
                      className="px-3 py-2 rounded-lg bg-brand-green/20 border border-brand-green/30 text-brand-green text-xs font-bold"
                    >
                      Abrir ebook
                    </button>
                    <button
                      onClick={() => enviarResumoAoJarvis(item.summary, item.title)}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold"
                    >
                      Explicar no Jarvis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





