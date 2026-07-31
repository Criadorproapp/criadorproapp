const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const agentPrompts = require('./agent_prompts.js');

let pdfParse = null;
try {
    pdfParse = require('pdf-parse');
} catch {
    pdfParse = null;
}

const port = process.env.PORT || 4173;
// API moveu para apps/api; arquivos estaticos e livros seguem na raiz do projeto.
const root = path.resolve(__dirname, '..', '..');
const livrosRoot = path.join(root, 'livros');
const textExtensions = new Set(['.txt', '.md', '.csv', '.json']);
const maxPdfBytes = 25 * 1024 * 1024;
const pdfTextCache = new Map();
let livrosFilesCache = { timestamp: 0, files: [] };
const jarvisUpstreamUrl = process.env.JARVIS_UPSTREAM_URL || '';
const jarvisUpstreamToken = process.env.JARVIS_UPSTREAM_TOKEN || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const jarvisCharacter = process.env.JARVIS_CHARACTER || 'Jarvis Dr. Aves Criador Pro';

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function sendFile(filePath, response) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            response.end(error.code === 'ENOENT' ? 'Arquivo não encontrado.' : 'Erro interno ao ler o arquivo.');
            return;
        }

        response.writeHead(200, { 'Content-Type': contentType });
        response.end(data);
    });
}

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(payload));
}

function readJsonBody(request, maxBytes = 1_000_000) {
    return new Promise((resolve, reject) => {
        let raw = '';
        request.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > maxBytes) {
                reject(new Error('Payload muito grande.'));
                request.destroy();
            }
        });
        request.on('end', () => {
            if (!raw.trim()) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch {
                reject(new Error('JSON inválido.'));
            }
        });
        request.on('error', (error) => reject(error));
    });
}

function normalize(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(query) {
    return normalize(query)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2);
}

function listFilesRecursive(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const result = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            result.push(...listFilesRecursive(fullPath));
        } else if (entry.isFile()) {
            result.push(fullPath);
        }
    }
    return result;
}

function getLivrosFiles() {
    const now = Date.now();
    if (now - livrosFilesCache.timestamp < 60_000 && livrosFilesCache.files.length) {
        return livrosFilesCache.files;
    }
    if (!fs.existsSync(livrosRoot)) {
        livrosFilesCache = { timestamp: now, files: [] };
        return [];
    }
    const files = listFilesRecursive(livrosRoot);
    livrosFilesCache = { timestamp: now, files };
    return files;
}

function safeReadTextFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return '';
    }
}

function buildSnippet(rawText, tokens) {
    const text = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    const normalized = normalize(text);
    let index = -1;
    for (const token of tokens) {
        index = normalized.indexOf(token);
        if (index >= 0) break;
    }
    if (index < 0) index = 0;
    const start = Math.max(0, index - 90);
    const end = Math.min(text.length, index + 210);
    return text.slice(start, end).trim();
}

async function readPdfText(filePath, stat) {
    if (!pdfParse) return '';
    const cacheKey = `${filePath}:${stat.mtimeMs}:${stat.size}`;
    if (pdfTextCache.has(cacheKey)) return pdfTextCache.get(cacheKey);
    let text = '';
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(dataBuffer);
        text = String(parsed?.text || '');
    } catch {
        text = '';
    }
    if (pdfTextCache.size > 80) {
        const firstKey = pdfTextCache.keys().next().value;
        if (firstKey) pdfTextCache.delete(firstKey);
    }
    pdfTextCache.set(cacheKey, text);
    return text;
}

