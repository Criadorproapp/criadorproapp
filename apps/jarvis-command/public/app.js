// ==========================================
// JARVIS 11 - HUD CORE (app.js)
// AI: OpenAI | Vision: Optic V0.2 | HUD: SVG Waveform
// ==========================================

const chatHistory = document.getElementById('chat-history');
const chatInput   = document.getElementById('chat-input');
const btnSend     = document.getElementById('btn-send');
const fileTreeEl  = document.getElementById('file-tree');
const notePreviewEl = document.getElementById('note-preview');
const statusN8n   = document.getElementById('status-n8n');
const statusCore  = document.getElementById('status-core');
const statusObsidian = document.getElementById('status-obsidian');
const waveformContainer = document.getElementById('waveform-container');
const agentPopupsContainer = document.getElementById('agent-popups');

let socket;
let isSpeaking = false;
let waveBars = [];
let bioInterval;

// ---- Biometric Simulation ----
function startBiometrics() {
    bioInterval = setInterval(() => {
        const bpm = document.getElementById('bio-bpm');
        const temp = document.getElementById('bio-temp');
        if (bpm) bpm.textContent = Math.floor(70 + Math.random() * 10);
        if (temp) temp.textContent = (36.4 + Math.random() * 0.4).toFixed(1);
    }, 2000);
}

// ---- Waveform Initialization ----
function initWaveform() {
    if (!waveformContainer) return;
    waveformContainer.innerHTML = '';
    const numBars = 60;
    const radius = 180;
    const centerX = 250;
    const centerY = 250;

    for (let i = 0; i < numBars; i++) {
        const angle = (i * (360 / numBars)) * (Math.PI / 180);
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        bar.setAttribute("x", x);
        bar.setAttribute("y", y);
        bar.setAttribute("width", 2);
        bar.setAttribute("height", 10);
        bar.setAttribute("fill", "var(--primary)");
        bar.setAttribute("transform", `rotate(${i * (360/numBars)}, ${x}, ${y})`);
        bar.style.transition = "height 0.1s ease, opacity 0.5s ease";
        
        waveformContainer.appendChild(bar);
        waveBars.push(bar);
    }
    animateWaveform();
}

// ---- Hardware Toggle Logic (Signal from Server) ----
function handleHardwareSignal(device, state) {
    addMessage('system', `[ HARDWARE ] Comando recebido: ${device.toUpperCase()} -> ${state ? 'ON' : 'OFF'}`);
    if (device === 'camera') {
        const video = document.getElementById('camera-feed');
        const logo = document.getElementById('hud-logo');
        if (!state) {
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            video.style.opacity = '0';
            if (logo) logo.style.opacity = '1';
        } else {
            initOptics();
            video.style.opacity = '1';
            if (logo) logo.style.opacity = '0';
        }
    }
}

function animateWaveform() {
    waveBars.forEach((bar, i) => {
        // AMPLIFICAÇÃO MÁXIMA (Jarvis 11)
        const baseHeight = isSpeaking ? 100 : 15;
        const randomness = isSpeaking ? Math.random() * 120 : Math.random() * 5;
        const newHeight = baseHeight + randomness;
        
        bar.setAttribute("height", newHeight);
        bar.style.opacity = isSpeaking ? 1 : 0.3;
        
        if (isSpeaking) {
            bar.setAttribute("fill", "#fff");
        } else {
            bar.setAttribute("fill", "var(--primary)");
        }
    });

    // Pulso ambiental do HUD
    if (isSpeaking) {
        document.body.classList.add('ambient-pulse');
    } else {
        document.body.classList.remove('ambient-pulse');
    }

    requestAnimationFrame(() => setTimeout(animateWaveform, 60));
}

// ---- WebSocket Connection ----
function connectWS() {
    socket = new WebSocket(`ws://${window.location.host}`);

    socket.onopen = () => {
        addMessage('system', '[ JARVIS ] Protocolo de conexão Jarvis 11 estabilizado.');
        if (statusCore) statusCore.classList.add('online');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat-response') {
            addMessage('jarvis', data.text);
        } else if (data.type === 'hardware-control') {
            handleHardwareSignal(data.device, data.state);
        } else if (data.type === 'agent-response') {
            createAgentPopup(data.agent, data.response);
        } else if (data.type === 'vault-update') {
            refreshFileTree();
        }
    };

    socket.onclose = () => {
        addMessage('system', '[ ALERTA ] Conexão perdida. Reconfigurando...');
        setTimeout(connectWS, 3000);
    };
}

// ---- Chat Workflow ----
function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    const prefix = sender === 'user' ? '> ' : sender === 'jarvis' ? '[ JARVIS ] ' : '[ SYS ] ';
    msgDiv.textContent = prefix + text;
    chatHistory.appendChild(msgDiv);
    
    // Auto-scroll FORCE - Protocolo Mark 12
    requestAnimationFrame(() => {
        chatHistory.scrollTop = chatHistory.scrollHeight;
        const lastMsg = chatHistory.lastElementChild;
        if (lastMsg) lastMsg.scrollIntoView({ behavior: 'auto', block: 'end' });
    });

    if (sender === 'jarvis') speak(text);
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    addMessage('user', text);
    socket.send(JSON.stringify({ type: 'chat', text }));
    chatInput.value = '';
}

btnSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// ---- Dynamic Agent Popups (Sides) ----
function createAgentPopup(agentName, content) {
    const popup = document.createElement('div');
    popup.className = 'agent-popup';
    
    // Position randomly on left or right side based on user request (sides)
    const isLeft = Math.random() > 0.5;
    popup.style.top = (20 + Math.random() * 60) + 'vh';
    if (isLeft) {
        popup.style.left = '420px';
    } else {
        popup.style.right = '480px';
    }

    popup.innerHTML = `
        <div class="panel-header">
            <h2>🤖 ${agentName.toUpperCase()} DATA</h2>
            <button onclick="this.parentElement.parentElement.remove()">X</button>
        </div>
        <div style="font-size: 0.8rem; color: #fff; max-height: 200px; overflow-y: auto;">
            ${content}
        </div>
    `;
    agentPopupsContainer.appendChild(popup);
    
    // Auto-remove after 30s if not closed
    setTimeout(() => { if (popup.parentElement) popup.remove(); }, 30000);
}

// ---- Obsidian Logic ----
async function refreshFileTree() {
    try {
        const resp = await fetch('/api/vault/tree');
        const tree = await resp.json();
        renderTree(tree, fileTreeEl);
        if (statusObsidian) statusObsidian.classList.add('online');
    } catch (err) { console.warn('Vault offline'); }
}

function renderTree(nodes, container) {
    container.innerHTML = '';
    nodes.forEach(node => {
        const el = document.createElement('div');
        el.className = `file-item ${node.type}`;
        el.textContent = (node.type === 'dir' ? '📁 ' : '📄 ') + node.name;
        if (node.type === 'file') el.onclick = () => loadFile(node.path);
        container.appendChild(el);
    });
}

async function loadFile(filePath) {
    const resp = await fetch(`/api/vault/file?path=${encodeURIComponent(filePath)}`);
    const data = await resp.json();
    if (notePreviewEl) notePreviewEl.textContent = data.content;
}

// ---- Agent Trigger ----
window.triggerAgent = async function(agentId) {
    addMessage('system', `[ HUD ] Iniciando Protocolo ${agentId.toUpperCase()}...`);
    try {
        const resp = await fetch(`/api/agents/${agentId}/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: new Date().toISOString() })
        });
        const result = await resp.json();
        if (result.success) {
            createAgentPopup(agentId, result.data || "Protocolo em execução...");
        }
    } catch (err) { addMessage('system', `[ ERRO ] Agente offline.`); }
};

// ---- Voice (TTS) ----
function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const cleanText = text.replace(/[*_#\[\]()<>]/g, '').trim();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.onstart = () => { isSpeaking = true; };
    utterance.onend = () => { isSpeaking = false; };
    window.speechSynthesis.speak(utterance);
}

// ---- Voice (STT) ----
const RecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
if (RecognitionAPI) {
    const recognition = new RecognitionAPI();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        document.getElementById('btn-mic').classList.add('listening');
        addMessage('system', '[ MIC ] Escutando...');
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        chatInput.value = text;
        sendMessage();
    };

    recognition.onerror = (e) => {
        document.getElementById('btn-mic').classList.remove('listening');
        addMessage('system', `[ ERRO ] Microfone falhou: ${e.error}`);
    };

    recognition.onend = () => {
        document.getElementById('btn-mic').classList.remove('listening');
    };

    document.getElementById('btn-mic').onclick = () => {
        try {
            recognition.start();
        } catch(e) {
            recognition.stop();
        }
    };
} else {
    addMessage('system', '[ ALERTA ] Speech Recognition não suportado neste navegador.');
}

// ---- Vision (Optics) ----
function initOptics() {
    const video = document.getElementById('camera-feed');
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
        .then(stream => { video.srcObject = stream; })
        .catch(err => { addMessage('system', '[ ALERTA ] Falha nos sensores ópticos.'); });
}

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
    initWaveform();
    startBiometrics(); // Inicia biometria
    const btnInit = document.getElementById('btn-init');
    const bootOverlay = document.getElementById('boot-overlay');

    const logo = document.getElementById('hud-logo');
    if (logo) {
        logo.onerror = () => {
            addMessage('system', '[ ALERTA ] Falha ao carregar logo_criador_pro.png. Verifique o servidor.');
        };
    }

    if (btnInit) {
        btnInit.onclick = () => {
            bootOverlay.style.display = 'none';
            // Mostrar logo se câmera começar off (padrão)
            if (logo) logo.style.opacity = '1';
            
            // Sequência de Boot Imersiva Protocolo 12
            addMessage('system', '[ BOOT ] Inicializando Protocolo Mark 12...');
            setTimeout(() => addMessage('system', '[ BOOT ] Calibrando sensores ópticos e sonoros...'), 500);
            setTimeout(() => addMessage('system', '[ BOOT ] Mapeando unidades de disco locais (C:, E:)...'), 1000);
            setTimeout(() => addMessage('system', '[ BOOT ] Sincronizando rede neural com Obsidian...'), 1500);
            
            setTimeout(() => {
                initOptics();
                connectWS();
                refreshFileTree();
                speak("Protocolos Mark 12 estabilizados.");
                addMessage('system', '[ ATENÇÃO ] Verifique se você está em http://localhost:4200 para ver o Mark 12.');
            }, 2000);
        };
    }

    // MONITORAÇÃO DE SCROLL ULTRA-ROBUSTA
    const scrollObserver = new MutationObserver(() => {
        chatHistory.scrollTop = chatHistory.scrollHeight;
        const last = chatHistory.lastElementChild;
        if (last) last.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
    scrollObserver.observe(chatHistory, { childList: true, subtree: true });
});
