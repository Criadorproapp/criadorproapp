import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { watch } from 'chokidar';
import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';
import googleIt from 'google-it';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PAINEL_PORT || 4180;
const vaultPath = process.env.OBSIDIAN_VAULT || 'E:\\Cerebro_Criador_Pro';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// Jarvis Protocol 12 - System Prompt (REFORÇADO)
const JARVIS_SYSTEM_PROMPT = `Você é o JARVIS (Just A Rather Very Intelligent System).
Você opera sob o PROTOCOLO MARK 12. Você possui ferramentas REAIS para interagir com o computador do usuário.

SUAS FERRAMENTAS MANDATÓRIAS:
1. 'list_disk_files': Use SEMPRE que o usuário mencionar arquivos, pastas ou drives (C:, E:, etc). Não diga "não posso", use a ferramenta.
2. 'toggle_hardware': Use IMEDIATAMENTE quando o usuário pedir para ligar/desligar câmera ou microfone.
3. 'search_web': Use para buscar informações que você não possui.
4. 'read_vault_note': Use para ler o conteúdo de notas no Obsidian.
5. 'read_tasks': OBRIGATÓRIO chamar esta ferramenta toda vez que o usuário perguntar "quais são minhas tarefas", "o que tenho pra hoje", "leia minhas tarefas" ou qualquer assunto relacionado à agenda.
6. 'add_task': OBRIGATÓRIO chamar para criar ou agendar um novo lembrete/tarefa.

DIRETRIZES:
- Se o usuário perguntar por tarefas, PARE e use 'read_tasks' imediatamente.
- Se o usuário pedir arquivos no PC, chame 'list_disk_files'.
- Nunca diga que não tem capacidade técnica para essas tarefas. Você TEM as ferramentas.
- Responda em português brasileiro técnico e direto.`;

app.use(express.json());

// Servindo Frontend Unificado
const projectRoot = path.resolve(__dirname, '../..');
app.use('/apps/painel', express.static(path.join(projectRoot, 'apps/painel')));
app.use('/vendor', express.static(path.join(projectRoot, 'vendor')));
app.use(express.static(projectRoot));

app.get(['/', '/app', '/sistema', '/login', '/criadorpro'], (req, res) => {
    res.redirect('/apps/painel/criadorpro.html');
});
app.get('/hud', (req, res) => {
    res.redirect('/apps/painel/index.html');
});
// --- API ROUTES (Obsidian & Agents) ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', protocol: 'Mark 12', ai: !!process.env.OPENAI_API_KEY });
});

app.get('/api/vault/tree', async (req, res) => {
    try {
        const getTree = async (dir) => {
            const files = await fs.readdir(dir, { withFileTypes: true });
            const tree = [];
            for (const file of files) {
                if (file.name.startsWith('.')) continue;
                const fullPath = path.join(dir, file.name);
                const relPath = path.relative(vaultPath, fullPath);
                if (file.isDirectory()) {
                    tree.push({ name: file.name, type: 'dir', path: relPath, children: await getTree(fullPath) });
                } else if (file.name.endsWith('.md')) {
                    tree.push({ name: file.name, type: 'file', path: relPath });
                }
            }
            return tree;
        };
        const tree = await getTree(vaultPath);
        res.json(tree);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/vault/file', async (req, res) => {
    try {
        const fullPath = path.join(vaultPath, req.query.path);
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ content });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/agents/:id/trigger', async (req, res) => {
    const agentId = req.params.id;
    const webhookMap = { radar: '01_live_para_shorts', midas: '05_publicacao_multicanal', spielberg: '02_ppt_pdf_para_video_narrado', stanley: '03_debate_sintetico_podcast_fake' };
    const workflow = webhookMap[agentId] || agentId;
    try {
        const url = `${process.env.N8N_URL}/webhook/${workflow}`;
        const response = await axios.post(url, { agentId, timestamp: new Date().toISOString() });
        res.json({ success: true, data: response.data });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// --- API TASKS ---
const DB_PATH = path.join(__dirname, 'database.json');

async function lerTarefas() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function salvarTarefas(tarefas) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(tarefas, null, 2));
    } catch (e) {
        console.error("Erro ao salvar banco de dados de tarefas:", e);
    }
}