async function searchLivros(query, limit) {
    const files = getLivrosFiles();
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    const byName = [];
    for (const filePath of files) {
        const fileName = path.basename(filePath);
        const normalizedName = normalize(fileName);
        const score = tokens.reduce((acc, token) => acc + (normalizedName.includes(token) ? 1 : 0), 0);
        if (score > 0) {
            byName.push({ filePath, fileName, score, source: 'nome' });
        }
    }
    byName.sort((a, b) => b.score - a.score || a.fileName.localeCompare(b.fileName));

    const contentMatches = [];
    const candidates = byName.slice(0, 24);
    for (const item of candidates) {
        const ext = path.extname(item.filePath).toLowerCase();
        const stat = fs.statSync(item.filePath);
        let text = '';
        if (textExtensions.has(ext)) {
            text = safeReadTextFile(item.filePath);
        } else if (ext === '.pdf' && stat.size <= maxPdfBytes) {
            text = await readPdfText(item.filePath, stat);
        } else {
            continue;
        }
        if (!text) continue;
        const normalizedText = normalize(text);
        const matched = tokens.every((token) => normalizedText.includes(token));
        if (!matched) continue;
        contentMatches.push({
            filePath: item.filePath,
            fileName: item.fileName,
            score: item.score + 3,
            source: 'conteudo',
            snippet: buildSnippet(text, tokens)
        });
    }

    const merged = [...byName, ...contentMatches]
        .sort((a, b) => b.score - a.score || a.fileName.localeCompare(b.fileName))
        .filter((entry, index, arr) => index === arr.findIndex((x) => x.filePath === entry.filePath && x.source === entry.source))
        .slice(0, limit);

    return merged.map((entry) => ({
        file: path.relative(root, entry.filePath),
        source: entry.source,
        snippet: entry.snippet || ''
    }));
}

function extractResponseText(data) {
    if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
    const output = Array.isArray(data?.output) ? data.output : [];
    const chunks = [];
    for (const item of output) {
        const content = Array.isArray(item?.content) ? item.content : [];
        for (const c of content) {
            if (typeof c?.text === 'string' && c.text.trim()) chunks.push(c.text.trim());
        }
    }
    return chunks.join('\n').trim();
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages
        .map((m) => ({
            role: ['user', 'assistant', 'system'].includes(m?.role) ? m.role : 'user',
            content: String(m?.content || '').trim()
        }))
        .filter((m) => m.content)
        .slice(-10);
}

