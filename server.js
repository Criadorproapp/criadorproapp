const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

let pdfParse = null;
try {
    pdfParse = require('pdf-parse');
} catch {
    pdfParse = null;
}

const port = process.env.PORT || 4173;
const root = __dirname;
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

async function handleApi(request, response) {
    const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (parsedUrl.pathname === '/api/jarvis/chat') {
        return handleJarvisChat(request, response);
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