app.get('/api/tasks', async (req, res) => {
    res.json(await lerTarefas());
});

app.post('/api/tasks', async (req, res) => {
    const { titulo, dataHora } = req.body;
    if (!titulo || !dataHora) return res.status(400).json({ erro: "Título e data/hora são obrigatórios." });

    const tarefas = await lerTarefas();
    const novaTarefa = {
        id: Date.now().toString(),
        titulo,
        dataHora,
        concluida: false,
        notificada: false
    };

    tarefas.push(novaTarefa);
    await salvarTarefas(tarefas);
    res.status(201).json(novaTarefa);
});

app.put('/api/tasks/:id/concluir', async (req, res) => {
    const { id } = req.params;
    const tarefas = await lerTarefas();
    const index = tarefas.findIndex(t => t.id === id);

    if (index === -1) return res.status(404).json({ erro: "Tarefa não encontrada" });

    tarefas[index].concluida = true;
    await salvarTarefas(tarefas);
    res.json(tarefas[index]);
});

// --- PROTOCOL 12 TOOLS ACTIONS ---

async function listDiskFiles(dirPath) {
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        return { path: dirPath, items: files.map(f => ({ name: f.name, type: f.isDirectory() ? 'dir' : 'file' })) };
    } catch (e) { return { error: `Erro ao acessar ${dirPath}: ${e.message}` }; }
}

async function searchWeb(query) {
    try {
        const options = { 'query': query, 'limit': 5, 'disableConsole': true };
        const results = await googleIt(options);
        if (results && results.length > 0) {
            return `Resultados de Pesquisa Web para "${query}":\n` + results.map((r, idx) => `[${idx+1}] Título: ${r.title}\nResumo: ${r.snippet}\nUrl: ${r.link}`).join('\n\n');
        }
        return `Nenhum resultado direto encontrado para "${query}".`;
    } catch (e) {
        return `Falha ao conectar com os servidores de busca: ${e.message}`;
    }
}

// --- SERVER & WEBSOCKETS ---

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Jarvis Command Center (Protocol 12) rodando em http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