async function callJarvisViaOpenAI(payload) {
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`
    };
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.error?.message || 'Falha na API OpenAI.';
        throw new Error(message);
    }
    const text = extractResponseText(data);
    return text || 'Não consegui gerar resposta nesta tentativa.';
}

async function callJarvisViaUpstream(payload) {
    const headers = { 'Content-Type': 'application/json' };
    if (jarvisUpstreamToken) headers.Authorization = `Bearer ${jarvisUpstreamToken}`;
    const response = await fetch(jarvisUpstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.error || data?.message || 'Falha no endpoint do agente.';
        throw new Error(message);
    }
    const text = String(data?.reply || data?.text || '').trim();
    return text || 'Endpoint respondeu sem texto.';
}

async function handleJarvisChat(request, response) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'Use POST em /api/jarvis/chat.' });
        return true;
    }

    let body = {};
    try {
        body = await readJsonBody(request);
    } catch (error) {
        sendJson(response, 400, { ok: false, error: error.message || 'Corpo inválido.' });
        return true;
    }

    const query = String(body?.query || '').trim();
    const context = body?.context && typeof body.context === 'object' ? body.context : {};
    const messages = sanitizeMessages(body?.messages);
    const fallbackQuery = query || messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    if (!fallbackQuery) {
        sendJson(response, 400, { ok: false, error: 'Envie query ou messages.' });
        return true;
    }

    const evidence = body?.useLivros === false ? [] : await searchLivros(fallbackQuery, 4);
    const evidenceBlock = evidence.length
        ? evidence.map((item, index) => `${index + 1}. ${item.file}${item.snippet ? `\nTrecho: ${item.snippet}` : ''}`).join('\n\n')
        : 'Nenhuma fonte local relevante encontrada.';

    const systemPrompt = [
        `Você é ${jarvisCharacter}, especialista técnico do Criador Pro.`,
        'Fale em português claro, com tom profissional e didático.',
        'Atue como consultor em genética e manejo de aves psitacídeos (especialmente ringneck).',
        'Sempre que possível, fundamente a resposta no contexto do cruzamento e nas fontes da pasta livros.',
        'Se houver incerteza, deixe explícito e sugira validação prática no plantel.'
    ].join(' ');

    const contextText = [
        'Contexto do usuário (JSON):',
        JSON.stringify(context),
        '',
        'Fontes locais (pasta livros):',
        evidenceBlock
    ].join('\n');

    try {
        let reply = '';
        let source = 'openai';
        if (jarvisUpstreamUrl) {
            source = 'upstream';
            reply = await callJarvisViaUpstream({
                query: fallbackQuery,
                context,
                messages,
                local_sources: evidence
            });
        } else {
            if (!openaiApiKey) {
                sendJson(response, 503, {
                    ok: false,
                    error: 'Integração Jarvis não configurada. Defina OPENAI_API_KEY ou JARVIS_UPSTREAM_URL.'
                });
                return true;
            }
            const inputMessages = [
                { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
                ...messages.map((m) => ({
                    role: m.role,
                    content: [{ type: 'input_text', text: m.content }]
                })),
                {
                    role: 'user',
                    content: [{ type: 'input_text', text: `${fallbackQuery}\n\n${contextText}` }]
                }
            ];
            reply = await callJarvisViaOpenAI({
                model: openaiModel,
                input: inputMessages
            });
        }

        sendJson(response, 200, {
            ok: true,
            source,
            model: jarvisUpstreamUrl ? 'external-agent' : openaiModel,
            reply,
            evidence
        });
    } catch (error) {
        sendJson(response, 500, {
            ok: false,
            error: error.message || 'Falha ao gerar resposta do Jarvis.'
        });
    }
    return true;
}

async function handleAgentCommand(request, response, parsedUrl) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'Use POST para agentes.' });
        return true;
    }
    const agentMatch = parsedUrl.pathname.match(/\/api\/agents\/(\w+)/);
    if (!agentMatch) {
        sendJson(response, 404, { ok: false, error: 'Agente não encontrado.' });
        return true;
    }
    const agentName = agentMatch[1];
    const systemPrompt = agentPrompts[agentName];
    if (!systemPrompt) {
        sendJson(response, 404, { ok: false, error: `Agente ${agentName} não existe nas configurações.` });
        return true;
    }

    let body = {};
    try {
        body = await readJsonBody(request);
    } catch (error) {
        sendJson(response, 400, { ok: false, error: 'Corpo inválido.' });
        return true;
    }

    const { query, context = {} } = body;
    if (!query) {
        sendJson(response, 400, { ok: false, error: 'Query obrigatória para o agente.' });
        return true;
    }

    try {
        let reply = '';
        if (!openaiApiKey) {
            sendJson(response, 503, { ok: false, error: 'OPENAI_API_KEY não configurada no .env para os agentes operarem.'});
            return true;
        }
        
        const inputMessages = [
            { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
            { role: 'user', content: [{ type: 'input_text', text: `Instrução ou Texto de Entrada:\n${query}\n\nContexto Adicional (se houver):\n${JSON.stringify(context)}` }] }
        ];
        
        reply = await callJarvisViaOpenAI({
            model: openaiModel,
            input: inputMessages
        });

        sendJson(response, 200, { ok: true, agent: agentName, reply });
    } catch (error) {
        sendJson(response, 500, { ok: false, error: error.message || `Falha no agente ${agentName}.` });
    }
    return true;
}

let nfeConfigCache = {
    ie: '123.456.789.110',
    doc: '00.000.000/0001-91',
    razaoSocial: 'Criatório Pingo D\'Ouro Ltda',
    regime: 'Produtor Rural (Simples Nacional)',
    ambiente: 'Homologacao',
    certificadoValido: true,
    certificadoVencimento: '2027-12-31'
};

let nfeEmitidas = [
    {
        id: 'nfe-101',
        numero: '000.000.101',
        serie: '1',
        chave: '35260712345678000195550010000001011001234567',
        dataEmissao: '2026-07-28T14:30:00Z',
        animalAnilha: 'RN-2024-001',
        especie: 'Ringneck',
        compradorNome: 'Criatório Sol Nascente - João Silva',
        compradorDoc: '111.222.333-44',
        compradorUf: 'SP',
        valor: 1500.00,
        ncm: '0106.39.00',
        cfop: '5.101',
        gta: 'GTA-SP-2026-88412',
        status: 'Autorizada',
        protocolo: '135260009841235'
    }
];

function generateChaveNfe() {
    let res = '352607';
    for (let i = 0; i < 38; i++) {
        res += Math.floor(Math.random() * 10);
    }
    return res;
}

async function handleNfe(request, response, parsedUrl) {
    const pathname = parsedUrl.pathname;
    
    if (pathname === '/api/nfe/config') {
        if (request.method === 'GET') {
            sendJson(response, 200, { ok: true, config: nfeConfigCache });
            return true;
        }
        if (request.method === 'POST') {
            try {
                const body = await readJsonBody(request);
                nfeConfigCache = {
                    ...nfeConfigCache,
                    ...body,
                    certificadoValido: true
                };
                sendJson(response, 200, { ok: true, message: 'Configurações fiscais salvas com sucesso!', config: nfeConfigCache });
            } catch (err) {
                sendJson(response, 400, { ok: false, error: err.message || 'Dados inválidos.' });
            }
            return true;
        }
    }

    if (pathname === '/api/nfe/emitir' && request.method === 'POST') {
        try {
            const body = await readJsonBody(request);
            if (!body.animalAnilha || !body.compradorNome || !body.valor) {
                sendJson(response, 400, { ok: false, error: 'Campos obrigatórios: Animal, Comprador e Valor.' });
                return true;
            }

            const numNota = String(nfeEmitidas.length + 102).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
            const novaNota = {
                id: `nfe-${Date.now()}`,
                numero: numNota,
                serie: '1',
                chave: generateChaveNfe(),
                dataEmissao: new Date().toISOString(),
                animalAnilha: String(body.animalAnilha),
                especie: String(body.especie || 'Ave Psitacídeo'),
                compradorNome: String(body.compradorNome),
                compradorDoc: String(body.compradorDoc || '000.000.000-00'),
                compradorUf: String(body.compradorUf || 'SP'),
                valor: Number(body.valor) || 0,
                ncm: String(body.ncm || '0106.39.00'),
                cfop: String(body.cfop || '5.101'),
                gta: String(body.gta || 'Não exigida / Interna'),
                status: 'Autorizada',
                protocolo: `13526${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                obs: String(body.obs || 'Nota Fiscal de Venda de Animal - Produtor Rural / Criador Pro')
            };

            nfeEmitidas.unshift(novaNota);
            sendJson(response, 200, { ok: true, message: 'Nota Fiscal emitida e autorizada pela SEFAZ com sucesso!', nota: novaNota });
        } catch (err) {
            sendJson(response, 500, { ok: false, error: err.message || 'Falha ao emitir Nota Fiscal.' });
        }
        return true;
    }

    if (pathname === '/api/nfe/lista' && request.method === 'GET') {
        sendJson(response, 200, { ok: true, total: nfeEmitidas.length, notas: nfeEmitidas });
        return true;
    }

    if (pathname === '/api/nfe/danfe' && request.method === 'GET') {
        const id = parsedUrl.searchParams.get('id');
        const nota = nfeEmitidas.find(n => n.id === id) || nfeEmitidas[0];
        
        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>DANFE - Nota Fiscal Eletrônica Nº ${nota.numero}</title>
<style>
    body { font-family: Arial, sans-serif; margin: 20px; background:#fff; color:#000; font-size:12px; }
    .danfe-box { border: 2px solid #000; padding: 15px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 18px; }
    .header p { margin: 3px 0; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .field-box { border: 1px solid #000; padding: 6px; }
    .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #333; display: block; }
    .val { font-size: 12px; font-weight: bold; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 11px; }
    th { background: #eee; }
    .badge { background: #22c55e; color: #fff; padding: 3px 8px; font-weight: bold; border-radius: 4px; display: inline-block; }
</style>
</head>
<body>
<div class="danfe-box">
    <div class="header">
        <h1>DANFE — Documento Auxiliar da Nota Fiscal Eletrônica</h1>
        <p><strong>CRIADOR PRO — EMISSOR DE NOTA FISCAL PRODUTOR RURAL</strong></p>
        <span class="badge">SEFAZ - AUTORIZADA</span>
    </div>

    <div class="grid">
        <div class="field-box">
            <span class="label">EMITENTE</span>
            <div class="val">${nfeConfigCache.razaoSocial}</div>
            <div>CNPJ/CPF: ${nfeConfigCache.doc} | IE: ${nfeConfigCache.ie}</div>
        </div>
        <div class="field-box">
            <span class="label">NÚMERO DA NF-E / SÉRIE</span>
            <div class="val">Nº ${nota.numero} — Série ${nota.serie}</div>
            <div>Data: ${new Date(nota.dataEmissao).toLocaleString('pt-BR')}</div>
        </div>
    </div>

    <div class="field-box" style="margin-bottom:10px;">
        <span class="label">CHAVE DE ACESSO SEFAZ (44 DÍGITOS)</span>
        <div class="val" style="font-family: monospace; font-size: 14px;">${nota.chave}</div>
        <div style="font-size:10px; color:#555;">Protocolo de Autorização: ${nota.protocolo}</div>
    </div>

    <div class="field-box" style="margin-bottom:10px;">
        <span class="label">DESTINATÁRIO / COMPRADOR</span>
        <div class="val">${nota.compradorNome}</div>
        <div>CPF/CNPJ: ${nota.compradorDoc} | UF: ${nota.compradorUf}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Código / Anilha</th>
                <th>Descrição do Animal / Produto</th>
                <th>NCM</th>
                <th>CFOP</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${nota.animalAnilha}</td>
                <td>Venda de Animal Vivo — ${nota.especie} (${nota.gta !== 'Não exigida / Interna' ? `GTA nº ${nota.gta}` : 'Com GTA/Termo'})</td>
                <td>${nota.ncm}</td>
                <td>${nota.cfop}</td>
                <td>1 UN</td>
                <td>R$ ${nota.valor.toFixed(2)}</td>
                <td><strong>R$ ${nota.valor.toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="field-box" style="margin-top:10px;">
        <span class="label">INFORMAÇÕES COMPLEMENTARES</span>
        <div>${nota.obs}</div>
    </div>

    <div style="margin-top:20px; text-align:center;">
        <button onclick="window.print()" style="padding:8px 16px; background:#0284c7; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">🖨️ Imprimir / Salvar em PDF</button>
    </div>
</div>
</body>
</html>`;

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
        return true;
    }

    return false;
}

async function handleApi(request, response) {
    const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (parsedUrl.pathname === '/api/jarvis/chat') {
        return handleJarvisChat(request, response);
    }
    if (parsedUrl.pathname.startsWith('/api/agents/')) {
        return handleAgentCommand(request, response, parsedUrl);
    }
    if (parsedUrl.pathname.startsWith('/api/nfe/')) {
        return handleNfe(request, response, parsedUrl);
    }
    if (parsedUrl.pathname !== '/api/livros/search') return false;

    const query = parsedUrl.searchParams.get('q') || '';
    const limit = Math.max(1, Math.min(12, Number(parsedUrl.searchParams.get('limit') || 6)));
    if (!query.trim()) {
        sendJson(response, 400, { ok: false, error: 'Parametro q obrigatorio.' });
        return true;
    }

    try {
        const results = await searchLivros(query, limit);
        sendJson(response, 200, { ok: true, query, results });
    } catch {
        sendJson(response, 500, { ok: false, error: 'Falha ao pesquisar livros.' });
    }
    return true;
}

const server = http.createServer(async (request, response) => {
    if (await handleApi(request, response)) return;

    const safePath = path.normalize(decodeURIComponent(request.url.split('?')[0])).replace(/^([.][.][\\/])+/, '');
    const relativePath = safePath === '/' ? 'index.html' : safePath.replace(/^\//, '');
    const filePath = path.join(root, relativePath);

    if (!filePath.startsWith(root)) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Acesso negado.');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (!error && stats.isDirectory()) {
            return sendFile(path.join(filePath, 'index.html'), response);
        }

        sendFile(filePath, response);
    });
});

server.listen(port, () => {
    console.log(`Criador Pro disponível em http://localhost:${port}`);
});