const tools = [
    {
        type: "function",
        function: {
            name: "list_disk_files",
            description: "Lista o conteúdo de uma pasta no computador (C:, E:, etc).",
            parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
        }
    },
    {
        type: "function",
        function: {
            name: "toggle_hardware",
            description: "Comanda o ligar/desligar de hardware (câmera, microfone).",
            parameters: { 
                type: "object", 
                properties: { 
                    device: { type: "string", enum: ["camera", "microphone"] },
                    state: { type: "boolean" }
                }, 
                required: ["device", "state"] 
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_web",
            description: "Busca informações atualizadas na internet.",
            parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
        }
    },
    {
        type: "function",
        function: {
            name: "read_vault_note",
            description: "Lê o conteúdo de uma nota específica do Obsidian.",
            parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
        }
    },
    {
        type: "function",
        function: {
            name: "trigger_agent",
            description: "Aciona um agente autônomo (midas, spielberg, stanley) via webhook do n8n.",
            parameters: { type: "object", properties: { agent: { type: "string", enum: ["midas", "spielberg", "stanley", "radar"] } }, required: ["agent"] }
        }
    },
    {
        type: "function",
        function: {
            name: "read_tasks",
            description: "Chame esta função OBRIGATORIAMENTE para buscar e listar todas as tarefas, agenda ou cronograma atual do usuário.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "add_task",
            description: "Adiciona uma nova tarefa/lembrete no sistema.",
            parameters: { 
                type: "object", 
                properties: { 
                    titulo: { type: "string", description: "O título ou descrição da tarefa" },
                    dataHora: { type: "string", description: "A data e hora no formato YYYY-MM-DDTHH:mm" }
                }, 
                required: ["titulo", "dataHora"] 
            }
        }
    }
];

wss.on('connection', (ws) => {
    const chatHistory = [{ role: 'system', content: JARVIS_SYSTEM_PROMPT }];

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type !== 'chat') return;

            chatHistory.push({ role: 'user', content: data.text });

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: chatHistory,
                tools: tools,
                tool_choice: "auto"
            });

            const responseMessage = completion.choices[0].message;

            if (responseMessage.tool_calls) {
                chatHistory.push(responseMessage);
                for (const toolCall of responseMessage.tool_calls) {
                    const fnName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let result;

                    if (fnName === 'list_disk_files') result = await listDiskFiles(args.path);
                    else if (fnName === 'search_web') result = await searchWeb(args.query);
                    else if (fnName === 'toggle_hardware') {
                        ws.send(JSON.stringify({ type: 'hardware-control', device: args.device, state: args.state }));
                        result = { status: `Comando enviado para ${args.device}: ${args.state ? 'ON' : 'OFF'}` };
                    }
                    else if (fnName === 'read_vault_note') {
                        const fullPath = path.join(vaultPath, args.path);
                        const content = await fs.readFile(fullPath, 'utf-8');
                        result = { content };
                    }
                    else if (fnName === 'trigger_agent') {
                        const webhookMap = { radar: '01_live_para_shorts', midas: '05_publicacao_multicanal', spielberg: '02_ppt_pdf_para_video_narrado', stanley: '03_debate_sintetico_podcast_fake' };
                        const workflow = webhookMap[args.agent] || args.agent;
                        try {
                            const url = `${process.env.N8N_URL}/webhook/${workflow}`;
                            const response = await axios.post(url, { agentId: args.agent, timestamp: new Date().toISOString() });
                            result = { success: true, data: response.data, message: `Agente ${args.agent} disparado com sucesso.` };
                            ws.send(JSON.stringify({ type: 'agent-response', agent: args.agent, response: `Protocolo iniciado via chat. Status: Ativo.` }));
                        } catch (e) { result = { success: false, error: e.message }; }
                    }
                    else if (fnName === 'read_tasks') {
                        const tasks = await lerTarefas();
                        console.log("Jarvis leu tarefas:", tasks.length);
                        result = { message: "Estas são as tarefas ativas do usuário. Leia para ele.", tasks };
                    }
                    else if (fnName === 'add_task') {
                        const tarefas = await lerTarefas();
                        const novaTarefa = {
                            id: Date.now().toString(),
                            titulo: args.titulo,
                            dataHora: args.dataHora,
                            concluida: false,
                            notificada: false
                        };
                        tarefas.push(novaTarefa);
                        await salvarTarefas(tarefas);
                        result = { success: true, message: "Tarefa agendada com sucesso." };
                    }

                    console.log(`[TOOL CALL] ${fnName} =>`, result);
                    chatHistory.push({ role: 'tool', tool_call_id: toolCall.id, name: fnName, content: JSON.stringify(result) });
                }

                const secondResponse = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: chatHistory });
                const finalContent = secondResponse.choices[0].message.content;
                chatHistory.push({ role: 'assistant', content: finalContent });
                ws.send(JSON.stringify({ type: 'chat-response', text: finalContent }));
            } else {
                chatHistory.push(responseMessage);
                ws.send(JSON.stringify({ type: 'chat-response', text: responseMessage.content }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    });
});

// File Watcher
const watcher = watch(vaultPath, { ignored: /(^|[\/\\])\../, persistent: true, ignoreInitial: true });
watcher.on('all', (event, filePath) => {
    const relPath = path.relative(vaultPath, filePath);
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(JSON.stringify({ type: 'vault-update', event, path: relPath })); });
});

// Cron: Checar tarefas minuto a minuto
setInterval(async () => {
    const tarefas = await lerTarefas();
    const agora = new Date();
    let atualizado = false;

    tarefas.forEach(t => {
        if (!t.concluida && !t.notificada) {
            const dataTarefa = new Date(t.dataHora);
            if (dataTarefa <= agora) {
                console.log(`[ALERTA JARVIS] Lembrete de Tarefa: ${t.titulo}`);
                t.notificada = true;
                atualizado = true;
                
                wss.clients.forEach(c => {
                    if (c.readyState === 1) {
                        c.send(JSON.stringify({ type: 'jarvis-alert', text: `Lembrete de Tarefa: ${t.titulo}` }));
                    }
                });
            }
        }
    });

    if (atualizado) {
        await salvarTarefas(tarefas);
    }
}, 60000);
