// GENETICS ENGINE FALLBACK DEFS FOR STANDALONE DEPLOYMENT
const GENETICS_RULES = window.GENETICS_RULES || {};
const RINGNECK_CATALOG = window.RINGNECK_CATALOG || [];
const SPECIES_ROADMAP = window.SPECIES_ROADMAP || [];
const calculateMultiLocus = window.calculateMultiLocus || (() => ({}));
const runValidationSuite = window.runValidationSuite || (() => ({}));

function __initPainel() {
    const galleryUrl = 'ringneck_mutations_gallery_1775852218576.png';
    const appConfig = window.CRIADOR_PRO_CONFIG || {};
    const hasSupabaseConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
    const hasSupabaseLib = Boolean(window.supabase && typeof window.supabase.createClient === 'function');
    const hasQrLib = typeof window.QRCode !== 'undefined';
    const hasPdfLib = Boolean(window.jspdf && typeof window.jspdf.jsPDF === 'function');

    let supabase = null;
    try {
        if (hasSupabaseConfig && hasSupabaseLib) {
            supabase = window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
        }
    } catch (error) {
        console.error('Falha ao iniciar o Supabase:', error);
    }

    const SpeciesMutations = {
        ringneck: ['Verde Ancestral', 'Azul Sky', 'Cinza', 'Lutino', 'Albino', 'Opalino', 'Cleartail', 'Violeta SF', 'Índigo', 'Cobalto', 'Violeta DF'],
        calopsita: ['Cinza', 'Lutino', 'Arlequim', 'Cara Branca', 'Canela', 'Pérola', 'Albino']
    };

    const ringneckGenetica = {
        'Verde Ancestral': { blue: 0, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 0, splitBlue: false },
        'Azul Sky': { blue: 2, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 0, splitBlue: false },
        'Cinza': { blue: 0, ino: 0, grey: 2, opaline: 0, indigo: 0, violet: 0 },
        'Lutino': { blue: 0, ino: 2, grey: 0, opaline: 0, indigo: 0, violet: 0 },
        'Albino': { blue: 2, ino: 2, grey: 0, opaline: 0, indigo: 0, violet: 0 },
        'Opalino': { blue: 0, ino: 0, grey: 0, opaline: 2, indigo: 0, violet: 0 },
        'Índigo': { blue: 0, ino: 0, grey: 0, opaline: 0, indigo: 2, violet: 0 },
        'Cobalto': { blue: 1, ino: 0, grey: 0, opaline: 0, indigo: 2, violet: 0 },
        'Violeta SF': { blue: 1, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 1 },
        'Violeta DF': { blue: 2, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 2 },
        'Cleartail': { blue: 0, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 0, cleartail: 2 }
    };

    const calopsitaGenetica = {
        'Cinza': { ino: 0, cb: 0, canela: 0, opaline: 0 },
        'Lutino': { ino: 2, cb: 0, canela: 0, opaline: 0 },
        'Arlequim': { ino: 0, cb: 0, canela: 0, opaline: 2 },
        'Cara Branca': { ino: 0, cb: 2, canela: 0, opaline: 0 },
        'Canela': { ino: 0, cb: 0, canela: 2, opaline: 0 },
        'Pérola': { ino: 0, cb: 0, canela: 0, opaline: 1 },
        'Albino': { ino: 2, cb: 2, canela: 0, opaline: 0 }
    };

    const loginOverlay = document.getElementById('login-overlay');
    const __appContainer = document.querySelector('.app-container');

    // MÁXIMA PRIORIDADE: Bypass do login em modo local/desenvolvimento
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (__appContainer) __appContainer.style.display = 'flex';

    try {
        const appContainer = document.querySelector('.app-container');
        const loginError = document.getElementById('login-error');
    const userNameDisplay = document.getElementById('user-name-display');
    let isSignupMode = false;
    let selectedRecintoId = null;
    let selectedAveId = null;
    const routeParams = new URLSearchParams(window.location.search);
    const pendingRouteModule = routeParams.get('module');
    const pendingRouteRecinto = routeParams.get('recinto');

    const safeParse = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`Não foi possível ler ${key} do armazenamento local.`, error);
            return fallback;
        }
    };

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const formatCurrency = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatDateBr = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '—';
    const parseWholeNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0;
    };

    const sanitizeImageUrl = (value) => {
        if (!value) return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        if (/^data:image\//i.test(trimmed)) return trimmed;
        try {
            const parsed = new URL(trimmed, window.location.href);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
        } catch {
            return '';
        }
    };
    const sanitizeHttpUrl = (value) => {
        if (!value) return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        try {
            const parsed = new URL(trimmed, window.location.href);
            return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
        } catch {
            return '';
        }
    };
    const normalizeAve = (ave) => ({
        id: ave.id || createId('AVE'),
        anilha: ave.anilha || '',
        especie: ave.especie || 'Ringneck',
        mutacao: ave.mutacao || '',
        sexo: ave.sexo || 'Indefinido',
        categoria: ave.categoria || 'Plantel',
        status: ave.status || 'Ativo',
        nascimento: ave.nascimento || '',
        recinto: ave.recinto || ave.recinto_id || '',
        pai_anilha: ave.pai_anilha || ave.pai || '',
        mae_anilha: ave.mae_anilha || ave.mae || '',
        foto_url: ave.foto_url || ave.foto || ''
    });

    const normalizeRecinto = (recinto) => ({
        id: recinto.id || createId('REC'),
        nome: recinto.nome || 'Recinto sem nome',
        ala: recinto.ala || recinto.tipo || 'Ala de Matrizes',
        tipo_comp: recinto.tipo_comp || 'Gaiola Convencional',
        qtd_comp: Number(recinto.qtd_comp || 1),
        dimensoes: recinto.dimensoes || '100cm x 60cm x 60cm',
        anilha_casal: recinto.anilha_casal || '',
        descricao: recinto.descricao || ''
    });

    const normalizeOvo = (ovo) => ({
        id: ovo.id || createId('OVO'),
        codigo: ovo.codigo || `OVO-${Date.now().toString().slice(-4)}`,
        recinto_id: ovo.recinto_id || '',
        pai_anilha: ovo.pai_anilha || '',
        mae_anilha: ovo.mae_anilha || '',
        data_postura: ovo.data_postura || new Date().toISOString().split('T')[0],
        data_incubacao: ovo.data_incubacao || new Date().toISOString().split('T')[0],
        status: ovo.status || 'Em Incubação'
    });

    const normalizeFilhoteUti = (filhote) => ({
        id: filhote.id || createId('UTI'),
        anilha: filhote.anilha || `FILHOTE-${Date.now().toString().slice(-4)}`,
        especie: filhote.especie || 'Ringneck',
        nascimento: filhote.nascimento || new Date().toISOString().split('T')[0],
        peso_inicial: Number(filhote.peso_inicial || 15),
        pai_anilha: filhote.pai_anilha || '',
        mae_anilha: filhote.mae_anilha || '',
        pesagens: Array.isArray(filhote.pesagens) ? filhote.pesagens : [],
        status: filhote.status || 'Em Tratagem'
    });

    const normalizeInsumo = (insumo) => ({
        id: insumo.id || createId('INS'),
        nome: insumo.nome || 'Insumo sem nome',
        categoria: insumo.categoria || 'Extrusada',
        qtd: Number(insumo.qtd || 0),
        minimo: Number(insumo.minimo || 2),
        fornecedor: insumo.fornecedor || 'Não informado',
        validade: insumo.validade || ''
    });

    const normalizeCardapio = (cardapio) => ({
        id: cardapio.id || createId('CAR'),
        nome: cardapio.nome || 'Cardápio Padrão',
        recinto_id: cardapio.recinto_id || '',
        ingredientes: cardapio.ingredientes || 'Extrusada + Farinhada',
        frequencia: cardapio.frequencia || 'Diário (2x ao dia)',
        horario: cardapio.horario || '07:30 e 15:00'
    });

    const normalizeEscalaManejo = (escala) => ({
        id: escala.id || createId('ESC'),
        recinto_id: escala.recinto_id || '',
        turno: escala.turno || 'Manhã (07:00)',
        tratador: escala.tratador || 'Não informado',
        limpador: escala.limpador || 'Não informado',
        status_trato: escala.status_trato || 'Pendente',
        status_limpeza: escala.status_limpeza || 'Pendente'
    });

    const normalizeQuarentena = (q) => ({
        id: q.id || createId('QUA'),
        anilha: q.anilha || 'N/I',
        especie_mutacao: q.especie_mutacao || 'Ringneck',
        origem: q.origem || 'Criatório Externo',
        recinto_id: q.recinto_id || '',
        gta: q.gta || 'N/A',
        nf: q.nf || 'N/A',
        data_chegada: q.data_chegada || new Date().toISOString().split('T')[0],
        data_alta: q.data_alta || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prontuario: q.prontuario || 'Em observação clínica de biossegurança.',
        doc_url: q.doc_url || '',
        status: q.status || 'Em Quarentena'
    });

    const normalizeEnfermaria = (e) => ({
        id: e.id || createId('ENF'),
        anilha: e.anilha || 'N/I',
        recinto_id: e.recinto_id || '',
        diagnostico: e.diagnostico || 'Suspeita clínica',
        medicamento: e.medicamento || 'Vitamina / Suplementação',
        dosagem: e.dosagem || 'Conforme bula',
        dias: Number(e.dias || 7),
        responsavel: e.responsavel || 'Veterinário',
        data_internacao: e.data_internacao || new Date().toISOString().split('T')[0],
        status: e.status || 'Em Tratamento'
    });

    const normalizeSaida = (s) => ({
        id: s.id || createId('SAI'),
        anilha: s.anilha || 'N/I',
        destino: s.destino || 'Comprador Final',
        data_transporte: s.data_transporte || new Date().toISOString().split('T')[0],
        gta: s.gta || 'Emitida',
        chk_gta: Boolean(s.chk_gta ?? true),
        chk_nf: Boolean(s.chk_nf ?? true),
        chk_cert: Boolean(s.chk_cert ?? true),
        chk_laudo: Boolean(s.chk_laudo ?? true),
        foto_url: s.foto_url || '',
        status: s.status || 'Pronto para Envio'
    });

    const normalizeFinanca = (financa) => ({
        id: financa.id || createId('FIN'),
        tipo: financa.tipo || 'entrada',
        descricao: financa.descricao || '',
        valor: Number(financa.valor || 0),
        data: financa.data || ''
    });

    const downloadBlob = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getRecintoNotesMap = () => safeParse('cp_recinto_notes', {});
    const saveRecintoNotesMap = (map) => localStorage.setItem('cp_recinto_notes', JSON.stringify(map));

    const getRecintoNotes = (recintoId) => {
        const map = getRecintoNotesMap();
        const items = Array.isArray(map[recintoId]) ? map[recintoId] : [];
        return items.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    };

    const addRecintoNote = (recintoId, note) => {
        const map = getRecintoNotesMap();
        const items = Array.isArray(map[recintoId]) ? map[recintoId] : [];
        items.push({
            id: createId('NOTE'),
            date: note.date || new Date().toISOString().split('T')[0],
            type: note.type || 'Observacao',
            text: note.text || ''
        });
        map[recintoId] = items;
        saveRecintoNotesMap(map);
    };

    const removeRecintoNote = (recintoId, noteId) => {
        const map = getRecintoNotesMap();
        const items = Array.isArray(map[recintoId]) ? map[recintoId] : [];
        map[recintoId] = items.filter((item) => item.id !== noteId);
        saveRecintoNotesMap(map);
    };

    const getAveDossierMap = () => safeParse('cp_ave_dossier', {});
    const saveAveDossierMap = (map) => localStorage.setItem('cp_ave_dossier', JSON.stringify(map));

    const buildDefaultDossier = () => ({
        base: {
            pai_anilha: '',
            mae_anilha: '',
            linhagem: '',
            matriz_status: 'Nao definido'
        },
        historico: [],
        exames: [],
        fotos: [],
        temporadas: []
    });

    const getAveDossier = (aveId) => {
        const map = getAveDossierMap();
        const raw = map[aveId] || buildDefaultDossier();
        return {
            base: {
                pai_anilha: raw.base?.pai_anilha || '',
                mae_anilha: raw.base?.mae_anilha || '',
                linhagem: raw.base?.linhagem || '',
                matriz_status: raw.base?.matriz_status || 'Nao definido'
            },
            historico: Array.isArray(raw.historico) ? raw.historico : [],
            exames: Array.isArray(raw.exames) ? raw.exames : [],
            fotos: Array.isArray(raw.fotos) ? raw.fotos : [],
            temporadas: Array.isArray(raw.temporadas) ? raw.temporadas : []
        };
    };

    const updateAveDossier = (aveId, mutator) => {
        const map = getAveDossierMap();
        const dossier = map[aveId] || buildDefaultDossier();
        mutator(dossier);
        map[aveId] = dossier;
        saveAveDossierMap(map);
    };

    const removeAveDossier = (aveId) => {
        const map = getAveDossierMap();
        delete map[aveId];
        saveAveDossierMap(map);
    };

    class StorageService {
        constructor() {
            this.config = safeParse('cp_config', { responsavel: 'Pingo D\'Ouro' });
            this.aves = safeParse('cp_aves', []).map(normalizeAve);
            this.recintos = safeParse('cp_recintos', []).map(normalizeRecinto);
            this.financas = safeParse('cp_financas', []).map(normalizeFinanca);
            this.ovos = safeParse('cp_ovos', []).map(normalizeOvo);
            this.uti_filhotes = safeParse('cp_uti_filhotes', []).map(normalizeFilhoteUti);
            this.estoque_alimentos = safeParse('cp_estoque_alimentos', []).map(normalizeInsumo);
            this.cardapios_recinto = safeParse('cp_cardapios_recinto', []).map(normalizeCardapio);
            this.escala_manejo = safeParse('cp_escala_manejo', []).map(normalizeEscalaManejo);
            this.quarentena_registros = safeParse('cp_quarentena_registros', []).map(normalizeQuarentena);
            this.enfermaria_registros = safeParse('cp_enfermaria_registros', []).map(normalizeEnfermaria);
            this.saida_registros = safeParse('cp_saida_registros', []).map(normalizeSaida);
            this.perfil = safeParse('cp_perfil', {});
            this.session = null;
            this.initMockData();
        }

        saveConfig() { localStorage.setItem('cp_config', JSON.stringify(this.config)); }
        saveAves() { localStorage.setItem('cp_aves', JSON.stringify(this.aves)); }
        saveRecintos() { localStorage.setItem('cp_recintos', JSON.stringify(this.recintos)); }
        saveFinancas() { localStorage.setItem('cp_financas', JSON.stringify(this.financas)); }
        saveOvos() { localStorage.setItem('cp_ovos', JSON.stringify(this.ovos)); }
        saveUtiFilhotes() { localStorage.setItem('cp_uti_filhotes', JSON.stringify(this.uti_filhotes)); }
        saveEstoqueAlimentos() { localStorage.setItem('cp_estoque_alimentos', JSON.stringify(this.estoque_alimentos)); }
        saveCardapiosRecinto() { localStorage.setItem('cp_cardapios_recinto', JSON.stringify(this.cardapios_recinto)); }
        saveEscalaManejo() { localStorage.setItem('cp_escala_manejo', JSON.stringify(this.escala_manejo)); }
        saveQuarentenaRegistros() { localStorage.setItem('cp_quarentena_registros', JSON.stringify(this.quarentena_registros)); }
        saveEnfermariaRegistros() { localStorage.setItem('cp_enfermaria_registros', JSON.stringify(this.enfermaria_registros)); }
        saveSaidaRegistros() { localStorage.setItem('cp_saida_registros', JSON.stringify(this.saida_registros)); }
        savePerfil() { localStorage.setItem('cp_perfil', JSON.stringify(this.perfil)); }

        initMockData() {
            if (this.aves.length === 0) {
                this.aves = [
                    normalizeAve({ id: '1', anilha: 'RN-2024-001', especie: 'Ringneck', mutacao: 'Azul Sky', sexo: 'Macho', status: 'Ativo', nascimento: '2024-01-15', recinto: 'R1' }),
                    normalizeAve({ id: '2', anilha: 'RN-2024-002', especie: 'Ringneck', mutacao: 'Verde Ancestral', sexo: 'Fêmea', status: 'Ativo', nascimento: '2024-02-10', recinto: 'R1' }),
                    normalizeAve({ id: '3', anilha: 'CAL-2023-442', especie: 'Calopsita', mutacao: 'Pérola', sexo: 'Fêmea', status: 'Ativo', nascimento: '2023-06-20', recinto: 'R2' })
                ];
                this.saveAves();
            }
            if (this.recintos.length === 0) {
                this.recintos = [
                    normalizeRecinto({ id: 'R1', nome: 'Viveiro Matrizes A', tipo: 'Matrizes', descricao: 'Aves em reprodução ativa' }),
                    normalizeRecinto({ id: 'R2', nome: 'Voadeira Filhotes', tipo: 'Filhotes', descricao: 'Recinto de sociabilização' }),
                    normalizeRecinto({ id: 'R3', nome: 'Setor Quarentena', tipo: 'Quarentena', descricao: 'Isolamento preventivo' })
                ];
                this.saveRecintos();
            }
            if (this.financas.length === 0) {
                this.financas = [
                    normalizeFinanca({ id: 'F1', tipo: 'entrada', descricao: 'Venda RN Azul Sky', valor: 1200, data: '2024-03-01' }),
                    normalizeFinanca({ id: 'F2', tipo: 'saida', descricao: 'Ração mensal', valor: 350, data: '2024-03-05' }),
                    normalizeFinanca({ id: 'F3', tipo: 'entrada', descricao: 'Venda Calopsita Pérola', valor: 450, data: '2024-03-12' }),
                    normalizeFinanca({ id: 'F4', tipo: 'saida', descricao: 'Medicamentos', valor: 180, data: '2024-03-18' })
                ];
                this.saveFinancas();
            }
            if (this.estoque_alimentos.length === 0) {
                this.estoque_alimentos = [
                    normalizeInsumo({ id: 'INS1', nome: 'Extrusada High-Protein MegaZoo 10kg', categoria: 'Extrusada', qtd: 12, minimo: 3, fornecedor: 'MegaZoo', validade: '2026-11-20' }),
                    normalizeInsumo({ id: 'INS2', nome: 'Farinhada Cede com Ovo 5kg', categoria: 'Farinhada', qtd: 1.5, minimo: 2, fornecedor: 'Cede Impex', validade: '2026-09-15' }),
                    normalizeInsumo({ id: 'INS3', nome: 'Mistura Sementes Nobres Ringneck 15kg', categoria: 'Sementes', qtd: 18, minimo: 5, fornecedor: 'Rei dos Pássaros', validade: '2027-01-10' }),
                    normalizeInsumo({ id: 'INS4', nome: 'Maravalha Eucalipto Tratada 20kg', categoria: 'Higiene / Maravalha', qtd: 0.5, minimo: 1, fornecedor: 'AgroBio', validade: '2028-12-31' })
                ];
                this.saveEstoqueAlimentos();
            }
            if (this.cardapios_recinto.length === 0) {
                this.cardapios_recinto = [
                    normalizeCardapio({ id: 'CAR1', nome: 'Dieta Reprodutiva Matrizes Ringneck', recinto_id: 'R1', ingredientes: '60% Extrusada High-Protein + 20% Farinhada + 20% Maçã e Couve', frequencia: 'Diário (2x ao dia)', horario: '07:30 e 15:00' }),
                    normalizeCardapio({ id: 'CAR2', nome: 'Dieta Crescimento Filhotes Voadeira', recinto_id: 'R2', ingredientes: '50% Extrusada + 30% Sementes Nobres + 20% Milho Verde', frequencia: 'Diário (Manhã)', horario: '08:00' })
                ];
                this.saveCardapiosRecinto();
            }
        }
        applyProfile() {
            if (this.perfil.nome_criatorio && userNameDisplay) {
                userNameDisplay.textContent = this.perfil.nome_criatorio;
                const sidebarLogo = document.querySelector('.sidebar-header .logo');
                if (sidebarLogo) {
                    const [firstWord, ...rest] = this.perfil.nome_criatorio.split(' ');
                    sidebarLogo.innerHTML = `🧬 ${escapeHtml(firstWord || 'Criador')}<span>${escapeHtml(rest.join(' '))}</span>`;
                }
            }

            const preview = document.getElementById('logo-preview');
            if (preview) {
                preview.replaceChildren();
                const logoUrl = sanitizeImageUrl(this.perfil.logo_url);
                if (logoUrl) {
                    const image = document.createElement('img');
                    image.src = logoUrl;
                    image.alt = 'Logo do criatório';
                    image.loading = 'lazy';
                    image.addEventListener('error', () => {
                        preview.textContent = 'Logo inválida';
                    });
                    preview.appendChild(image);
                } else {
                    const placeholder = document.createElement('span');
                    placeholder.textContent = 'SVG/PNG Logo';
                    preview.appendChild(placeholder);
                }
            }
        }

        async syncWithCloud() {
            if (!supabase || !this.session?.user?.id) return;
            const userId = this.session.user.id;
            try {
                const [avesResp, recintosResp, financasResp, perfilResp] = await Promise.all([
                    supabase.from('aves').select('*').eq('user_id', userId),
                    supabase.from('recintos').select('*').eq('user_id', userId),
                    supabase.from('financas').select('*').eq('user_id', userId),
                    supabase.from('perfil_criatorio').select('*').eq('user_id', userId).maybeSingle()
                ]);

                if (Array.isArray(avesResp.data) && avesResp.data.length) {
                    this.aves = avesResp.data.map(normalizeAve);
                    this.saveAves();
                }
                if (Array.isArray(recintosResp.data) && recintosResp.data.length) {
                    this.recintos = recintosResp.data.map(normalizeRecinto);
                    this.saveRecintos();
                }
                if (Array.isArray(financasResp.data) && financasResp.data.length) {
                    this.financas = financasResp.data.map(normalizeFinanca);
                    this.saveFinancas();
                }
                if (perfilResp.data) {
                    this.perfil = perfilResp.data;
                    this.savePerfil();
                    this.applyProfile();
                }
            } catch (error) {
                console.error('Erro na sincronização com a nuvem:', error);
            }
        }

        async updatePerfil(data) {
            this.perfil = { ...this.perfil, ...data };
            this.config = { ...this.config, responsavel: data.responsavel || this.config.responsavel };
            this.savePerfil();
            this.saveConfig();
            this.applyProfile();

            if (supabase && this.session?.user?.id) {
                try {
                    await supabase.from('perfil_criatorio').upsert({
                        user_id: this.session.user.id,
                        ...this.perfil,
                        updated_at: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Não foi possível salvar o perfil na nuvem.', error);
                }
            }
        }

        async addAve(ave) {
            const localAve = normalizeAve({ id: createId('AVE'), status: 'Ativo', ...ave });
            this.aves.push(localAve);
            this.saveAves();

            if (supabase && this.session?.user?.id) {
                try {
                    await supabase.from('aves').insert([{
                        anilha: localAve.anilha,
                        especie: localAve.especie,
                        mutacao: localAve.mutacao,
                        sexo: localAve.sexo,
                        categoria: localAve.categoria,
                        status: localAve.status,
                        nascimento: localAve.nascimento || null,
                        recinto_id: localAve.recinto || null,
                        user_id: this.session.user.id
                    }]);
                    await this.syncWithCloud();
                } catch (error) {
                    console.error('Não foi possível sincronizar a ave com a nuvem.', error);
                }
            }
            return localAve;
        }

        async removeAve(id) {
            const ave = this.aves.find((item) => item.id === id);
            this.aves = this.aves.filter((item) => item.id !== id);
            this.saveAves();
            removeAveDossier(id);

            if (supabase && this.session?.user?.id && ave?.anilha) {
                try {
                    await supabase.from('aves').delete().eq('user_id', this.session.user.id).eq('anilha', ave.anilha);
                } catch (error) {
                    console.error('Não foi possível remover a ave na nuvem.', error);
                }
            }
        }

        async addRecinto(recinto) {
            const localRecinto = normalizeRecinto({ id: createId('REC'), ...recinto });
            this.recintos.push(localRecinto);
            this.saveRecintos();
            return localRecinto;
        }

        async removeRecinto(id) {
            this.recintos = this.recintos.filter((item) => item.id !== id);
            this.aves = this.aves.map((ave) => ave.recinto === id ? { ...ave, recinto: '' } : ave);
            this.saveRecintos();
            this.saveAves();
        }

        async addFinanca(financa) {
            const localFinanca = normalizeFinanca({ id: createId('FIN'), ...financa });
            this.financas.push(localFinanca);
            this.saveFinancas();
            return localFinanca;
        }

        async removeFinanca(id) {
            this.financas = this.financas.filter((item) => item.id !== id);
            this.saveFinancas();
        }

        async addOvo(ovoData) {
            const localOvo = normalizeOvo({ id: createId('OVO'), ...ovoData });
            this.ovos.push(localOvo);
            this.saveOvos();
            return localOvo;
        }

        async removeOvo(id) {
            this.ovos = this.ovos.filter((item) => item.id !== id);
            this.saveOvos();
        }

        async addFilhoteUti(filhoteData) {
            const localFilhote = normalizeFilhoteUti({ id: createId('UTI'), ...filhoteData });
            this.uti_filhotes.push(localFilhote);
            this.saveUtiFilhotes();
            return localFilhote;
        }

        async removeFilhoteUti(id) {
            this.uti_filhotes = this.uti_filhotes.filter((item) => item.id !== id);
            this.saveUtiFilhotes();
        }

        async addPesoFilhote(filhoteId, pesoData) {
            const filhote = this.uti_filhotes.find((f) => f.id === filhoteId);
            if (!filhote) return;
            if (!Array.isArray(filhote.pesagens)) filhote.pesagens = [];
            filhote.pesagens.push({
                id: createId('PESO'),
                data: pesoData.data || new Date().toISOString().split('T')[0],
                valor: Number(pesoData.valor || 0),
                papo: pesoData.papo || 'Cheio',
                obs: pesoData.obs || ''
            });
            this.saveUtiFilhotes();
        }

        async addInsumo(insumoData) {
            const localInsumo = normalizeInsumo({ id: createId('INS'), ...insumoData });
            this.estoque_alimentos.push(localInsumo);
            this.saveEstoqueAlimentos();
            return localInsumo;
        }

        async removeInsumo(id) {
            this.estoque_alimentos = this.estoque_alimentos.filter((item) => item.id !== id);
            this.saveEstoqueAlimentos();
        }

        async addCardapio(cardapioData) {
            const localCardapio = normalizeCardapio({ id: createId('CAR'), ...cardapioData });
            this.cardapios_recinto.push(localCardapio);
            this.saveCardapiosRecinto();
            return localCardapio;
        }

        async removeCardapio(id) {
            this.cardapios_recinto = this.cardapios_recinto.filter((item) => item.id !== id);
            this.saveCardapiosRecinto();
        }

        async addEscalaManejo(escalaData) {
            const localEscala = normalizeEscalaManejo({ id: createId('ESC'), ...escalaData });
            this.escala_manejo.push(localEscala);
            this.saveEscalaManejo();
            return localEscala;
        }

        async removeEscalaManejo(id) {
            this.escala_manejo = this.escala_manejo.filter((item) => item.id !== id);
            this.saveEscalaManejo();
        }

        async addQuarentena(data) {
            const local = normalizeQuarentena({ id: createId('QUA'), ...data });
            this.quarentena_registros.push(local);
            this.saveQuarentenaRegistros();
            return local;
        }

        async removeQuarentena(id) {
            this.quarentena_registros = this.quarentena_registros.filter((item) => item.id !== id);
            this.saveQuarentenaRegistros();
        }

        async addEnfermaria(data) {
            const local = normalizeEnfermaria({ id: createId('ENF'), ...data });
            this.enfermaria_registros.push(local);
            this.saveEnfermariaRegistros();
            return local;
        }

        async removeEnfermaria(id) {
            this.enfermaria_registros = this.enfermaria_registros.filter((item) => item.id !== id);
            this.saveEnfermariaRegistros();
        }

        async addSaida(data) {
            const local = normalizeSaida({ id: createId('SAI'), ...data });
            this.saida_registros.push(local);
            this.saveSaidaRegistros();
            return local;
        }

        async removeSaida(id) {
            this.saida_registros = this.saida_registros.filter((item) => item.id !== id);
            this.saveSaidaRegistros();
        }

        getTotais() {
            const total = this.aves.length;
            const machos = this.aves.filter((ave) => ave.sexo === 'Macho').length;
            const femeas = this.aves.filter((ave) => ave.sexo === 'Fêmea').length;
            const pares = Math.min(machos, femeas);
            const entradas = this.financas.filter((item) => item.tipo === 'entrada').reduce((sum, item) => sum + Number(item.valor || 0), 0);
            const saidas = this.financas.filter((item) => item.tipo === 'saida').reduce((sum, item) => sum + Number(item.valor || 0), 0);
            return { total, machos, femeas, pares, entradas, saidas, saldo: entradas - saidas };
        }
    }

    const renderDashboard = () => {
        const totals = DB.getTotais();
        const dashAves = document.getElementById('dash-aves');
        const dashPares = document.getElementById('dash-pares');
        const dashSaldo = document.getElementById('dash-saldo');
        const dashRecintos = document.getElementById('dash-recintos');
        
        if (dashAves) dashAves.textContent = String(totals.total);
        if (dashPares) dashPares.textContent = String(totals.pares);
        if (dashSaldo) dashSaldo.textContent = formatCurrency(totals.saldo);
        if (dashRecintos) dashRecintos.textContent = String(DB.recintos.length);

        const tbody = document.getElementById('dash-recent-table');
        if (tbody) {
            const recentes = DB.aves.slice(-5).reverse();
            if (recentes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhuma ave cadastrada ainda.</td></tr>';
            } else {
                tbody.innerHTML = recentes.map(ave => `
                    <tr>
                        <td><strong>${escapeHtml(ave.anilha)}</strong></td>
                        <td>${escapeHtml(ave.especie)}</td>
                        <td>${escapeHtml(ave.mutacao)}</td>
                        <td>${ave.sexo === 'Macho' ? '♂️ Macho' : ave.sexo === 'Fêmea' ? '♀️ Fêmea' : '❓ Indefinido'}</td>
                        <td><span class="badge-pill badge-emerald">${escapeHtml(ave.status)}</span></td>
                    </tr>
                `).join('');
            }
        }
    };

    const renderFinanceiro = () => {
        const totals = DB.getTotais();
        const entradasEl = document.getElementById('fin-entradas');
        const saidasEl = document.getElementById('fin-saidas');
        const saldoEl = document.getElementById('fin-saldo');
        if (entradasEl) entradasEl.textContent = formatCurrency(totals.entradas);
        if (saidasEl) saidasEl.textContent = formatCurrency(totals.saidas);
        if (saldoEl) saldoEl.textContent = formatCurrency(totals.saldo);

        const tbody = document.querySelector('#fin-table tbody');
        if (!tbody) return;

        tbody.innerHTML = DB.financas.map((item) => {
            const isEntrada = item.tipo === 'entrada';
            const color = isEntrada ? '#10b981' : '#f43f5e';
            const symbol = isEntrada ? '▲' : '▼';
            return `
                <tr>
                    <td>${formatDateBr(item.data)}</td>
                    <td><span class="badge-pill ${isEntrada ? 'badge-emerald' : 'badge-amber'}" style="${!isEntrada ? 'background:rgba(244,63,94,0.12);color:#f43f5e;border:1px solid rgba(244,63,94,0.3);' : ''}">${symbol} ${isEntrada ? 'Receita' : 'Despesa'}</span></td>
                    <td><strong>${escapeHtml(item.descricao)}</strong></td>
                    <td style="color:${color}; font-weight:700;">${formatCurrency(item.valor)}</td>
                    <td><button class="btn-delete-financa" data-id="${escapeHtml(item.id)}" style="background:transparent;border:none;cursor:pointer;" title="Remover">❌</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-financa').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este lançamento financeiro?')) return;
                await DB.removeFinanca(id);
                renderFinanceiro();
                renderDashboard();
            });
        });
    };

    const updateMarketingSelect = () => {
        const mktSelect = document.getElementById('mkt-select-ave');
        if (!mktSelect) return;
        const currentVal = mktSelect.value;
        mktSelect.innerHTML = '<option value="">— Selecionar Ave do Plantel —</option>' +
            DB.aves.map(ave => `
                <option value="${escapeHtml(ave.id)}">
                    [${escapeHtml(ave.anilha)}] ${escapeHtml(ave.especie)} - ${escapeHtml(ave.mutacao)} (${ave.sexo})
                </option>
            `).join('');
        mktSelect.value = currentVal;
    };

    const generateMarketingAd = (aveData) => {
        const especie = document.getElementById('mkt-especie')?.value || aveData?.especie || 'Ringneck';
        const mutacao = document.getElementById('mkt-mutacao')?.value.trim() || aveData?.mutacao || especie;
        const pai = aveData?.pai_anilha ? `Pai: ${aveData.pai_anilha}` : '';
        const mae = aveData?.mae_anilha ? `Mãe: ${aveData.mae_anilha}` : '';
        const pedigreeInfo = (pai || mae) ? `\n🧬 Genética de Matrizes: ${[pai, mae].filter(Boolean).join(' | ')}` : '';
        const foto = aveData?.foto_url || document.getElementById('add-foto-url')?.value || '';
        
        const fotoHtml = foto ? `<div style="margin-bottom:1rem; text-align:center;"><img src="${escapeHtml(foto)}" alt="Ave Anúncio" style="max-height:220px; border-radius:12px; border:2px solid var(--primary); box-shadow:var(--shadow-main);"></div>` : '';

        const resultBox = document.getElementById('mkt-result');
        if (!resultBox) return;

        resultBox.innerHTML = `
            <div class="glass-card" style="border-color:var(--primary); background:rgba(15, 23, 42, 0.85);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h4 style="font-family:'Outfit',sans-serif; color:var(--primary);">📢 Anúncio Gerado para Redes Sociais</h4>
                    <button class="btn-ui btn-ui-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="navigator.clipboard.writeText(document.getElementById('mkt-text-copy').innerText); alert('Texto do anúncio copiado!');">📋 Copiar Texto</button>
                </div>
                ${fotoHtml}
                <div id="mkt-text-copy" style="white-space:pre-wrap; font-size:0.92rem; background:rgba(0,0,0,0.3); padding:1.25rem; border-radius:12px; border:1px solid var(--border-glass-bright);">
PARABÉNS! SEU ANÚNCIO FOI GERADO COM SUCESSO:

🦜 **ESPECIALMENTE DISPONÍVEL NO PLANTEL**

Variedade / Mutação: **${escapeHtml(mutacao)}**
Espécie: **${escapeHtml(especie)}**${pedigreeInfo}

✨ Ave de linhagem selecionada, criada com manejo técnico de alta performance e acompanhamento sanitário rigoroso.
✅ Acompanha anilha oficial, histórico sanitário e atestado de saúde.

🚀 **Entrega com transporte aéreo especializado para todo o Brasil.**

📩 *Interessados entrar em contato pelo Direct/WhatsApp para reservas.*
#CriadorPro #${escapeHtml(especie.replace(/\s/g, ''))} #${escapeHtml(mutacao.replace(/\s/g, ''))} #AvesExoticas #Ornitologia
                </div>
            </div>
        `;
    };

    const renderPlantel = () => {
        const tbody = document.querySelector('#plantel-table tbody');
        if (!tbody) return;

        const query = (document.getElementById('busca-plantel')?.value || '').trim().toLowerCase();
        const avesFiltradas = DB.aves.filter((ave) => 
            [ave.anilha, ave.especie, ave.mutacao, ave.sexo, ave.pai_anilha, ave.mae_anilha].join(' ').toLowerCase().includes(query)
        );

        if (avesFiltradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">Nenhuma ave encontrada no plantel.</td></tr>';
            return;
        }

        tbody.innerHTML = avesFiltradas.map((ave) => {
            const recNome = DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || '—';
            const sexoLabel = ave.sexo === 'Macho' ? '♂️ Macho' : ave.sexo === 'Fêmea' ? '♀️ Fêmea' : '❓ Indefinido';
            const fotoImg = ave.foto_url
                ? `<img src="${escapeHtml(ave.foto_url)}" alt="${escapeHtml(ave.anilha)}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">`
                : `<div style="width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🦜</div>`;
            const pedigree = (ave.pai_anilha || ave.mae_anilha)
                ? `<small style="color:var(--text-secondary);">♂️ Pai: <strong>${escapeHtml(ave.pai_anilha || '—')}</strong><br>♀️ Mãe: <strong>${escapeHtml(ave.mae_anilha || '—')}</strong></small>`
                : '<span style="color:var(--text-muted); font-size:0.8rem;">Não informado</span>';

            return `
                <tr>
                    <td>${fotoImg}</td>
                    <td><strong>${escapeHtml(ave.anilha)}</strong></td>
                    <td>${escapeHtml(ave.especie)}</td>
                    <td><span class="badge-pill badge-amber">${escapeHtml(ave.mutacao)}</span></td>
                    <td>${sexoLabel}</td>
                    <td>${pedigree}</td>
                    <td><span class="badge-pill badge-cyan">${escapeHtml(recNome)}</span></td>
                    <td><span class="badge-pill badge-emerald">${escapeHtml(ave.status)}</span></td>
                    <td>
                        <button class="btn-mkt-ave" data-id="${escapeHtml(ave.id)}" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;margin-right:6px;" title="Criar Anúncio de Marketing">📢</button>
                        <button class="btn-delete-ave" data-id="${escapeHtml(ave.id)}" style="background:transparent;border:none;cursor:pointer;font-size:1.1rem;" title="Remover Ave">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-ave').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover esta ave do plantel?')) return;
                await DB.removeAve(id);
                renderPlantel();
                renderDashboard();
                renderRecintos();
                updateMarketingSelect();
            });
        });

        tbody.querySelectorAll('.btn-mkt-ave').forEach((button) => {
            button.addEventListener('click', (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                const ave = DB.aves.find(a => a.id === id);
                if (!ave) return;
                if (window.switchModule) switchModule('marketing');
                const mktEspecie = document.getElementById('mkt-especie');
                const mktMutacao = document.getElementById('mkt-mutacao');
                if (mktEspecie) mktEspecie.value = ave.especie || 'Ringneck';
                if (mktMutacao) mktMutacao.value = ave.mutacao || '';
                const mktSelect = document.getElementById('mkt-select-ave');
                if (mktSelect) mktSelect.value = ave.id;
                generateMarketingAd(ave);
            });
        });

        const recintoSelect = document.getElementById('add-recinto-select');
        if (recintoSelect) {
            recintoSelect.innerHTML = '<option value="">— Sem recinto —</option>' + DB.recintos.map((recinto) => `<option value="${escapeHtml(recinto.id)}">${escapeHtml(recinto.nome)}</option>`).join('');
        }
        const ovoRecintoSelect = document.getElementById('ovo-recinto-select');
        if (ovoRecintoSelect) {
            ovoRecintoSelect.innerHTML = '<option value="">— Selecionar Recinto Origem —</option>' + DB.recintos.map((recinto) => `<option value="${escapeHtml(recinto.id)}">${escapeHtml(recinto.nome)} (${escapeHtml(recinto.ala || 'Matrizes')})</option>`).join('');
        }
        updateMarketingSelect();
    };

    const renderRecintos = () => {
        const container = document.getElementById('recintos-grid-container');
        if (!container) return;

        if (DB.recintos.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card">Nenhum recinto cadastrado.</div>';
            return;
        }

        container.innerHTML = DB.recintos.map((recinto) => {
            const avesAlocadas = DB.aves.filter((ave) => ave.recinto === recinto.id);
            const numAves = avesAlocadas.length;
            const casaisStr = recinto.anilha_casal || (numAves ? avesAlocadas.map(a => a.anilha).join(', ') : 'Sem animais alocados');

            return `
                <div class="glass-card" style="position:relative; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <span class="badge-pill badge-amber">📍 ${escapeHtml(recinto.ala || 'Ala de Matrizes')}</span>
                            <span class="badge-pill badge-cyan">📦 ${escapeHtml(recinto.tipo_comp || 'Gaiola')} (Qtd: ${recinto.qtd_comp || 1})</span>
                        </div>
                        <h3 style="font-family:'Outfit',sans-serif; font-size:1.3rem; font-weight:800; color:var(--text-primary); margin-bottom:0.4rem;">${escapeHtml(recinto.nome)}</h3>
                        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.85rem;">Dimensões: <strong>${escapeHtml(recinto.dimensoes || 'Não especificada')}</strong></p>
                        
                        <div style="background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid var(--border-glass); margin-bottom:1rem;">
                            <div style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:0.3rem;">ANIMAIS ALOCADOS:</div>
                            <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary);">${escapeHtml(casaisStr)}</div>
                        </div>

                        ${recinto.descricao ? `<p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;"><em>"${escapeHtml(recinto.descricao)}"</em></p>` : ''}
                    </div>

                    <div style="display:flex; gap:0.5rem; margin-top:1rem; border-top:1px solid var(--border-glass); padding-top:0.85rem;">
                        <button class="btn-ui btn-ui-secondary btn-placa-pdf" data-id="${escapeHtml(recinto.id)}" style="flex:1; padding:0.45rem 0.8rem; font-size:0.8rem;">🖨️ Placa PDF</button>
                        <button class="btn-ui btn-ui-secondary btn-delete-recinto" data-id="${escapeHtml(recinto.id)}" style="padding:0.45rem; font-size:0.8rem; color:#f43f5e;" title="Excluir Recinto">❌</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.btn-placa-pdf').forEach((button) => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                exportRecintoPlacaPdf(id);
            });
        });

        container.querySelectorAll('.btn-delete-recinto').forEach((button) => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este recinto?')) return;
                await DB.removeRecinto(id);
                renderRecintos();
                renderPlantel();
                renderDashboard();
            });
        });
    };

    const exportRecintoPlacaPdf = (recintoId) => {
        const recinto = DB.recintos.find((r) => r.id === recintoId);
        if (!recinto) return alert('Recinto não encontrado.');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [150, 100] });

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 150, 100, 'F');
        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(1.5);
        doc.rect(4, 4, 142, 92, 'D');

        doc.setTextColor(251, 191, 36);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(DB.perfil.nome_criatorio || 'CRIADOR PRO 5.0', 10, 14);

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text(`Setor / Ala: ${recinto.ala || 'Ala de Matrizes'}`, 10, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text(recinto.nome.toUpperCase(), 10, 30);

        doc.setFontSize(10);
        doc.setTextColor(251, 191, 36);
        doc.text(`Compartimento: ${recinto.tipo_comp || 'Gaiola Convencional'} (Qtd: ${recinto.qtd_comp || 1})`, 10, 40);
        doc.setTextColor(203, 213, 225);
        doc.text(`Dimensões: ${recinto.dimensoes || 'Não especificada'}`, 10, 46);

        doc.setFillColor(30, 41, 59);
        doc.roundedRect(10, 52, 130, 26, 3, 3, 'F');
        doc.setTextColor(251, 191, 36);
        doc.setFontSize(9);
        doc.text('ANIMAIS / CASAL ALOCADO:', 14, 58);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(recinto.anilha_casal || 'Sem animais cadastrados neste compartimento', 14, 66);
        if (recinto.descricao) {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Obs: ${recinto.descricao}`, 14, 73);
        }

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Placa Gerada via Criador Pro 5.0 • Registro CTF/IBAMA: ${DB.perfil.ibama_ctf || 'Informado no sistema'}`, 10, 92);

        doc.save(`Placa_Recinto_${recinto.nome.replace(/\s+/g, '_')}.pdf`);
    };

    const renderOvos = () => {
        const tbody = document.querySelector('#ovos-table tbody');
        if (!tbody) return;

        if (DB.ovos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">Nenhum ovo em incubação na chocadeira.</td></tr>';
            const dashOvos = document.getElementById('dash-ovos');
            if (dashOvos) dashOvos.textContent = '0';
            return;
        }

        const dashOvos = document.getElementById('dash-ovos');
        if (dashOvos) dashOvos.textContent = String(DB.ovos.length);

        tbody.innerHTML = DB.ovos.map((ovo) => {
            const recinto = DB.recintos.find((r) => r.id === ovo.recinto_id);
            const recintoNome = recinto ? recinto.nome : '—';
            
            const dIncub = new Date(ovo.data_incubacao + 'T00:00:00');
            const dOvoscopia = new Date(dIncub.getTime() + 7 * 24 * 60 * 60 * 1000);
            const dEclosao = new Date(dIncub.getTime() + 23 * 24 * 60 * 60 * 1000);
            const hoje = new Date();

            const ovoscopiaStr = dOvoscopia.toLocaleDateString('pt-BR');
            const eclosaoStr = dEclosao.toLocaleDateString('pt-BR');

            const isOvoscopiaHoje = hoje.toDateString() === dOvoscopia.toDateString();
            const isEclosaoHoje = hoje.toDateString() === dEclosao.toDateString();

            const statusBadge = isEclosaoHoje
                ? '<span class="badge-pill badge-rose" style="animation:pulseGlow 1.5s infinite;">🐣 ECLOSÃO HOJE!</span>'
                : isOvoscopiaHoje
                ? '<span class="badge-pill badge-amber">🔍 OVOSCOPIA HOJE</span>'
                : `<span class="badge-pill badge-emerald">${escapeHtml(ovo.status)}</span>`;

            return `
                <tr>
                    <td><strong>${escapeHtml(ovo.codigo)}</strong></td>
                    <td><span class="badge-pill badge-cyan">${escapeHtml(recintoNome)}</span></td>
                    <td><small>♂️ ${escapeHtml(ovo.pai_anilha || '—')}<br>♀️ ${escapeHtml(ovo.mae_anilha || '—')}</small></td>
                    <td>${formatDateBr(ovo.data_postura)}</td>
                    <td>${formatDateBr(ovo.data_incubacao)}</td>
                    <td><strong>${ovoscopiaStr}</strong></td>
                    <td><strong style="color:var(--primary);">${eclosaoStr}</strong></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-delete-ovo" data-id="${escapeHtml(ovo.id)}" style="background:transparent;border:none;cursor:pointer;" title="Remover Ovo">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-ovo').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este ovo da chocadeira?')) return;
                await DB.removeOvo(id);
                renderOvos();
            });
        });
    };

    const renderUtiFilhotes = () => {
        const grid = document.getElementById('uti-filhotes-cards-grid');
        const dashFilhotes = document.getElementById('dash-filhotes-uti');
        if (dashFilhotes) dashFilhotes.textContent = String(DB.uti_filhotes.length);

        const selectPeso = document.getElementById('peso-filhote-select');
        if (selectPeso) {
            selectPeso.innerHTML = '<option value="">— Selecionar Filhote UTI —</option>' + DB.uti_filhotes.map(f => `<option value="${escapeHtml(f.id)}">[${escapeHtml(f.anilha)}] ${escapeHtml(f.especie)}</option>`).join('');
        }

        if (!grid) return;

        if (DB.uti_filhotes.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card"><div style="font-size:3rem; margin-bottom:0.5rem;">🍼</div>Nenhum filhote ativo em tratagem na UTI Neonatal.</div>';
            return;
        }

        grid.innerHTML = DB.uti_filhotes.map((filhote) => {
            const pesagens = filhote.pesagens || [];
            const ultimoPeso = pesagens.length ? pesagens[pesagens.length - 1].valor : filhote.peso_inicial;
            const ganho = pesagens.length ? (ultimoPeso - filhote.peso_inicial).toFixed(1) : 0;
            
            const pesagensHtml = pesagens.slice(-3).reverse().map((p) => `
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-bottom:1px solid var(--border-glass); padding:0.3rem 0;">
                    <span>📅 ${formatDateBr(p.data)}</span>
                    <strong style="color:var(--primary);">${p.valor}g (${p.papo})</strong>
                </div>
            `).join('');

            return `
                <div class="glass-card" style="border-color:rgba(16, 185, 129, 0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="badge-pill badge-emerald">🍼 Anilha: ${escapeHtml(filhote.anilha)}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Nasc: ${formatDateBr(filhote.nascimento)}</span>
                    </div>
                    <h4 style="font-family:'Outfit',sans-serif; margin-bottom:0.5rem;">${escapeHtml(filhote.especie)}</h4>
                    <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:0.75rem;">♂️ Pai: ${escapeHtml(filhote.pai_anilha || '—')} | ♀️ Mãe: ${escapeHtml(filhote.mae_anilha || '—')}</p>
                    
                    <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:0.85rem; margin-bottom:0.85rem; display:flex; justify-content:space-around; text-align:center;">
                        <div>
                            <span style="font-size:0.7rem; color:var(--text-muted);">PESO INICIAL</span>
                            <div style="font-weight:700;">${filhote.peso_inicial}g</div>
                        </div>
                        <div>
                            <span style="font-size:0.7rem; color:var(--text-muted);">PESO ATUAL</span>
                            <div style="font-weight:800; color:var(--accent-emerald); font-size:1.1rem;">${ultimoPeso}g</div>
                        </div>
                        <div>
                            <span style="font-size:0.7rem; color:var(--text-muted);">EVOLUÇÃO</span>
                            <div style="font-weight:700; color:${ganho >= 0 ? '#10b981' : '#f43f5e'};">+${ganho}g</div>
                        </div>
                    </div>

                    <div style="margin-bottom:0.85rem;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">Histórico de Pesagens Recentes:</span>
                        ${pesagensHtml || '<div style="font-size:0.75rem; color:var(--text-muted);">Sem registros adicionais.</div>'}
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-ui btn-ui-secondary btn-add-peso" data-id="${escapeHtml(filhote.id)}" style="flex:1; padding:0.4rem; font-size:0.8rem;">⚖️ + Lançar Peso</button>
                        <button class="btn-ui btn-ui-secondary btn-delete-uti" data-id="${escapeHtml(filhote.id)}" style="padding:0.4rem; font-size:0.8rem; color:#f43f5e;">❌</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-add-peso').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const select = document.getElementById('peso-filhote-select');
                if (select) select.value = id;
                if (window.openModal) openModal('modal-add-peso-filhote');
            });
        });

        grid.querySelectorAll('.btn-delete-uti').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este filhote da UTI?')) return;
                await DB.removeFilhoteUti(id);
                renderUtiFilhotes();
                renderEscalaAlimentacao();
            });
        });

        renderEscalaAlimentacao();
    };

    const renderEscalaAlimentacao = () => {
        const grid = document.getElementById('escala-alimentacao-grid');
        if (!grid) return;

        const horarios = ['06:00 (Primeira Papa)', '10:00 (Segunda Papa)', '14:00 (Terceira Papa)', '18:00 (Quarta Papa)', '22:00 (Última Papa)'];
        const filhotesAtivos = DB.uti_filhotes;

        grid.innerHTML = horarios.map((horario) => `
            <div class="glass-card">
                <h4 style="font-family:'Outfit',sans-serif; color:var(--primary); font-size:0.95rem; margin-bottom:0.6rem;">⏰ ${horario}</h4>
                <div style="font-size:0.8rem; color:var(--text-secondary);">
                    ${filhotesAtivos.length ? filhotesAtivos.map(f => `<div>• Anilha <strong>${escapeHtml(f.anilha)}</strong> (${escapeHtml(f.especie)})</div>`).join('') : '<span style="color:var(--text-muted);">Sem filhotes na escala</span>'}
                </div>
            </div>
        `).join('');
    };

    const exportMaternidadePdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(DB.perfil.nome_criatorio || 'Criador Pro 5.0', 14, 15);
        doc.setFontSize(12);
        doc.text('Relatório Oficial de Maternidade, Chocadeira e UTI Neonatal', 14, 23);

        const headersOvos = [['Código Ovo', 'Recinto', 'Pai / Mãe', 'Incubação', 'Ovoscopia', 'Eclosão', 'Status']];
        const dataOvos = DB.ovos.map((o) => [
            o.codigo,
            DB.recintos.find((r) => r.id === o.recinto_id)?.nome || '—',
            `${o.pai_anilha || '—'} / ${o.mae_anilha || '—'}`,
            formatDateBr(o.data_incubacao),
            new Date(new Date(o.data_incubacao + 'T00:00:00').getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            new Date(new Date(o.data_incubacao + 'T00:00:00').getTime() + 23 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            o.status
        ]);

        doc.autoTable({
            startY: 30,
            head: headersOvos,
            body: dataOvos,
            theme: 'grid',
            headStyles: { fillColor: [251, 191, 36], textColor: [15, 23, 42], fontStyle: 'bold' }
        });

        doc.save(`Maternidade_Chocadeira_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportMaternidadeCsv = () => {
        const headers = ['CodigoOvo', 'Recinto', 'PaiAnilha', 'MaeAnilha', 'DataPostura', 'DataIncubacao', 'Status'];
        const rows = DB.ovos.map((o) => [
            o.codigo,
            DB.recintos.find((r) => r.id === o.recinto_id)?.nome || '',
            o.pai_anilha,
            o.mae_anilha,
            o.data_postura,
            o.data_incubacao,
            o.status
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `Maternidade_Chocadeira_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const renderEstoqueAlimentos = () => {
        const tbody = document.querySelector('#estoque-alimentos-table tbody');
        if (!tbody) return;

        const insumos = DB.estoque_alimentos;
        let alertasCount = 0;

        insumos.forEach(item => {
            if (item.qtd <= item.minimo) alertasCount++;
        });

        const dashAlertas = document.getElementById('dash-alertas-estoque');
        if (dashAlertas) dashAlertas.textContent = String(alertasCount);

        if (insumos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">Nenhum alimento cadastrado no estoque.</td></tr>';
            return;
        }

        tbody.innerHTML = insumos.map((item) => {
            const isCritico = item.qtd <= item.minimo;
            const isAtencao = item.qtd > item.minimo && item.qtd <= (item.minimo * 1.5);

            const statusBadge = isCritico
                ? '<span class="badge-pill badge-rose" style="animation:pulseGlow 1.5s infinite;">🔴 ESTOQUE CRÍTICO</span>'
                : isAtencao
                ? '<span class="badge-pill badge-amber">🟡 COMPRAR EM BREVE</span>'
                : '<span class="badge-pill badge-emerald">🟢 ESTOQUE OK</span>';

            return `
                <tr>
                    <td><strong>${escapeHtml(item.nome)}</strong></td>
                    <td><span class="badge-pill badge-cyan">${escapeHtml(item.categoria)}</span></td>
                    <td><strong style="font-size:1.05rem; color:${isCritico ? '#f43f5e' : 'var(--text-primary)'};">${item.qtd} kg/un</strong></td>
                    <td>${item.minimo} kg/un</td>
                    <td>${escapeHtml(item.fornecedor)}</td>
                    <td>${item.validade ? formatDateBr(item.validade) : '—'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-delete-insumo" data-id="${escapeHtml(item.id)}" style="background:transparent;border:none;cursor:pointer;" title="Excluir Insumo">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-insumo').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este insumo do estoque?')) return;
                await DB.removeInsumo(id);
                renderEstoqueAlimentos();
            });
        });
    };

    const renderCardapios = () => {
        const container = document.getElementById('cardapios-grid-container');
        if (!container) return;

        const selectCardapioRecinto = document.getElementById('cardapio-recinto-select');
        if (selectCardapioRecinto) {
            selectCardapioRecinto.innerHTML = '<option value="">— Selecionar Recinto / Compartimento —</option>' + DB.recintos.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.nome)} (${escapeHtml(r.ala || 'Matrizes')})</option>`).join('');
        }

        const cardapios = DB.cardapios_recinto;
        if (cardapios.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card">Nenhum cardápio cadastrado.</div>';
            return;
        }

        container.innerHTML = cardapios.map((cardapio) => {
            const recinto = DB.recintos.find(r => r.id === cardapio.recinto_id);
            const recintoNome = recinto ? recinto.nome : 'Recinto Geral / Vários';

            return `
                <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between; border-color:rgba(251, 191, 36, 0.3);">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <span class="badge-pill badge-amber">🥗 ${escapeHtml(cardapio.frequencia)}</span>
                            <span class="badge-pill badge-cyan">⏰ ${escapeHtml(cardapio.horario)}</span>
                        </div>
                        <h3 style="font-family:'Outfit',sans-serif; font-size:1.2rem; font-weight:800; color:var(--text-primary); margin-bottom:0.4rem;">${escapeHtml(cardapio.nome)}</h3>
                        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.85rem;">📍 Destino: <strong>${escapeHtml(recintoNome)}</strong></p>

                        <div style="background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid var(--border-glass); margin-bottom:1rem;">
                            <div style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:0.3rem;">INGREDIENTES / COMPOSIÇÃO:</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary);">${escapeHtml(cardapio.ingredientes)}</div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-glass); padding-top:0.75rem;">
                        <button class="btn-ui btn-ui-secondary btn-delete-cardapio" data-id="${escapeHtml(cardapio.id)}" style="padding:0.4rem 0.8rem; font-size:0.8rem; color:#f43f5e;">Excluir Cardápio ❌</button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.btn-delete-cardapio').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Excluir este cardápio?')) return;
                await DB.removeCardapio(id);
                renderCardapios();
            });
        });
    };

    const renderEscalaManejo = () => {
        const grid = document.getElementById('escala-manejo-cards-grid');
        if (!grid) return;

        const selectEscalaRecinto = document.getElementById('escala-recinto-select');
        if (selectEscalaRecinto) {
            selectEscalaRecinto.innerHTML = '<option value="">— Selecionar Recinto / Setor —</option>' + DB.recintos.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.nome)} (${escapeHtml(r.ala || 'Matrizes')})</option>`).join('');
        }

        const escalas = DB.escala_manejo;
        if (escalas.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card"><div style="font-size:3rem; margin-bottom:0.5rem;">🧹</div>Nenhuma escala de manejo cadastrada.</div>';
            return;
        }

        grid.innerHTML = escalas.map((escala) => {
            const recinto = DB.recintos.find(r => r.id === escala.recinto_id);
            const recintoNome = recinto ? recinto.nome : 'Setor Geral';

            return `
                <div class="glass-card" style="border-color:rgba(59, 130, 246, 0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="badge-pill badge-cyan">📍 ${escapeHtml(recintoNome)}</span>
                        <span class="badge-pill badge-amber">⏰ ${escapeHtml(escala.turno)}</span>
                    </div>
                    <div style="margin-bottom:0.85rem; font-size:0.9rem;">
                        <div style="margin-bottom:0.4rem;"><strong>👤 Alimentação (Tratador):</strong> <span style="color:var(--text-primary);">${escapeHtml(escala.tratador)}</span></div>
                        <div><strong>🧹 Higiene (Limpeza):</strong> <span style="color:var(--text-primary);">${escapeHtml(escala.limpador)}</span></div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-glass); padding-top:0.75rem;">
                        <button class="btn-ui btn-ui-secondary btn-delete-escala" data-id="${escapeHtml(escala.id)}" style="padding:0.4rem 0.8rem; font-size:0.8rem; color:#f43f5e;">Remover ❌</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-delete-escala').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover esta escala de manejo?')) return;
                await DB.removeEscalaManejo(id);
                renderEscalaManejo();
            });
        });
    };

    const exportCozinhaPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(DB.perfil.nome_criatorio || 'Criador Pro 5.0', 14, 15);
        doc.setFontSize(12);
        doc.text('Relatório de Gestão da Cozinha, Estoque de Alimentos e Dietas', 14, 23);

        const headersEstoque = [['Insumo', 'Categoria', 'Qtd Atual', 'Mínimo', 'Fornecedor', 'Status']];
        const dataEstoque = DB.estoque_alimentos.map((i) => [
            i.nome,
            i.categoria,
            `${i.qtd} kg/un`,
            `${i.minimo} kg/un`,
            i.fornecedor,
            i.qtd <= i.minimo ? 'CRÍTICO' : 'OK'
        ]);

        doc.autoTable({
            startY: 30,
            head: headersEstoque,
            body: dataEstoque,
            theme: 'grid',
            headStyles: { fillColor: [251, 191, 36], textColor: [15, 23, 42], fontStyle: 'bold' }
        });

        doc.save(`Cozinha_Estoque_Alimentos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportCozinhaCsv = () => {
        const headers = ['Insumo', 'Categoria', 'QtdAtual', 'EstoqueMinimo', 'Fornecedor', 'Validade', 'Status'];
        const rows = DB.estoque_alimentos.map((i) => [
            i.nome,
            i.categoria,
            i.qtd,
            i.minimo,
            i.fornecedor,
            i.validade,
            i.qtd <= i.minimo ? 'CRITICO' : 'OK'
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `Estoque_Alimentos_Cozinha_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const renderQuarentena = () => {
        const tbody = document.querySelector('#quarentena-table tbody');
        if (!tbody) return;

        const selectQuarRecinto = document.getElementById('quar-recinto-select');
        if (selectQuarRecinto) {
            selectQuarRecinto.innerHTML = '<option value="">— Selecionar Gaiola / Compartimento Isolamento —</option>' + DB.recintos.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.nome)} (${escapeHtml(r.ala || 'Quarentena')})</option>`).join('');
        }

        const quarentenas = DB.quarentena_registros;
        const dashCount = document.getElementById('dash-quarentena-count');
        if (dashCount) dashCount.textContent = String(quarentenas.length);

        if (quarentenas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">Nenhuma ave atualmente em quarentena de biossegurança.</td></tr>';
            return;
        }

        tbody.innerHTML = quarentenas.map((q) => {
            const recinto = DB.recintos.find(r => r.id === q.recinto_id);
            const recintoNome = recinto ? recinto.nome : 'Isolamento Geral';

            const docBtn = q.doc_url
                ? `<a href="${escapeHtml(q.doc_url)}" target="_blank" class="badge-pill badge-cyan" style="text-decoration:none;">📄 Ver Anexo</a>`
                : '<span style="color:var(--text-muted); font-size:0.75rem;">Sem anexo</span>';

            return `
                <tr>
                    <td><strong>${escapeHtml(q.anilha)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(q.especie_mutacao)}</small></td>
                    <td><span class="badge-pill badge-amber">📍 ${escapeHtml(recintoNome)}</span></td>
                    <td>${escapeHtml(q.origem)}</td>
                    <td><small><strong>GTA:</strong> ${escapeHtml(q.gta)}<br><strong>NF:</strong> ${escapeHtml(q.nf)}</small></td>
                    <td>${formatDateBr(q.data_chegada)}</td>
                    <td><strong style="color:var(--primary);">${formatDateBr(q.data_alta)}</strong></td>
                    <td><span class="badge-pill badge-emerald">🛡️ ${escapeHtml(q.status)}</span></td>
                    <td>${docBtn}</td>
                    <td>
                        <button class="btn-delete-quarentena" data-id="${escapeHtml(q.id)}" style="background:transparent;border:none;cursor:pointer;" title="Dar Alta / Excluir">❌</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-quarentena').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Dar alta / remover esta ave da quarentena?')) return;
                await DB.removeQuarentena(id);
                renderQuarentena();
            });
        });
    };

    const renderEnfermaria = () => {
        const grid = document.getElementById('enfermaria-cards-grid');
        if (!grid) return;

        const selectEnfRecinto = document.getElementById('enf-recinto-select');
        if (selectEnfRecinto) {
            selectEnfRecinto.innerHTML = '<option value="">— Selecionar Leito Hospitalar —</option>' + DB.recintos.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.nome)} (${escapeHtml(r.ala || 'Enfermaria')})</option>`).join('');
        }

        const enfermaria = DB.enfermaria_registros;
        if (enfermaria.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card"><div style="font-size:3rem; margin-bottom:0.5rem;">🏥</div>Nenhuma ave em internação na enfermaria hospitalar.</div>';
            return;
        }

        grid.innerHTML = enfermaria.map((e) => {
            const recinto = DB.recintos.find(r => r.id === e.recinto_id);
            const recintoNome = recinto ? recinto.nome : 'Leito Geral';

            return `
                <div class="glass-card" style="border-color:rgba(244, 63, 94, 0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="badge-pill badge-rose">🏥 Anilha: ${escapeHtml(e.anilha)}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Internado: ${formatDateBr(e.data_internacao)}</span>
                    </div>
                    <h4 style="font-family:'Outfit',sans-serif; color:var(--accent-rose); margin-bottom:0.4rem;">${escapeHtml(e.diagnostico)}</h4>
                    
                    <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:0.85rem; margin-bottom:0.85rem; border:1px solid var(--border-glass);">
                        <div style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:0.3rem;">PRESCRIÇÃO VETERINÁRIA & DOSAGEM:</div>
                        <div style="font-size:0.88rem; font-weight:600; color:var(--text-primary); margin-bottom:0.2rem;">💊 ${escapeHtml(e.medicamento)}</div>
                        <div style="font-size:0.8rem; color:var(--text-secondary);">🧪 Dose: ${escapeHtml(e.dosagem)} (${e.dias} dias)</div>
                    </div>

                    <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.85rem;">
                        Responsável Técnico: <strong>${escapeHtml(e.responsavel)}</strong> | Leito: <strong>${escapeHtml(recintoNome)}</strong>
                    </div>

                    <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-glass); padding-top:0.75rem;">
                        <button class="btn-ui btn-ui-secondary btn-delete-enfermaria" data-id="${escapeHtml(e.id)}" style="padding:0.4rem 0.8rem; font-size:0.8rem; color:#10b981;">Dar Alta Hospitalar ✅</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-delete-enfermaria').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Conceder alta médica hospitalar para esta ave?')) return;
                await DB.removeEnfermaria(id);
                renderEnfermaria();
            });
        });
    };

    const renderSaida = () => {
        const grid = document.getElementById('saida-cards-grid');
        if (!grid) return;

        const saidas = DB.saida_registros;
        if (saidas.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:3rem;" class="glass-card"><div style="font-size:3rem; margin-bottom:0.5rem;">🚚</div>Nenhum animal em processo de expedição de saída.</div>';
            return;
        }

        grid.innerHTML = saidas.map((s) => {
            const fotoImg = s.foto_url
                ? `<img src="${escapeHtml(s.foto_url)}" alt="Memorial Fotográfico" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:0.75rem; border:1px solid var(--primary);">`
                : '';

            return `
                <div class="glass-card" style="border-color:rgba(16, 185, 129, 0.4);">
                    ${fotoImg}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <span class="badge-pill badge-emerald">🚚 Anilha: ${escapeHtml(s.anilha)}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Envio: ${formatDateBr(s.data_transporte)}</span>
                    </div>
                    <h4 style="font-family:'Outfit',sans-serif; margin-bottom:0.4rem;">Destino: ${escapeHtml(s.destino)}</h4>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">GTA Nº: <strong>${escapeHtml(s.gta)}</strong></p>

                    <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:0.75rem; margin-bottom:0.85rem; font-size:0.78rem;">
                        <div style="font-weight:700; color:var(--primary); margin-bottom:0.3rem;">CHECKLIST DOCUMENTAL:</div>
                        <div>${s.chk_gta ? '✅' : '❌'} Guia GTA Emitida</div>
                        <div>${s.chk_nf ? '✅' : '❌'} Nota Fiscal Acompanhante</div>
                        <div>${s.chk_cert ? '✅' : '❌'} Certificado de Origem</div>
                        <div>${s.chk_laudo ? '✅' : '❌'} Atestado Sanitário OK</div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-glass); padding-top:0.75rem;">
                        <button class="btn-ui btn-ui-secondary btn-delete-saida" data-id="${escapeHtml(s.id)}" style="padding:0.4rem 0.8rem; font-size:0.8rem; color:#f43f5e;">Concluir Envio 📦</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-delete-saida').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Concluir e arquivar este envio de saída?')) return;
                await DB.removeSaida(id);
                renderSaida();
            });
        });
    };

    const exportQuarentenaPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(DB.perfil.nome_criatorio || 'Criador Pro 5.0', 14, 15);
        doc.setFontSize(12);
        doc.text('Relatório Oficial de Quarentena, Sanidade e Enfermaria', 14, 23);

        const headersQuar = [['Anilha', 'Espécie / Mutação', 'Origem', 'GTA / NF', 'Data Chegada', 'Status']];
        const dataQuar = DB.quarentena_registros.map((q) => [
            q.anilha,
            q.especie_mutacao,
            q.origem,
            `GTA: ${q.gta} | NF: ${q.nf}`,
            formatDateBr(q.data_chegada),
            q.status
        ]);

        doc.autoTable({
            startY: 30,
            head: headersQuar,
            body: dataQuar,
            theme: 'grid',
            headStyles: { fillColor: [251, 191, 36], textColor: [15, 23, 42], fontStyle: 'bold' }
        });

        doc.save(`Sanidade_Quarentena_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportQuarentenaCsv = () => {
        const headers = ['Anilha', 'EspecieMutacao', 'Origem', 'GTA', 'NF', 'DataChegada', 'DataAlta', 'Status'];
        const rows = DB.quarentena_registros.map((q) => [
            q.anilha,
            q.especie_mutacao,
            q.origem,
            q.gta,
            q.nf,
            q.data_chegada,
            q.data_alta,
            q.status
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `Sanidade_Quarentena_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const stateCalcV2 = {
        macho: {},
        femea: {}
    };
    let lastCalcResultV2 = null;
    let lastCalcContextV2 = null;
    const BLUE_SERIES_PRESETS = [
        { value: 'green', label: 'Verde [Ancestral]', genotype: 'BB' },
        { value: 'blue', label: 'Azul', genotype: 'UU' },
        { value: 'turquoise', label: 'Turquesa', genotype: 'TT' },
        { value: 'indigo', label: 'Indigo', genotype: 'II' },
        { value: 'sapphire', label: 'Safira', genotype: 'SS' },
        { value: 'green_blue', label: 'Verde / Azul', genotype: 'BU' },
        { value: 'green_turquoise', label: 'Verde / Turquesa', genotype: 'BT' },
        { value: 'green_indigo', label: 'Verde / Indigo', genotype: 'BI' },
        { value: 'green_sapphire', label: 'Verde / Safira', genotype: 'BS' },
        { value: 'blue_turquoise', label: 'Azul / Turquesa', genotype: 'UT' },
        { value: 'blue_indigo', label: 'Azul / Indigo', genotype: 'UI' },
        { value: 'blue_sapphire', label: 'Azul / Safira', genotype: 'US' },
        { value: 'turquoise_indigo', label: 'Turquesa / Indigo', genotype: 'TI' },
        { value: 'turquoise_sapphire', label: 'Turquesa / Safira', genotype: 'TS' },
        { value: 'indigo_sapphire', label: 'Indigo / Safira', genotype: 'IS' }
    ];
    const BLUE_SERIES_LABEL_MAP = {
        BB: 'Verde [Ancestral]',
        UU: 'Azul',
        TT: 'Turquesa',
        II: 'Indigo',
        SS: 'Safira',
        BU: 'Verde / Azul',
        BT: 'Verde / Turquesa',
        BI: 'Verde / Indigo',
        BS: 'Verde / Safira',
        UT: 'Azul / Turquesa',
        UI: 'Azul / Indigo',
        US: 'Azul / Safira',
        TI: 'Turquesa / Indigo',
        TS: 'Turquesa / Safira',
        IS: 'Indigo / Safira'
    };
    const MULTI_ALLELIC_LOCI = {
        ringneck: {
            id: 'blue_series',
            title: 'Serie Azul (Planilhas Ringneck)',
            hiddenRuleIds: ['blue', 'turquesa', 'indigo', 'safira'],
            presets: BLUE_SERIES_PRESETS,
            labelMap: BLUE_SERIES_LABEL_MAP,
            alleleOrder: { B: 0, U: 1, T: 2, I: 3, S: 4 }
        }
    };

    const getActiveMultiAllelicLocus = (speciesId) => MULTI_ALLELIC_LOCI[speciesId] || null;

    const normalizeDist = (rows) => {
        const sum = rows.reduce((acc, row) => acc + (row.probability || 0), 0);
        if (!sum) return rows;
        return rows.map((row) => ({ ...row, probability: row.probability / sum }));
    };

    const crossMultiAllelicSeries = (locusConfig, malePreset, femalePreset) => {
        const safeLocus = locusConfig || {};
        const presets = Array.isArray(safeLocus.presets) ? safeLocus.presets : [];
        if (!presets.length) {
            return [{ label: 'Ancestral', genotype: 'NN', probability: 1 }];
        }
        const male = presets.find((item) => item.value === malePreset) || presets[0];
        const female = presets.find((item) => item.value === femalePreset) || presets[0];
        const acc = new Map();
        const alleleOrder = safeLocus.alleleOrder || {};
        const labelMap = safeLocus.labelMap || {};

        for (const a of male.genotype.split('')) {
            for (const b of female.genotype.split('')) {
                const genotype = [a, b].sort((x, y) => (alleleOrder[x] ?? 99) - (alleleOrder[y] ?? 99)).join('');
                acc.set(genotype, (acc.get(genotype) || 0) + 0.25);
            }
        }

        return normalizeDist(Array.from(acc.entries()).map(([genotype, probability]) => ({
            label: labelMap[genotype] || genotype,
            genotype,
            probability
        })));
    };

    const combineDistributions = (baseRows, seriesRows) => {
        const safeBase = Array.isArray(baseRows) && baseRows.length ? baseRows : [{ label: 'Normal / Ancestral', probability: 1 }];
        const safeSeries = Array.isArray(seriesRows) && seriesRows.length ? seriesRows : [{ label: 'Verde [Ancestral]', probability: 1 }];
        const combined = [];
        for (const base of safeBase) {
            for (const serie of safeSeries) {
                const label = base.label && base.label !== 'Normal / Ancestral'
                    ? `${base.label} | Serie Azul: ${serie.label}`
                    : `Serie Azul: ${serie.label}`;
                combined.push({
                    label,
                    probability: (base.probability || 0) * (serie.probability || 0)
                });
            }
        }
        return normalizeDist(combined)
            .sort((a, b) => b.probability - a.probability)
            .map((row) => ({ ...row, percent: `${(row.probability * 100).toFixed(2)}%` }));
    };

    const initGeneticaV2 = () => {
        const speciesSelect = document.getElementById('species-select');
        const machoGrid = document.getElementById('macho-mutations-chips');
        const femeaGrid = document.getElementById('femea-mutations-chips');
        const blueSeriesPanel = document.querySelector('.blue-series-panel');
        const blueSeriesTitle = blueSeriesPanel?.querySelector('h4');
        const blueSeriesMale = document.getElementById('blue-series-male');
        const blueSeriesFemale = document.getElementById('blue-series-female');
        const ringneckCatalogSearch = document.getElementById('ringneck-catalog-search');
        const ringneckCatalogGrid = document.getElementById('ringneck-catalog-groups');
        const ringneckCatalogMeta = document.getElementById('ringneck-catalog-meta');
        const pdfDownloadBtn = document.getElementById('btn-download-pdf-calc');
        const geneticsChatHistory = document.getElementById('genetics-chat-history');
        const geneticsInput = document.getElementById('genetics-input');
        const geneticsSendButton = document.getElementById('btn-send-genetics');

        const getStateOptions = (rule, sex) => {
            if (rule.inheritance === 'sex_linked_recessive') {
                return sex === 'macho' ? ['normal', 'split', 'visual'] : ['normal', 'visual'];
            }
            if (rule.inheritance === 'autosomal_recessive') {
                return ['normal', 'carrier', 'visual'];
            }
            return ['normal', 'sf', 'df'];
        };

        const stateLabel = (value) => {
            const labels = {
                normal: 'Normal',
                split: 'Portador',
                carrier: 'Portador',
                visual: 'Visual',
                sf: 'Fator Simples',
                df: 'Fator Duplo'
            };
            return labels[value] || 'Normal';
        };

        const inheritanceLabel = (inheritance) => {
            const labels = {
                sex_linked_recessive: 'Ligada ao sexo',
                autosomal_recessive: 'Autossomica recessiva',
                autosomal_dominant: 'Autossomica dominante',
                autosomal_incomplete_dominant: 'Dominante incompleta'
            };
            return labels[inheritance] || inheritance;
        };

        const buildCombinedConfig = () => {
            const activeLocus = getActiveMultiAllelicLocus(speciesSelect.value);
            const hiddenRuleIds = new Set(activeLocus?.hiddenRuleIds || []);
            const combinedConfig = {};
            GENETICS_RULES.forEach((rule) => {
                if (hiddenRuleIds.has(rule.id)) return;
                const maleState = stateCalcV2.macho[rule.id]?.state || 'normal';
                const femaleState = stateCalcV2.femea[rule.id]?.state || 'normal';
                if (maleState !== 'normal' || femaleState !== 'normal') {
                    combinedConfig[rule.id] = { enabled: true, male: maleState, female: femaleState };
                }
            });
            return combinedConfig;
        };

        const ensureBlueSeriesOptions = () => {
            if (!blueSeriesMale || !blueSeriesFemale) return;
            const activeLocus = getActiveMultiAllelicLocus(speciesSelect.value);
            const presets = activeLocus?.presets || [];
            const optionsHtml = presets
                .map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`)
                .join('');
            blueSeriesMale.innerHTML = optionsHtml;
            blueSeriesFemale.innerHTML = optionsHtml;
            const defaultValue = presets[0]?.value || '';
            blueSeriesMale.value = defaultValue;
            blueSeriesFemale.value = defaultValue;
        };

        const renderBlueSeriesPanel = () => {
            if (!blueSeriesPanel || !blueSeriesMale || !blueSeriesFemale) return;
            const activeLocus = getActiveMultiAllelicLocus(speciesSelect.value);
            const hasLocus = Boolean(activeLocus && Array.isArray(activeLocus.presets) && activeLocus.presets.length);
            if (blueSeriesTitle) {
                blueSeriesTitle.textContent = activeLocus?.title || 'Locus Multialelico';
            }
            blueSeriesPanel.style.display = hasLocus ? 'block' : 'none';
            blueSeriesMale.disabled = !hasLocus;
            blueSeriesFemale.disabled = !hasLocus;
            if (hasLocus) {
                ensureBlueSeriesOptions();
            } else {
                blueSeriesMale.innerHTML = '';
                blueSeriesFemale.innerHTML = '';
            }
        };

        const stateToText = (value) => {
            const labels = {
                normal: 'Normal',
                split: 'Portador',
                carrier: 'Portador',
                visual: 'Visual',
                sf: 'Fator Simples',
                df: 'Fator Duplo'
            };
            return labels[value] || value;
        };

        const normalizeText = (value) => String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const fetchLivrosEvidence = async (query, limit = 4) => {
            try {
                const response = await fetch(`/api/livros/search?q=${encodeURIComponent(query)}&limit=${limit}`);
                if (!response.ok) return [];
                const data = await response.json();
                if (!data?.ok || !Array.isArray(data.results)) return [];
                return data.results;
            } catch {
                return [];
            }
        };

        const explainInheritance = (inheritance) => {
            const map = {
                sex_linked_recessive: 'Ligada ao sexo: machos podem ser normal, portador ou visual; femeas normalmente expressam ou nao a mutacao.',
                autosomal_recessive: 'Autossomica recessiva: para expressar fenotipo visual, normalmente precisa de duas copias do alelo mutado.',
                autosomal_dominant: 'Autossomica dominante: uma unica copia do alelo ja pode expressar o fenotipo.',
                autosomal_incomplete_dominant: 'Dominante incompleta: pode haver fator simples e fator duplo com intensidades diferentes.'
            };
            return map[inheritance] || 'Padrao de heranca definido pela regra genetica selecionada.';
        };

        const appendGeneticsMessage = (message, role) => {
            if (!geneticsChatHistory) return;
            const bubble = document.createElement('div');
            bubble.className = role === 'user' ? 'user-msg' : 'vet-msg';
            bubble.innerText = message;
            geneticsChatHistory.appendChild(bubble);
            geneticsChatHistory.scrollTop = geneticsChatHistory.scrollHeight;
        };

        const buildCurrentSummary = () => {
            const config = buildCombinedConfig();
            const entries = Object.entries(config);
            if (!entries.length) {
                return 'Nenhuma mutacao ativa. O cruzamento esta na base Verde [Ancestral].';
            }
            return entries.map(([ruleId, cfg]) => {
                const rule = GENETICS_RULES.find((r) => r.id === ruleId);
                const label = rule?.mutation || ruleId;
                return `${label}: macho ${stateToText(cfg.male)} | femea ${stateToText(cfg.female)}`;
            }).join('\n');
        };

        const generateGeneticsReply = async (question) => {
            const qRaw = String(question || '').trim();
            const q = normalizeText(qRaw);
            const summary = buildCurrentSummary();
            const config = buildCombinedConfig();
            const entries = Object.entries(config);

            const findMentionedRules = () => {
                return GENETICS_RULES.filter((rule) => {
                    const ruleName = normalizeText(rule.mutation);
                    const idName = normalizeText(rule.id);
                    return q.includes(ruleName) || q.includes(idName);
                });
            };

            const matchCatalog = () => {
                const tokens = q
                    .split(/\s+/)
                    .filter((token) => token.length >= 3)
                    .filter((token) => !['como', 'qual', 'quais', 'para', 'sobre', 'ringneck', 'genetica', 'genetico', 'jarvis', 'resultado'].includes(token));
                if (!tokens.length) return [];
                return RINGNECK_CATALOG.filter((item) => {
                    const bag = normalizeText(`${item.group} ${item.label}`);
                    return tokens.every((t) => bag.includes(t));
                }).slice(0, 10);
            };

            if (!qRaw) {
                return 'Pode perguntar a vontade. Exemplo: "explique a heranca do opalino", "interprete meu resultado" ou "mostre cores com violeta".';
            }

            if (q.includes('oi') || q.includes('ola') || q.includes('jarvis')) {
                return 'Jarvis Genetico ativo. Eu leio o cruzamento atual, explico heranca por mutacao, interpreto probabilidades e sugiro ajustes tecnicos com base na calculadora e nos livros da pasta local.';
            }

            if (q.includes('ajuda') || q.includes('o que voce faz') || q.includes('capacidade')) {
                return 'Eu posso: 1) explicar heranca por mutacao, 2) interpretar o ultimo resultado calculado, 3) localizar cores no catalogo Ringneck, 4) sugerir proximo cruzamento e 5) orientar o PDF tecnico.';
            }

            const mentionedRules = findMentionedRules();
            if (mentionedRules.length) {
                const lines = mentionedRules.map((rule) => {
                    const current = config[rule.id];
                    const currentLine = current
                        ? `Estado atual: macho ${stateToText(current.male)} | femea ${stateToText(current.female)}.`
                        : 'Estado atual: mutacao ainda nao ativada no cruzamento.';
                    return `${rule.mutation} (${inheritanceLabel(rule.inheritance)}): ${explainInheritance(rule.inheritance)} ${currentLine}`;
                });
                return lines.join('\n');
            }

            if (q.includes('heranca') || q.includes('heranca') || q.includes('explica') || q.includes('genotipo') || q.includes('fenotipo')) {
                if (!entries.length) {
                    return 'No estado atual nao ha mutacoes ativas. Selecione mutacoes para macho/femea e eu explico a heranca de cada uma com leitura tecnica.';
                }
                const lines = entries.map(([ruleId, cfg]) => {
                    const rule = GENETICS_RULES.find((r) => r.id === ruleId);
                    if (!rule) return '';
                    return `${rule.mutation}: ${explainInheritance(rule.inheritance)} Estado atual: macho ${stateToText(cfg.male)} | femea ${stateToText(cfg.female)}.`;
                }).filter(Boolean);
                return `Leitura tecnica da heranca:\n${lines.join('\n')}`;
            }

            if (q.includes('resultado') || q.includes('probabilidade') || q.includes('chance') || q.includes('interpret')) {
                if (!lastCalcResultV2) {
                    return 'Ainda nao ha calculo registrado. Clique em "Calcular Cruzamento Multi-Locus" e eu interpreto as chances para voce.';
                }
                const topMale = (lastCalcResultV2.male || []).slice(0, 5).map((item) => `- ${item.label}: ${item.percent}`).join('\n');
                const topFemale = (lastCalcResultV2.female || []).slice(0, 5).map((item) => `- ${item.label}: ${item.percent}`).join('\n');
                const headlineMale = (lastCalcResultV2.male || [])[0];
                const headlineFemale = (lastCalcResultV2.female || [])[0];
                const insight = headlineMale && headlineFemale
                    ? `Leitura principal: macho mais provavel "${headlineMale.label}" e femea mais provavel "${headlineFemale.label}".`
                    : 'Leitura principal indisponivel.';
                return `${insight}\nMachos (top 5):\n${topMale || '- Sem dados'}\nFemeas (top 5):\n${topFemale || '- Sem dados'}`;
            }

            if (q.includes('catalogo') || q.includes('cor') || q.includes('cores') || q.includes('preset')) {
                const matches = matchCatalog();
                if (!matches.length) {
                    return `Nao achei correspondencia direta no catalogo com esse termo. Tente por exemplo: "violeta", "opalino", "cleartail", "azul turquesa".\nResumo atual do cruzamento:\n${summary}`;
                }
                return `Encontrei no catalogo Ringneck:\n${matches.map((m) => `- ${m.label} [${m.group}]`).join('\n')}`;
            }

            if (q.includes('melhor') || q.includes('recomenda') || q.includes('proximo cruzamento') || q.includes('sugere')) {
                if (!entries.length) {
                    return 'Recomendacao inicial: ative 1-2 mutacoes alvo no casal (por exemplo opalino + violeta) para ver uma previsao mais objetiva antes de expandir combinacoes.';
                }
                if (entries.length >= 5) {
                    return 'Recomendacao tecnica: reduzir para 2-4 mutacoes ativas por rodada. Isso melhora a leitura pratica e evita dispersao excessiva de probabilidades.';
                }
                return 'Recomendacao tecnica: mantenha esse cenario como baseline e rode mais uma variacao mudando apenas uma mutacao por vez. Assim voce valida impacto real no plantel.';
            }

            if (q.includes('pdf') || q.includes('laudo') || q.includes('relatorio')) {
                return 'Para emitir o laudo tecnico completo, calcule o cruzamento e clique em "Baixar PDF Completo". O documento sai com heranca, configuracao do casal, resultados e interpretacao.';
            }

            if (q.includes('verde')) {
                return 'Verde [Ancestral] representa a base sem mutacoes ativas. Ele serve como referencia para comparar o impacto de cada mutacao adicionada.';
            }

            let responseText = `Resumo tecnico atual:\n${summary}\n\nEu posso aprofundar por mutacao, interpretar probabilidades, buscar cores do catalogo e sugerir proximo cruzamento.`;
            const shouldConsultBooks = q.includes('livro')
                || q.includes('fonte')
                || q.includes('artigo')
                || q.includes('estudo')
                || q.includes('referencia')
                || mentionedRules.length > 0
                || q.includes('heranca')
                || q.includes('resultado');
            if (shouldConsultBooks) {
                const evidence = await fetchLivrosEvidence(qRaw, 3);
                if (evidence.length) {
                    const refs = evidence.map((item) => {
                        const snippet = item.snippet ? ` - ${item.snippet.slice(0, 160)}` : '';
                        return `- ${item.file} (${item.source})${snippet}`;
                    }).join('\n');
                    responseText += `\n\nFontes consultadas em livros:\n${refs}`;
                }
            }
            return responseText;
        };

        const renderMutationPanel = (container, sex) => {
            const species = speciesSelect.value;
            const activeLocus = getActiveMultiAllelicLocus(species);
            const hiddenRuleIds = new Set(activeLocus?.hiddenRuleIds || []);
            const relevantRules = GENETICS_RULES.filter((rule) => (
                rule.species.includes(species) && !hiddenRuleIds.has(rule.id)
            ));
            const baseCard = species === 'ringneck'
                ? `
                    <div class="mutation-chip base-chip">
                        <div class="mutation-chip-head">
                            <span>Verde [Ancestral]</span>
                            <small>Linha base (sem mutacao ativa)</small>
                        </div>
                    </div>
                `
                : '';

            container.innerHTML = baseCard + relevantRules.map((rule) => {
                const state = stateCalcV2[sex][rule.id]?.state || 'normal';
                const options = getStateOptions(rule, sex).map((opt) => (`<option value="${opt}" ${opt === state ? 'selected' : ''}>${stateLabel(opt)}</option>`)).join('');

                return `
                    <div class="mutation-chip selected">
                        <div class="mutation-chip-head">
                            <span>${escapeHtml(rule.mutation)}</span>
                            <small>${escapeHtml(inheritanceLabel(rule.inheritance))}</small>
                        </div>
                        <select class="glass-input mutation-state-select" data-rule-id="${rule.id}" data-sex="${sex}">
                            ${options}
                        </select>
                    </div>
                `;
            }).join('');

            container.querySelectorAll('.mutation-state-select').forEach((select) => {
                select.addEventListener('change', () => {
                    const ruleId = select.getAttribute('data-rule-id');
                    const selectedState = select.value || 'normal';
                    stateCalcV2[sex][ruleId] = {
                        enabled: selectedState !== 'normal',
                        state: selectedState
                    };
                });
            });
        };

        const renderRingneckCatalog = () => {
            if (!ringneckCatalogGrid || !ringneckCatalogMeta) return;

            if (speciesSelect.value !== 'ringneck') {
                ringneckCatalogGrid.innerHTML = `<div class="catalog-empty">Catalogo oficial exibido apenas para Ringneck.</div>`;
                ringneckCatalogMeta.textContent = '';
                if (ringneckCatalogSearch) ringneckCatalogSearch.style.display = 'none';
                return;
            }

            if (ringneckCatalogSearch) ringneckCatalogSearch.style.display = 'block';
            const term = (ringneckCatalogSearch?.value || '').trim().toLowerCase();
            const filtered = RINGNECK_CATALOG.filter((item) => (`${item.group} ${item.label}`.toLowerCase().includes(term)));
            const grouped = filtered.reduce((acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group].push(item.label);
                return acc;
            }, {});
            const groupLabelMap = {
                'Base/Blue line': 'Base/Linha Azul',
                'Cleartail': 'Cleartail [Cauda Clara]',
                'Opalino': 'Opalino',
                'Pallid': 'Pallid [Palido]',
                'Violeta': 'Violeta',
                'Outros': 'Outros'
            };

            ringneckCatalogMeta.textContent = `${filtered.length} cores/presets`;
            ringneckCatalogGrid.innerHTML = Object.keys(grouped).sort().map((group) => `
                <div class="catalog-group glass">
                    <h5>${escapeHtml(groupLabelMap[group] || group)}</h5>
                    <div class="catalog-tags">
                        ${grouped[group].map((label) => `<span class="catalog-tag">${escapeHtml(label)}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        };

        speciesSelect.addEventListener('change', () => {
            stateCalcV2.macho = {};
            stateCalcV2.femea = {};
            lastCalcResultV2 = null;
            lastCalcContextV2 = null;
            if (pdfDownloadBtn) pdfDownloadBtn.disabled = true;
            renderMutationPanel(machoGrid, 'macho');
            renderMutationPanel(femeaGrid, 'femea');
            renderBlueSeriesPanel();
            renderRingneckCatalog();
        });

        if (ringneckCatalogSearch) {
            ringneckCatalogSearch.addEventListener('input', renderRingneckCatalog);
        }

        renderMutationPanel(machoGrid, 'macho');
        renderMutationPanel(femeaGrid, 'femea');
        renderBlueSeriesPanel();
        renderRingneckCatalog();

        // Navegacao de Abas
        document.querySelectorAll('.tab-btn-calc').forEach((btn) => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.calcTab;
                document.querySelectorAll('.tab-btn-calc').forEach((b) => b.classList.remove('active'));
                document.querySelectorAll('.calc-tab-content').forEach((c) => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${tabId}`).classList.add('active');

                if (tabId === 'roadmap') renderRoadmap();
                if (tabId === 'validacao') renderValidation();
            });
        });

        document.getElementById('btn-cruzamento-v2').addEventListener('click', () => {
            const speciesId = speciesSelect.value;
            const combinedConfig = buildCombinedConfig();
            const activeLocus = getActiveMultiAllelicLocus(speciesId);
            const baseRes = calculateMultiLocus(speciesId, combinedConfig);
            const blueSeriesSelection = {
                male: (blueSeriesMale?.value || activeLocus?.presets?.[0]?.value || ''),
                female: (blueSeriesFemale?.value || activeLocus?.presets?.[0]?.value || '')
            };
            let finalRes = baseRes;

            if (activeLocus) {
                const blueSeriesCross = crossMultiAllelicSeries(activeLocus, blueSeriesSelection.male, blueSeriesSelection.female);
                finalRes = {
                    male: combineDistributions(baseRes.male || [], blueSeriesCross),
                    female: combineDistributions(baseRes.female || [], blueSeriesCross)
                };
            }

            lastCalcResultV2 = finalRes;
            lastCalcContextV2 = {
                species: speciesId,
                combinedConfig,
                multiAllelicSelection: activeLocus ? {
                    locusId: activeLocus.id,
                    locusTitle: activeLocus.title,
                    male: blueSeriesSelection.male,
                    female: blueSeriesSelection.female
                } : null,
                generatedAt: new Date().toISOString()
            };
            if (pdfDownloadBtn) pdfDownloadBtn.disabled = false;
            renderResultsV2(finalRes);
        });

        // Acoes do Menu
        document.getElementById('btn-run-tests-calc').addEventListener('click', () => {
            document.querySelector('[data-calc-tab="validacao"]').click();
        });

        document.getElementById('btn-export-pdf-calc').addEventListener('click', exportGeneticPdf);
        document.getElementById('btn-export-txt-calc').addEventListener('click', exportGeneticTxt);
        if (pdfDownloadBtn) {
            pdfDownloadBtn.disabled = !lastCalcResultV2;
            pdfDownloadBtn.addEventListener('click', exportGeneticPdf);
        }
        if (geneticsSendButton && geneticsInput) {
            geneticsSendButton.addEventListener('click', async () => {
                const text = geneticsInput.value.trim();
                if (!text) return;
                appendGeneticsMessage(text, 'user');
                geneticsInput.value = '';
                geneticsSendButton.disabled = true;
                geneticsSendButton.textContent = 'Pensando...';
                let reply = await generateGeneticsReply(text);
                if (!reply.includes('Fontes consultadas em livros')) {
                    const quickEvidence = await fetchLivrosEvidence(text, 2);
                    if (quickEvidence.length) {
                        const refs = quickEvidence
                            .map((item) => `- ${item.file} (${item.source})`)
                            .join('\n');
                        reply += `\n\nFontes consultadas em livros:\n${refs}`;
                    }
                }
                setTimeout(() => appendGeneticsMessage(`Jarvis Genetico: ${reply}`, 'bot'), 120);
                geneticsSendButton.disabled = false;
                geneticsSendButton.textContent = 'Enviar';
            });
            geneticsInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') geneticsSendButton.click();
            });
            appendGeneticsMessage('Jarvis Genetico: Estou pronto. Posso explicar heranca, interpretar probabilidades, sugerir cruzamentos e buscar cores no catalogo Ringneck.', 'bot');
        }
        document.getElementById('results-grid-v2').innerHTML = `
            <div class="res-v2-card">
                <h4>Probabilidades Estimadas</h4>
                <div>Defina o estado de cada mutacao no painel e clique em "Calcular Cruzamento Multi-Locus".</div>
            </div>
        `;
    };
    const renderResultsV2 = (res) => {
        const grid = document.getElementById('results-grid-v2');
        const maleRows = (res.male || []).slice(0, 20);
        const femaleRows = (res.female || []).slice(0, 20);
        const maleTruncated = (res.male || []).length > maleRows.length;
        const femaleTruncated = (res.female || []).length > femaleRows.length;
        grid.innerHTML = `
            <div class="res-v2-card">
                <h4>Probabilidades Estimadas</h4>
                <div class="mt-2">
                    <h5>Machos:</h5>
                    ${maleRows.map(m => `<div>${m.label}: <strong>${m.percent}</strong></div>`).join('')}
                    ${maleTruncated ? `<div class="text-muted small mt-2">Mostrando top ${maleRows.length} resultados.</div>` : ''}
                </div>
                <div class="mt-3">
                    <h5>F├¬meas:</h5>
                    ${femaleRows.map(f => `<div>${f.label}: <strong>${f.percent}</strong></div>`).join('')}
                    ${femaleTruncated ? `<div class="text-muted small mt-2">Mostrando top ${femaleRows.length} resultados.</div>` : ''}
                </div>
            </div>
        `;
    };

    const renderRoadmap = () => {
        const grid = document.getElementById('species-roadmap-calc');
        grid.innerHTML = SPECIES_ROADMAP.map(s => `
            <div class="stat-card glass roadmap-item">
                <h3>${s.label}</h3>
                <span class="roadmap-status">${s.status}</span>
            </div>
        `).join('');
    };

    const renderValidation = () => {
        const container = document.getElementById('validation-results-calc');
        const results = runValidationSuite();
        container.innerHTML = results.map(r => `
            <div class="test-row">
                <span>${r.title}</span>
                <span class="test-status ${r.status}">${r.status}</span>
            </div>
        `).join('');
    };

    const exportGeneticTxt = () => {
        const content = "RELAT├ôRIO GEN├ëTICO - CRIADOR PRO\n\nResultado do Cruzamento:\n" + document.getElementById('results-grid-v2').innerText;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'laudo-genetico.txt';
        a.click();
    };

    const exportGeneticPdf = () => {
        if (!hasPdfLib) return alert('Biblioteca PDF nao carregada.');
        if (!lastCalcResultV2 || !lastCalcContextV2) {
            return alert('Calcule primeiro o cruzamento para gerar o laudo completo.');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = 210;
        const marginX = 14;
        const maxTextWidth = pageWidth - (marginX * 2);
        let cursorY = 18;

        const ensureSpace = (needed = 12) => {
            if (cursorY + needed > 280) {
                doc.addPage();
                cursorY = 18;
            }
        };

        const writeTitle = (text) => {
            ensureSpace(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(text, marginX, cursorY);
            cursorY += 7;
        };

        const writeBody = (text, size = 10) => {
            const lines = doc.splitTextToSize(text, maxTextWidth);
            ensureSpace((lines.length * 5) + 2);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(size);
            doc.text(lines, marginX, cursorY);
            cursorY += (lines.length * 5) + 2;
        };

        const writeLine = (text) => {
            ensureSpace(6);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(text, marginX, cursorY);
            cursorY += 5;
        };

        const stateLabel = (value) => {
            const labels = {
                normal: 'Normal',
                split: 'Portador',
                carrier: 'Portador',
                visual: 'Visual',
                sf: 'Fator Simples',
                df: 'Fator Duplo'
            };
            return labels[value] || value;
        };

        const inheritanceLabel = (inheritance) => {
            const labels = {
                sex_linked_recessive: 'Ligada ao sexo',
                autosomal_recessive: 'Autossomica recessiva',
                autosomal_dominant: 'Autossomica dominante',
                autosomal_incomplete_dominant: 'Dominante incompleta'
            };
            return labels[inheritance] || inheritance;
        };

        const inheritanceExplanation = (inheritance) => {
            const labels = {
                sex_linked_recessive: 'A expressao depende do sexo. Machos podem ser portadores silenciosos; femeas normalmente expressam ou nao a mutacao.',
                autosomal_recessive: 'Fenotipo visual geralmente exige duas copias do alelo mutado. Portadores tem uma copia e podem transmitir.',
                autosomal_dominant: 'Uma copia do alelo mutado ja pode gerar fenotipo visual nos filhotes.',
                autosomal_incomplete_dominant: 'A expressao costuma variar entre fator simples e fator duplo.'
            };
            return labels[inheritance] || 'Padrao de heranca conforme regra tecnica do motor.';
        };

        const speciesNameMap = {
            ringneck: 'Ringneck',
            calopsita: 'Calopsita'
        };

        // Cabecalho
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Laudo Genetico Completo', pageWidth / 2, 13, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Criador Pro - Motor Mendeliano v2', pageWidth / 2, 22, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        cursorY = 38;

        // Identificacao
        const criatorio = document.getElementById('admin-criatorio-nome')?.value || 'Criatorio Desconhecido';
        const responsavel = document.getElementById('admin-responsavel')?.value || 'Nao informado';
        writeTitle('1. Identificacao');
        writeLine(`Criatorio: ${criatorio}`);
        writeLine(`Responsavel: ${responsavel}`);
        writeLine(`Data de emissao: ${new Date().toLocaleString('pt-BR')}`);
        writeLine(`Especie do cruzamento: ${speciesNameMap[lastCalcContextV2.species] || lastCalcContextV2.species}`);
        cursorY += 2;

        // Configuracao genetica do cruzamento
        writeTitle('2. Configuracao Genetica do Casal');
        if (lastCalcContextV2.multiAllelicSelection) {
            const speciesLocus = getActiveMultiAllelicLocus(lastCalcContextV2.species);
            const presets = speciesLocus?.presets || [];
            const maleSeriesLabel = presets.find((item) => item.value === lastCalcContextV2.multiAllelicSelection.male)?.label || 'Ancestral';
            const femaleSeriesLabel = presets.find((item) => item.value === lastCalcContextV2.multiAllelicSelection.female)?.label || 'Ancestral';
            writeLine(`${lastCalcContextV2.multiAllelicSelection.locusTitle || 'Locus multialelico'}: macho ${maleSeriesLabel} | femea ${femaleSeriesLabel}`);
            cursorY += 1;
        }
        const mutationEntries = Object.entries(lastCalcContextV2.combinedConfig || {});
        if (!mutationEntries.length) {
            writeBody('Sem mutacoes ativas. Cruzamento base Verde [Ancestral] x Verde [Ancestral].');
        } else {
            mutationEntries.forEach(([ruleId, cfg]) => {
                const rule = GENETICS_RULES.find((r) => r.id === ruleId);
                const ruleName = rule?.mutation || ruleId;
                writeLine(`- ${ruleName}: macho ${stateLabel(cfg.male)} | femea ${stateLabel(cfg.female)}`);
            });
        }
        cursorY += 2;

        // Explicacao tecnica
        writeTitle('3. Explicacao Tecnica da Heranca');
        if (!mutationEntries.length) {
            writeBody('Sem mutacoes selecionadas, os filhotes tendem ao fenotipo ancestral da especie.');
        } else {
            mutationEntries.forEach(([ruleId]) => {
                const rule = GENETICS_RULES.find((r) => r.id === ruleId);
                if (!rule) return;
                writeBody(`${rule.mutation} (${inheritanceLabel(rule.inheritance)}): ${inheritanceExplanation(rule.inheritance)}`);
            });
        }
        cursorY += 2;

        // Resultados
        writeTitle('4. Resultado do Cruzamento');
        const maleRows = (lastCalcResultV2.male || []).slice(0, 20);
        const femaleRows = (lastCalcResultV2.female || []).slice(0, 20);
        writeBody('Machos (top resultados):');
        maleRows.forEach((row) => writeLine(`- ${row.label}: ${row.percent}`));
        cursorY += 2;
        writeBody('Femeas (top resultados):');
        femaleRows.forEach((row) => writeLine(`- ${row.label}: ${row.percent}`));

        // Conclusao
        cursorY += 3;
        writeTitle('5. Interpretacao e Recomendacao');
        const topMale = maleRows[0] ? `${maleRows[0].label} (${maleRows[0].percent})` : 'Sem dados';
        const topFemale = femaleRows[0] ? `${femaleRows[0].label} (${femaleRows[0].percent})` : 'Sem dados';
        writeBody(`Leitura principal do cruzamento: macho mais provavel ${topMale}; femea mais provavel ${topFemale}.`);
        writeBody('Recomendacao pratica: valide os pares com historico de anilhas e mantenha registro por ciclo para comparar previsao genetica e nascimentos reais.');

        // Rodape em todas as paginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(`Laudo gerado automaticamente - pagina ${i}/${pageCount}`, pageWidth / 2, 287, { align: 'center' });
        }

        doc.save(`laudo-genetico-completo-${Date.now()}.pdf`);
    };

    const cruzarLocus = (a1, a2) => {
        const p1 = a1 === 2 ? ['a', 'a'] : a1 === 1 ? ['A', 'a'] : ['A', 'A'];
        const p2 = a2 === 2 ? ['a', 'a'] : a2 === 1 ? ['A', 'a'] : ['A', 'A'];
        const results = {};
        for (const g1 of p1) {
            for (const g2 of p2) {
                const key = [g1, g2].sort().join('');
                results[key] = (results[key] || 0) + 25;
            }
        }
        return results;
    };

    const calcularCruzamentoRingneck = (nomePai, nomeMae) => {
        const pai = ringneckGenetica[nomePai] || ringneckGenetica['Verde Ancestral'];
        const mae = ringneckGenetica[nomeMae] || ringneckGenetica['Verde Ancestral'];
        const loci = ['blue', 'ino', 'grey', 'opaline', 'indigo', 'violet', 'cleartail'];
        const resultadosLoci = {};
        loci.forEach((locus) => { resultadosLoci[locus] = cruzarLocus(pai[locus] || 0, mae[locus] || 0); });

        const filhotes = [];
        const pBlue = resultadosLoci.blue.aa || 0;
        const pVerde = (resultadosLoci.blue.AA || 0) + (resultadosLoci.blue.Aa || 0);
        const pIno = resultadosLoci.ino.aa || 0;
        const pGrey = resultadosLoci.grey.aa || 0;
        const pIndigo = resultadosLoci.indigo.aa || 0;
        const pViolet = resultadosLoci.violet.aa || 0;

        if (pBlue > 0 && pIno > 0) filhotes.push({ name: 'Albino', prob: Math.round(pBlue * pIno / 100), sex: 'M/F' });
        if (pVerde > 0 && pIno > 0) filhotes.push({ name: 'Lutino', prob: Math.round(pVerde * pIno / 100), sex: 'M/F' });
        if (pBlue > 0 && pIndigo > 0) filhotes.push({ name: 'Cobalto', prob: Math.round(pBlue * pIndigo / 200), sex: 'M/F' });
        if (pBlue > 0) filhotes.push({ name: 'Azul Sky', prob: Math.round(pBlue * (100 - pIno) / 100), sex: 'M/F' });
        if (pVerde > 0) {
            const pVerdeLivre = Math.round(pVerde * (100 - pIno) / 100);
            if (pVerdeLivre > 0) filhotes.push({ name: resultadosLoci.blue.Aa ? 'Verde / Azul (Split)' : 'Verde Ancestral', prob: pVerdeLivre, sex: 'M/F' });
        }
        if (pGrey > 0) filhotes.push({ name: 'Cinza', prob: pGrey, sex: 'M/F' });
        if (pIndigo > 0 && pBlue === 0) filhotes.push({ name: '├ìndigo', prob: pIndigo, sex: 'M/F' });
        if (pViolet > 0) filhotes.push({ name: 'Violeta SF', prob: pViolet, sex: 'M/F' });
        return filhotes.filter((item) => item.prob > 0).sort((a, b) => b.prob - a.prob);
    };

    const calcularCruzamentoCalopsita = (nomePai, nomeMae) => {
        const pai = calopsitaGenetica[nomePai] || calopsitaGenetica.Cinza;
        const mae = calopsitaGenetica[nomeMae] || calopsitaGenetica.Cinza;
        const loci = ['ino', 'cb', 'canela', 'opaline'];
        const filhotes = [];
        loci.forEach((locus) => {
            const result = cruzarLocus(pai[locus] || 0, mae[locus] || 0);
            const pExpr = result.aa || 0;
            const pSplit = result.Aa || 0;
            const labels = { ino: 'Lutino', cb: 'Cara Branca', canela: 'Canela', opaline: 'Arlequim' };
            if (pExpr > 0) filhotes.push({ name: labels[locus], prob: pExpr, sex: 'M/F' });
            if (pSplit > 0 && pExpr < 100) filhotes.push({ name: `Cinza / ${labels[locus]} (Split)`, prob: pSplit, sex: 'M/F' });
        });
        const todosZero = loci.every((locus) => (calopsitaGenetica[nomePai]?.[locus] || 0) === 0 && (calopsitaGenetica[nomeMae]?.[locus] || 0) === 0);
        if (todosZero || !filhotes.length) filhotes.push({ name: 'Cinza Normal', prob: 100, sex: 'M/F' });
        return filhotes.filter((item) => item.prob > 0).sort((a, b) => b.prob - a.prob);
    };
    const runCruzamento = () => {
        const grid = document.getElementById('results-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="loading-dna">Analisando muta├º├Áes...</div>';
        const especie = document.getElementById('species-select').value;
        const nomePai = document.getElementById('pai-select').value;
        const nomeMae = document.getElementById('mae-select').value;

        setTimeout(() => {
            const results = especie === 'ringneck' ? calcularCruzamentoRingneck(nomePai, nomeMae) : calcularCruzamentoCalopsita(nomePai, nomeMae);
            if (!results.length) {
                grid.innerHTML = '<div class="loading-dna">Nenhum resultado calculado para esta combina├º├úo.</div>';
                return;
            }
            const totalProb = results.reduce((sum, item) => sum + item.prob, 0);
            grid.innerHTML = `
                <div class="result-box glass mt-4">
                    <h4>Estimativa de Filhotes - ${escapeHtml(nomePai)} ├ù ${escapeHtml(nomeMae)}</h4>
                    <div class="res-list">
                        ${results.map((result) => {
                            const pct = totalProb > 0 ? Math.round(result.prob / totalProb * 100) : result.prob;
                            return `
                                <div class="res-row">
                                    <div class="bird-thumb" style="background-image:url('${galleryUrl}')"></div>
                                    <div class="res-data" style="flex:1">
                                        <strong>${escapeHtml(result.name)}</strong>
                                        <span>${pct}%</span>
                                        <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;margin-top:4px;">
                                            <div style="background:var(--primary);width:${pct}%;height:6px;border-radius:4px;"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:1rem;">* Valores aproximados baseados em heran├ºa mendeliana simples.</p>
                </div>
            `;
        }, 400);
    };

    const runIdentification = () => {
        const olhos = document.getElementById('id-olhos').value;
        const cabeca = document.getElementById('id-cabeca').value;
        const dorso = document.getElementById('id-dorso').value;
        const anel = document.getElementById('id-anel')?.value || 'normal';
        const panel = document.getElementById('id-result-panel');
        if (!panel) return;

        let fenotipo = 'Verde Ancestral';
        let notas = [];
        let genetica = '';
        const isIno = olhos === 'red';
        const isAzul = dorso === 'azul' || dorso === 'cinza';
        const isCinza = dorso === 'cinza';

        if (isIno && isAzul) {
            fenotipo = 'Albino';
            genetica = 'bb / ino ino';
            notas.push('Bloqueio total de eumelanina e faeomelanina. Confirmar por teste de cruzamento.');
        } else if (isIno) {
            fenotipo = 'Lutino';
            genetica = 'BB ou Bb / ino ino';
            notas.push('Bloqueio de eumelanina. Corpo amarelo intenso. Ligado ao sexo.');
        } else if (isCinza && cabeca === 'normal') {
            fenotipo = 'Cinza';
            genetica = 'grey grey';
            notas.push('Gene cinza autoss├┤mico dominante. Pode sobrepor azul.');
        } else if (isAzul) {
            fenotipo = 'Azul Sky';
            genetica = 'bb / +/+';
            notas.push('Dilui├º├úo de faeomelanina por dois alelos recessivos blue.');
        } else if (dorso === 'verde' && cabeca === 'cb') {
            fenotipo = 'Cara Branca';
            genetica = 'cb cb';
            notas.push('Muta├º├úo cara branca, autoss├┤mica recessiva.');
        } else if (dorso === 'verde' && cabeca === 'buttercup') {
            fenotipo = 'Buttercup / Lutino parcial';
            genetica = 'Verificar';
            notas.push('Cabe├ºa amarela intensa pode indicar Lutino ou Buttercup.');
        } else if (dorso === 'indigo') {
            fenotipo = '├ìndigo';
            genetica = 'ind ind';
            notas.push('Muta├º├úo ├¡ndigo: corpo azul-esverdeado profundo, autoss├┤mica recessiva.');
        } else if (dorso === 'violeta') {
            fenotipo = 'Violeta SF';
            genetica = 'Vt / +';
            notas.push('Violeta SF: um alelo violeta. Cor roxa no peito vis├¡vel.');
        } else {
            genetica = 'BB / +/+';
            notas.push('Fen├│tipo selvagem. Sem muta├º├Áes vis├¡veis detectadas.');
        }

        if (anel === 'amarelo') notas.push('Colar amarelo vis├¡vel - macho adulto.');
        if (anel === 'ausente') notas.push('Sem colar - f├¬mea ou jovem.');

        panel.innerHTML = `
            <div class="diagnosis-header glass mb-3">LAUDO PERICIAL</div>
            <div class="res-row glass">
                <div class="bird-thumb" style="background-image:url('${galleryUrl}')"></div>
                <div class="res-data">
                    <div class="diag-title">FEN├ôTIPO IDENTIFICADO</div>
                    <div class="diag-value" style="font-size:1.4rem;font-weight:800;color:var(--primary)">${escapeHtml(fenotipo)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Gen├│tipo prov├ível: <code>${escapeHtml(genetica)}</code></div>
                </div>
            </div>
            <div class="mt-3 p-3 glass" style="background:rgba(0,0,0,0.2);">
                <strong>Notas T├®cnicas:</strong><br>
                <ul style="margin-top:0.5rem;padding-left:1.2rem;">
                    ${notas.map((nota) => `<li style="margin-bottom:0.4rem;">${escapeHtml(nota)}</li>`).join('')}
                </ul>
            </div>
        `;
    };

    const renderFinanceiroLegacy = () => {
        const totals = DB.getTotais();
        document.getElementById('fin-entradas').textContent = formatCurrency(totals.entradas);
        document.getElementById('fin-saidas').textContent = formatCurrency(totals.saidas);
        document.getElementById('fin-saldo').textContent = formatCurrency(totals.saldo);
        document.getElementById('fin-saldo').style.color = totals.saldo >= 0 ? '#2ecc71' : '#e74c3c';

        const tbody = document.querySelector('#fin-table tbody');
        if (!tbody) return;
    };

    const DB = new StorageService();

    const exportPlantelCsv = () => {
        const header = ['Anilha', 'Espécie', 'Mutação', 'Sexo', 'Categoria', 'Nascimento', 'Recinto', 'Status'];
        const rows = DB.aves.map((ave) => [
            ave.anilha,
            ave.especie,
            ave.mutacao,
            ave.sexo,
            ave.categoria || 'Plantel',
            ave.nascimento || '',
            DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || '',
            ave.status
        ]);
        const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `plantel_criador_pro_${new Date().toISOString().split('T')[0]}.csv`);
    };
    const exportPlantelPdf = () => {
        if (!hasPdfLib) {
            alert('A biblioteca de PDF não carregou. Para usar esta função, abra a aplicação com acesso à internet ou incorpore as bibliotecas localmente.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Plantel - Criador Pro 5.0', 14, 18);
        doc.setFontSize(10);
        doc.text(`Responsável: ${DB.config.responsavel || 'Não informado'}   |   Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
        doc.autoTable({
            startY: 32,
            head: [['Anilha', 'Espécie', 'Mutação', 'Sexo', 'Categoria', 'Nascimento', 'Recinto', 'Status']],
            body: DB.aves.map((ave) => [ave.anilha, ave.especie, ave.mutacao, ave.sexo, ave.categoria || 'Plantel', ave.nascimento || '—', DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || '—', ave.status]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [251, 191, 36], textColor: 0 }
        });
        doc.save(`plantel_criador_pro_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    const renderDashboardLegacy = () => {
        const totals = DB.getTotais();
        document.getElementById('dash-aves').textContent = String(totals.total);
        document.getElementById('dash-pares').textContent = String(totals.pares);
        document.getElementById('dash-saldo').textContent = formatCurrency(totals.saldo);
    };

    const renderPlantelLegacy = () => {
        const tbody = document.querySelector('#plantel-table tbody');
        if (!tbody) return;

        const query = (document.getElementById('busca-plantel')?.value || '').trim().toLowerCase();
        const avesFiltradas = DB.aves.filter((ave) => [ave.anilha, ave.especie, ave.mutacao, ave.sexo, ave.categoria].join(' ').toLowerCase().includes(query));

        tbody.innerHTML = avesFiltradas.map((ave) => {
            const recNome = DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || '—';
            const sexoLabel = ave.sexo === 'Macho' ? '♂️' : ave.sexo === 'Fêmea' ? '♀️' : '❓';
            return `
                <tr>
                    <td><strong>${escapeHtml(ave.anilha)}</strong></td>
                    <td>${escapeHtml(ave.especie)}</td>
                    <td>${escapeHtml(ave.mutacao)}</td>
                    <td>${sexoLabel}</td>
                    <td><span class="badge-recinto badge-categoria">${escapeHtml(ave.categoria || 'Plantel')}</span></td>
                    <td>${escapeHtml(ave.nascimento || '—')}</td>
                    <td><span class="badge-recinto">${escapeHtml(recNome)}</span></td>
                    <td><span class="badge positive">${escapeHtml(ave.status)}</span></td>
                    <td>
                        <div style="display:flex;gap:6px;justify-content:flex-end;">
                            <button class="btn-open-ave" data-id="${escapeHtml(ave.id)}" style="background:#0ea5e9;border:none;cursor:pointer;color:#fff;padding:0.25rem 0.45rem;border-radius:8px;" title="Abrir ficha">Ficha</button>
                            <button class="btn-delete-ave" data-id="${escapeHtml(ave.id)}" style="background:transparent;border:none;cursor:pointer;" title="Remover">❌</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-open-ave').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                if (!id) return;
                selectedAveId = id;
                renderAveDetail();
                const panel = document.getElementById('ave-detail-panel');
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        tbody.querySelectorAll('.btn-delete-ave').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover esta ave?')) return;
                await DB.removeAve(id);
                if (selectedAveId === id) selectedAveId = null;
                renderPlantel();
                renderDashboard();
                renderRecintos();
            });
        });

        const recintoSelect = document.getElementById('add-recinto-select');
        if (recintoSelect) {
            recintoSelect.innerHTML = '<option value="">— Sem recinto —</option>' + DB.recintos.map((recinto) => `<option value="${escapeHtml(recinto.id)}">${escapeHtml(recinto.nome)}</option>`).join('');
        }

        if (selectedAveId && !DB.aves.some((ave) => ave.id === selectedAveId)) selectedAveId = null;
        if (!selectedAveId && DB.aves.length) selectedAveId = DB.aves[0].id;
        renderAveDetail();
        renderGenealogyPanel();
    };

    const renderAveDetail = () => {
        const titleEl = document.getElementById('ave-detail-title');
        const subtitleEl = document.getElementById('ave-detail-subtitle');
        const categoriaEl = document.getElementById('ave-meta-categoria');
        const matrizEl = document.getElementById('ave-meta-matriz');
        const exameEl = document.getElementById('ave-meta-exame');
        const paiEl = document.getElementById('ave-pai-anilha');
        const maeEl = document.getElementById('ave-mae-anilha');
        const linhagemEl = document.getElementById('ave-linhagem');
        const matrizStatusEl = document.getElementById('ave-matriz-status');
        const histBody = document.querySelector('#ave-hist-table tbody');
        const examBody = document.querySelector('#ave-exam-table tbody');
        const photoList = document.getElementById('ave-photo-list');
        const seasonBody = document.querySelector('#ave-season-table tbody');
        const btnReport = document.getElementById('btn-ave-report-pdf');
        if (!titleEl || !subtitleEl || !categoriaEl || !matrizEl || !exameEl || !paiEl || !maeEl || !linhagemEl || !matrizStatusEl || !histBody || !examBody || !photoList || !seasonBody || !btnReport) return;

        const ave = DB.aves.find((item) => item.id === selectedAveId);
        if (!ave) {
            titleEl.textContent = 'Ficha do Animal';
            subtitleEl.textContent = 'Selecione uma ave na tabela para abrir o histórico completo.';
            categoriaEl.textContent = '—';
            matrizEl.textContent = 'Não definido';
            exameEl.textContent = 'Sem exames';
            paiEl.value = '';
            maeEl.value = '';
            linhagemEl.value = '';
            matrizStatusEl.value = 'Nao definido';
            histBody.innerHTML = '<tr><td colspan="4" class="text-muted">Nenhum histórico cadastrado.</td></tr>';
            examBody.innerHTML = '<tr><td colspan="5" class="text-muted">Nenhum exame cadastrado.</td></tr>';
            photoList.innerHTML = '<p class="text-muted">Nenhuma foto cadastrada.</p>';
            seasonBody.innerHTML = '<tr><td colspan="6" class="text-muted">Nenhuma temporada registrada.</td></tr>';
            btnReport.disabled = true;
            renderGenealogyPanel();
            return;
        }

        const dossier = getAveDossier(ave.id);
        const hist = [...dossier.historico].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        const exames = [...dossier.exames].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        const fotos = [...dossier.fotos];
        const temporadas = [...dossier.temporadas].sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        const recNome = DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || 'Sem recinto';

        titleEl.textContent = `${ave.anilha} - ${ave.mutacao || ave.especie}`;
        subtitleEl.textContent = `${ave.especie} | ${ave.sexo} | ${recNome}`;
        categoriaEl.textContent = ave.categoria || 'Plantel';
        matrizEl.textContent = dossier.base?.matriz_status || 'Nao definido';
        exameEl.textContent = exames[0] ? `${formatDateBr(exames[0].date)} - ${exames[0].type}` : 'Sem exames';

        paiEl.value = dossier.base?.pai_anilha || '';
        maeEl.value = dossier.base?.mae_anilha || '';
        linhagemEl.value = dossier.base?.linhagem || '';
        matrizStatusEl.value = dossier.base?.matriz_status || 'Nao definido';

        histBody.innerHTML = hist.length
            ? hist.map((item) => `
                <tr>
                    <td>${escapeHtml(formatDateBr(item.date))}</td>
                    <td>${escapeHtml(item.type || '—')}</td>
                    <td>${escapeHtml(item.text || '')}</td>
                    <td><button class="btn-del-ave-hist" data-id="${escapeHtml(item.id)}" style="background:transparent;border:none;cursor:pointer;">❌</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-muted">Nenhum histórico cadastrado.</td></tr>';

        examBody.innerHTML = exames.length
            ? exames.map((item) => {
                const link = sanitizeHttpUrl(item.link);
                return `
                    <tr>
                        <td>${escapeHtml(formatDateBr(item.date))}</td>
                        <td>${escapeHtml(item.type || '—')}</td>
                        <td>${escapeHtml(item.result || '')}</td>
                        <td>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : '—'}</td>
                        <td><button class="btn-del-ave-exam" data-id="${escapeHtml(item.id)}" style="background:transparent;border:none;cursor:pointer;">❌</button></td>
                    </tr>
                `;
            }).join('')
            : '<tr><td colspan="5" class="text-muted">Nenhum exame cadastrado.</td></tr>';

        photoList.innerHTML = fotos.length
            ? fotos.map((item) => {
                const url = sanitizeImageUrl(item.url);
                return `
                    <article class="ave-photo-card">
                        ${url ? `<img src="${escapeHtml(url)}" alt="Foto de ${escapeHtml(ave.anilha)}">` : '<div class="ave-photo-placeholder">Imagem indisponível</div>'}
                        <div class="ave-photo-meta">
                            <strong>${escapeHtml(item.note || 'Sem legenda')}</strong>
                            <small>${escapeHtml(formatDateBr(item.date))}</small>
                        </div>
                        <button class="btn-del-ave-photo" data-id="${escapeHtml(item.id)}" style="background:#ef4444;border:none;cursor:pointer;color:#fff;padding:0.28rem 0.5rem;border-radius:8px;">Remover</button>
                    </article>
                `;
            }).join('')
            : '<p class="text-muted">Nenhuma foto cadastrada.</p>';

        seasonBody.innerHTML = temporadas.length
            ? temporadas.map((item) => `
                <tr>
                    <td>${escapeHtml(item.name || '—')}</td>
                    <td>${escapeHtml(String(item.ovos ?? 0))}</td>
                    <td>${escapeHtml(String(item.eclodidos ?? 0))}</td>
                    <td>${escapeHtml(String(item.desmamados ?? 0))}</td>
                    <td>${escapeHtml(item.note || '')}</td>
                    <td><button class="btn-del-ave-season" data-id="${escapeHtml(item.id)}" style="background:transparent;border:none;cursor:pointer;">❌</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="6" class="text-muted">Nenhuma temporada registrada.</td></tr>';

        histBody.querySelectorAll('.btn-del-ave-hist').forEach((button) => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                if (!itemId) return;
                updateAveDossier(ave.id, (data) => {
                    data.historico = (Array.isArray(data.historico) ? data.historico : []).filter((item) => item.id !== itemId);
                });
                renderAveDetail();
            });
        });

        examBody.querySelectorAll('.btn-del-ave-exam').forEach((button) => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                if (!itemId) return;
                updateAveDossier(ave.id, (data) => {
                    data.exames = (Array.isArray(data.exames) ? data.exames : []).filter((item) => item.id !== itemId);
                });
                renderAveDetail();
            });
        });

        photoList.querySelectorAll('.btn-del-ave-photo').forEach((button) => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                if (!itemId) return;
                updateAveDossier(ave.id, (data) => {
                    data.fotos = (Array.isArray(data.fotos) ? data.fotos : []).filter((item) => item.id !== itemId);
                });
                renderAveDetail();
            });
        });

        seasonBody.querySelectorAll('.btn-del-ave-season').forEach((button) => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                if (!itemId) return;
                updateAveDossier(ave.id, (data) => {
                    data.temporadas = (Array.isArray(data.temporadas) ? data.temporadas : []).filter((item) => item.id !== itemId);
                });
                renderAveDetail();
            });
        });

        btnReport.disabled = false;
        btnReport.setAttribute('data-ave-id', ave.id);
        renderGenealogyPanel(ave.id);
    };

    const exportAveReportPdf = (aveId) => {
        const ave = DB.aves.find((item) => item.id === aveId);
        if (!ave) {
            alert('Selecione uma ave primeiro.');
            return;
        }
        if (!hasPdfLib) {
            alert('A biblioteca de PDF não carregou. Para usar esta função, abra a aplicação com acesso à internet ou incorpore as bibliotecas localmente.');
            return;
        }

        const dossier = getAveDossier(ave.id);
        const exames = [...dossier.exames].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        const temporadas = [...dossier.temporadas];
        const hist = [...dossier.historico].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        const recintoNome = DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || 'Sem recinto';

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(15);
        doc.text(`Ficha do Animal - ${ave.anilha}`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Espécie: ${ave.especie} | Mutação: ${ave.mutacao} | Sexo: ${ave.sexo}`, 14, 24);
        doc.text(`Categoria: ${ave.categoria || 'Plantel'} | Recinto: ${recintoNome}`, 14, 30);
        doc.text(`Nascimento: ${ave.nascimento || '—'} | Matriz: ${dossier.base?.matriz_status || 'Nao definido'}`, 14, 36);
        doc.text(`Pai: ${dossier.base?.pai_anilha || '—'} | Mãe: ${dossier.base?.mae_anilha || '—'}`, 14, 42);
        doc.text(`Linhagem: ${dossier.base?.linhagem || '—'}`, 14, 48);

        doc.autoTable({
            startY: 54,
            head: [['Histórico', 'Tipo', 'Descrição']],
            body: hist.length ? hist.map((item) => [formatDateBr(item.date), item.type || '—', item.text || '']) : [['—', '—', 'Sem histórico']],
            styles: { fontSize: 8.3 },
            headStyles: { fillColor: [14, 165, 233], textColor: 255 }
        });

        const examStart = doc.lastAutoTable.finalY + 6;
        doc.autoTable({
            startY: examStart,
            head: [['Exames', 'Resultado', 'Data']],
            body: exames.length ? exames.map((item) => [item.type || '—', item.result || '—', formatDateBr(item.date)]) : [['Sem exames', '—', '—']],
            styles: { fontSize: 8.2 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255 }
        });

        const seasonStart = doc.lastAutoTable.finalY + 6;
        doc.autoTable({
            startY: seasonStart,
            head: [['Temporada', 'Ovos', 'Eclodidos', 'Desmamados', 'Notas']],
            body: temporadas.length
                ? temporadas.map((item) => [
                    item.name || '—',
                    String(item.ovos ?? 0),
                    String(item.eclodidos ?? 0),
                    String(item.desmamados ?? 0),
                    item.note || ''
                ])
                : [['Sem temporadas', '0', '0', '0', '—']],
            styles: { fontSize: 8 },
            headStyles: { fillColor: [251, 191, 36], textColor: 0 }
        });

        doc.save(`ficha_${ave.anilha}_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    const normalizeAnilha = (value) => String(value || '').trim().toUpperCase();

    const findAveByAnilha = (anilha) => {
        const tag = normalizeAnilha(anilha);
        if (!tag) return null;
        return DB.aves.find((ave) => normalizeAnilha(ave.anilha) === tag) || null;
    };

    const getPairRegistry = () => {
        const pairMap = new Map();
        DB.aves.forEach((filhote) => {
            const dossier = getAveDossier(filhote.id);
            const paiTag = normalizeAnilha(dossier.base?.pai_anilha);
            const maeTag = normalizeAnilha(dossier.base?.mae_anilha);
            if (!paiTag || !maeTag) return;

            const key = `${paiTag}__${maeTag}`;
            if (!pairMap.has(key)) {
                pairMap.set(key, {
                    key,
                    paiTag,
                    maeTag,
                    pai: findAveByAnilha(paiTag),
                    mae: findAveByAnilha(maeTag),
                    filhotes: []
                });
            }
            const pair = pairMap.get(key);
            pair.filhotes.push(filhote);
        });

        return Array.from(pairMap.values())
            .map((pair) => ({
                ...pair,
                filhotes: pair.filhotes.sort((a, b) => String(b.nascimento || '').localeCompare(String(a.nascimento || '')))
            }))
            .sort((a, b) => b.filhotes.length - a.filhotes.length || a.key.localeCompare(b.key));
    };

    const renderGenealogyPanel = (forcedRootId = '') => {
        const rootSelect = document.getElementById('genealogy-root-select');
        const speciesFilterEl = document.getElementById('genealogy-filter-species');
        const categoryFilterEl = document.getElementById('genealogy-filter-category');
        const graphPanel = document.getElementById('genealogy-graph');
        const parentsPanel = document.getElementById('genealogy-parents');
        const couplesBody = document.querySelector('#genealogy-couples-table tbody');
        const childrenBody = document.querySelector('#genealogy-children-table tbody');
        const allCouplesBody = document.querySelector('#genealogy-all-couples-table tbody');
        if (!rootSelect || !speciesFilterEl || !categoryFilterEl || !graphPanel || !parentsPanel || !couplesBody || !childrenBody || !allCouplesBody) return;

        const sortedAves = [...DB.aves].sort((a, b) => String(a.anilha || '').localeCompare(String(b.anilha || '')));
        const speciesValues = Array.from(new Set(DB.aves.map((ave) => String(ave.especie || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        const categoryValues = Array.from(new Set(DB.aves.map((ave) => String(ave.categoria || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        const prevSpecies = speciesFilterEl.value || 'all';
        const prevCategory = categoryFilterEl.value || 'all';
        speciesFilterEl.innerHTML = ['<option value="all">Espécie: todas</option>', ...speciesValues.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)].join('');
        categoryFilterEl.innerHTML = ['<option value="all">Categoria: todas</option>', ...categoryValues.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)].join('');
        speciesFilterEl.value = speciesValues.includes(prevSpecies) ? prevSpecies : 'all';
        categoryFilterEl.value = categoryValues.includes(prevCategory) ? prevCategory : 'all';

        const activeSpecies = speciesFilterEl.value;
        const activeCategory = categoryFilterEl.value;
        const matchesFilters = (ave) => {
            if (!ave) return false;
            if (activeSpecies !== 'all' && String(ave.especie || '') !== activeSpecies) return false;
            if (activeCategory !== 'all' && String(ave.categoria || '') !== activeCategory) return false;
            return true;
        };

        const currentSelected = rootSelect.value;
        let rootId = forcedRootId || currentSelected || selectedAveId || sortedAves[0]?.id || '';
        if (!sortedAves.some((ave) => ave.id === rootId)) {
            rootId = selectedAveId && sortedAves.some((ave) => ave.id === selectedAveId) ? selectedAveId : (sortedAves[0]?.id || '');
        }

        rootSelect.innerHTML = sortedAves.length
            ? sortedAves.map((ave) => `<option value="${escapeHtml(ave.id)}">${escapeHtml(ave.anilha)} - ${escapeHtml(ave.mutacao || ave.especie)}</option>`).join('')
            : '<option value="">Sem aves no plantel</option>';
        rootSelect.value = rootId;

        const rootAve = DB.aves.find((ave) => ave.id === rootId);
        if (!rootAve) {
            graphPanel.innerHTML = '<p class="text-muted">Cadastre aves no plantel para montar o grafo genealógico.</p>';
            parentsPanel.innerHTML = '<p class="text-muted">Cadastre aves no plantel para montar a árvore genealógica.</p>';
            couplesBody.innerHTML = '<tr><td colspan="3" class="text-muted">Sem dados para exibir.</td></tr>';
            childrenBody.innerHTML = '<tr><td colspan="4" class="text-muted">Sem dados para exibir.</td></tr>';
            allCouplesBody.innerHTML = '<tr><td colspan="3" class="text-muted">Sem dados para exibir.</td></tr>';
            return;
        }

        const rootTag = normalizeAnilha(rootAve.anilha);
        const rootDossier = getAveDossier(rootAve.id);
        const paiTag = normalizeAnilha(rootDossier.base?.pai_anilha);
        const maeTag = normalizeAnilha(rootDossier.base?.mae_anilha);
        const paiAve = findAveByAnilha(paiTag);
        const maeAve = findAveByAnilha(maeTag);
        const paiDossier = paiAve ? getAveDossier(paiAve.id) : null;
        const maeDossier = maeAve ? getAveDossier(maeAve.id) : null;

        const avoPaternoTag = normalizeAnilha(paiDossier?.base?.pai_anilha);
        const avoPaternaTag = normalizeAnilha(paiDossier?.base?.mae_anilha);
        const avoMaternoTag = normalizeAnilha(maeDossier?.base?.pai_anilha);
        const avoMaternaTag = normalizeAnilha(maeDossier?.base?.mae_anilha);

        const avoPaternoAve = findAveByAnilha(avoPaternoTag);
        const avoPaternaAve = findAveByAnilha(avoPaternaTag);
        const avoMaternoAve = findAveByAnilha(avoMaternoTag);
        const avoMaternaAve = findAveByAnilha(avoMaternaTag);

        const pairRegistry = getPairRegistry();
        const couplesForRootRaw = pairRegistry.filter((pair) => pair.paiTag === rootTag || pair.maeTag === rootTag);
        const couplesForRoot = couplesForRootRaw
            .map((pair) => ({
                ...pair,
                filhotes: pair.filhotes.filter(matchesFilters)
            }))
            .filter((pair) => pair.filhotes.length > 0);

        const childrenForRoot = DB.aves
            .filter((ave) => {
                const dossier = getAveDossier(ave.id);
                const childPai = normalizeAnilha(dossier.base?.pai_anilha);
                const childMae = normalizeAnilha(dossier.base?.mae_anilha);
                return (childPai === rootTag || childMae === rootTag) && matchesFilters(ave);
            })
            .map((ave) => {
                const dossier = getAveDossier(ave.id);
                const childPai = normalizeAnilha(dossier.base?.pai_anilha);
                const childMae = normalizeAnilha(dossier.base?.mae_anilha);
                const coParentTag = childPai === rootTag ? childMae : childPai;
                const coParent = findAveByAnilha(coParentTag);
                return {
                    ave,
                    coParentTag,
                    coParent,
                    temporadas: Array.isArray(dossier.temporadas) ? dossier.temporadas.length : 0
                };
            })
            .sort((a, b) => String(b.ave.nascimento || '').localeCompare(String(a.ave.nascimento || '')));

        const childTags = new Set(childrenForRoot.map((item) => normalizeAnilha(item.ave.anilha)).filter(Boolean));
        const grandchildrenMap = new Map();
        DB.aves.forEach((ave) => {
            const dossier = getAveDossier(ave.id);
            const childPai = normalizeAnilha(dossier.base?.pai_anilha);
            const childMae = normalizeAnilha(dossier.base?.mae_anilha);
            if (!childTags.has(childPai) && !childTags.has(childMae)) return;
            if (!matchesFilters(ave)) return;
            const viaTag = childTags.has(childPai) ? childPai : childMae;
            const viaAve = findAveByAnilha(viaTag);
            grandchildrenMap.set(ave.id, { ave, viaTag, viaAve });
        });
        const grandchildren = Array.from(grandchildrenMap.values())
            .sort((a, b) => String(b.ave.nascimento || '').localeCompare(String(a.ave.nascimento || '')));

        const pendencias = [];
        if (!paiTag) pendencias.push('Pai não informado na ficha.');
        if (paiTag && !paiAve) pendencias.push(`Pai (${paiTag}) não encontrado no plantel.`);
        if (!maeTag) pendencias.push('Mãe não informada na ficha.');
        if (maeTag && !maeAve) pendencias.push(`Mãe (${maeTag}) não encontrada no plantel.`);
        if (!String(rootDossier.base?.linhagem || '').trim()) pendencias.push('Linhagem não preenchida.');

        const sharedGrandParents = [avoPaternoTag, avoPaternaTag].filter(Boolean)
            .filter((tag) => [avoMaternoTag, avoMaternaTag].includes(tag));
        const consanguinitySignals = [];
        const riskTags = new Set();
        if (paiTag && maeTag && paiTag === maeTag) {
            consanguinitySignals.push('Pai e mãe informados com a mesma anilha.');
            riskTags.add(paiTag);
            riskTags.add(maeTag);
        }
        if (sharedGrandParents.length) {
            consanguinitySignals.push(`Pais compartilham ancestral em comum: ${sharedGrandParents.join(', ')}.`);
            sharedGrandParents.forEach((tag) => riskTags.add(tag));
            if (paiTag) riskTags.add(paiTag);
            if (maeTag) riskTags.add(maeTag);
        }

        const parentLine = (label, tag, aveRef) => `
            <div class="genealogy-parent-line">
                <span class="genealogy-parent-label">${label}</span>
                <span><strong>${escapeHtml(tag || '—')}</strong>${aveRef ? ` • ${escapeHtml(aveRef.mutacao || aveRef.especie)}` : (tag ? ' • Externo ao plantel' : '')}</span>
            </div>
        `;

        const graphNode = (title, tag, aveRef, subtitle = '', extraClass = '') => {
            const tagNorm = normalizeAnilha(tag);
            const riskClass = tagNorm && riskTags.has(tagNorm) ? 'risk' : '';
            return `
                <article class="genealogy-node ${extraClass} ${riskClass}" ${aveRef?.id ? `data-root-id="${escapeHtml(aveRef.id)}"` : ''}>
                    <span class="genealogy-node-title">${escapeHtml(title)}</span>
                    <span class="genealogy-node-main">${escapeHtml(tag || '—')}</span>
                    <span class="genealogy-node-sub">${escapeHtml(subtitle || (aveRef ? `${aveRef.mutacao || aveRef.especie} • ${aveRef.sexo || 'Indefinido'}` : (tag ? 'Referência externa ao plantel' : 'Não informado')))}</span>
                </article>
            `;
        };

        const lane = (title, nodesHtml) => `
            <section class="genealogy-lane">
                <span class="genealogy-lane-title">${escapeHtml(title)}</span>
                <div class="genealogy-lane-nodes">
                    ${nodesHtml}
                </div>
            </section>
        `;

        const avosNodes = [
            graphNode('Avô paterno', avoPaternoTag, avoPaternoAve),
            graphNode('Avó paterna', avoPaternaTag, avoPaternaAve),
            graphNode('Avô materno', avoMaternoTag, avoMaternoAve),
            graphNode('Avó materna', avoMaternaTag, avoMaternaAve)
        ].join('');

        const paisNodes = [
            graphNode('Pai', paiTag, paiAve),
            graphNode('Mãe', maeTag, maeAve)
        ].join('');

        const filhosNodes = childrenForRoot.length
            ? childrenForRoot.map((item) => graphNode(
                'Filho(a)',
                item.ave.anilha,
                item.ave,
                `Co-genitor: ${item.coParent?.anilha || item.coParentTag || 'não informado'}`
            )).join('')
            : graphNode('Filho(a)', '', null, 'Sem filhotes diretos vinculados', 'external');

        const netosNodes = grandchildren.length
            ? grandchildren.map((item) => graphNode(
                'Neto(a)',
                item.ave.anilha,
                item.ave,
                `Via: ${item.viaAve?.anilha || item.viaTag || 'não identificado'}`
            )).join('')
            : graphNode('Neto(a)', '', null, 'Sem netos detectados na base', 'external');

        const renderLaneBlock = (title, nodes) => `${lane(title, nodes)}<div class="genealogy-connector" aria-hidden="true">↓</div>`;
        graphPanel.innerHTML = [
            renderLaneBlock('Geração dos avós', avosNodes),
            renderLaneBlock('Geração dos pais', paisNodes),
            renderLaneBlock('Raiz analisada', graphNode('Raiz', rootAve.anilha, rootAve, `Linhagem: ${rootDossier.base?.linhagem || 'não informada'}`, 'root')),
            renderLaneBlock('Filhos diretos', filhosNodes),
            lane('Netos mapeados', netosNodes),
            consanguinitySignals.length
                ? `<div class="genealogy-risk"><strong>Risco de consanguinidade:</strong><ul>${consanguinitySignals.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
                : '<div class="genealogy-risk ok">Sem indícios diretos de consanguinidade nas 3 gerações mapeadas.</div>'
        ].join('');

        graphPanel.querySelectorAll('[data-root-id]').forEach((node) => {
            node.addEventListener('click', () => {
                const nextRootId = node.getAttribute('data-root-id');
                if (!nextRootId) return;
                selectedAveId = nextRootId;
                renderAveDetail();
            });
        });

        parentsPanel.innerHTML = `
            <div class="genealogy-parent-card">
                <div class="genealogy-parent-line"><span class="genealogy-parent-label">Raiz</span><span><strong>${escapeHtml(rootAve.anilha)}</strong> • ${escapeHtml(rootAve.mutacao || rootAve.especie)} (${escapeHtml(rootAve.sexo || 'Indefinido')})</span></div>
                ${parentLine('Pai', paiTag, paiAve)}
                ${parentLine('Mãe', maeTag, maeAve)}
                <div class="genealogy-parent-line"><span class="genealogy-parent-label">Linhagem</span><span>${escapeHtml(rootDossier.base?.linhagem || '—')}</span></div>
                <div class="genealogy-parent-line"><span class="genealogy-parent-label">Filhotes diretos (filtro)</span><span>${childrenForRoot.length}</span></div>
            </div>
            ${pendencias.length ? `<ul class="genealogy-alert-list">${pendencias.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="text-muted" style="margin-top:0.7rem;">Dados genealógicos completos para esta ave.</p>'}
        `;

        couplesBody.innerHTML = couplesForRoot.length
            ? couplesForRoot.map((pair) => `
                <tr>
                    <td>${escapeHtml((pair.pai?.anilha || pair.paiTag) + ' × ' + (pair.mae?.anilha || pair.maeTag))}</td>
                    <td>${pair.filhotes.length}</td>
                    <td>${pair.filhotes[0]?.nascimento ? escapeHtml(formatDateBr(pair.filhotes[0].nascimento)) : '—'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" class="text-muted">Sem casais visíveis com os filtros atuais.</td></tr>';

        childrenBody.innerHTML = childrenForRoot.length
            ? childrenForRoot.map((item) => `
                <tr>
                    <td>${escapeHtml(item.ave.anilha)}</td>
                    <td>${escapeHtml(item.ave.mutacao || '—')}<br><span class="text-muted small">Co-genitor: ${escapeHtml(item.coParent?.anilha || item.coParentTag || 'não informado')}</span></td>
                    <td>${escapeHtml(formatDateBr(item.ave.nascimento))}</td>
                    <td>${item.temporadas}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-muted">Sem filhotes vinculados dentro dos filtros selecionados.</td></tr>';

        const allCouplesFiltered = pairRegistry
            .map((pair) => ({
                ...pair,
                filhotes: pair.filhotes.filter(matchesFilters)
            }))
            .filter((pair) => pair.filhotes.length > 0);

        allCouplesBody.innerHTML = allCouplesFiltered.length
            ? allCouplesFiltered.map((pair) => `
                <tr>
                    <td>${escapeHtml((pair.pai?.anilha || pair.paiTag) + ' × ' + (pair.mae?.anilha || pair.maeTag))}</td>
                    <td>${pair.filhotes.length}</td>
                    <td>${escapeHtml(`${pair.pai ? 'Pai interno' : 'Pai externo'} | ${pair.mae ? 'Mãe interna' : 'Mãe externa'}`)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" class="text-muted">Nenhum casal encontrado com os filtros atuais.</td></tr>';
    };

    const exportGenealogyPdf = (rootId = '') => {
        if (!hasPdfLib) {
            alert('A biblioteca de PDF não carregou. Para usar esta função, abra a aplicação com acesso à internet ou incorpore as bibliotecas localmente.');
            return;
        }

        const speciesFilter = document.getElementById('genealogy-filter-species')?.value || 'all';
        const categoryFilter = document.getElementById('genealogy-filter-category')?.value || 'all';
        const root = DB.aves.find((ave) => ave.id === (rootId || selectedAveId));
        if (!root) {
            alert('Selecione uma ave para exportar a genealogia.');
            return;
        }

        const matchesFilters = (ave) => {
            if (!ave) return false;
            if (speciesFilter !== 'all' && String(ave.especie || '') !== speciesFilter) return false;
            if (categoryFilter !== 'all' && String(ave.categoria || '') !== categoryFilter) return false;
            return true;
        };

        const rootDossier = getAveDossier(root.id);
        const paiTag = normalizeAnilha(rootDossier.base?.pai_anilha);
        const maeTag = normalizeAnilha(rootDossier.base?.mae_anilha);
        const paiAve = findAveByAnilha(paiTag);
        const maeAve = findAveByAnilha(maeTag);
        const children = DB.aves
            .filter((ave) => {
                const dossier = getAveDossier(ave.id);
                const childPai = normalizeAnilha(dossier.base?.pai_anilha);
                const childMae = normalizeAnilha(dossier.base?.mae_anilha);
                return (childPai === normalizeAnilha(root.anilha) || childMae === normalizeAnilha(root.anilha)) && matchesFilters(ave);
            })
            .sort((a, b) => String(b.nascimento || '').localeCompare(String(a.nascimento || '')));

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Genealogia - ${root.anilha}`, 14, 16);
        doc.setFontSize(10);
        doc.text(`Espécie filtro: ${speciesFilter === 'all' ? 'todas' : speciesFilter}`, 14, 24);
        doc.text(`Categoria filtro: ${categoryFilter === 'all' ? 'todas' : categoryFilter}`, 14, 30);
        doc.text(`Raiz: ${root.anilha} | ${root.mutacao || root.especie} | ${root.sexo || 'Indefinido'}`, 14, 36);
        doc.text(`Pai: ${paiTag || '—'} | Mãe: ${maeTag || '—'}`, 14, 42);
        doc.text(`Linhagem: ${rootDossier.base?.linhagem || '—'}`, 14, 48);

        doc.autoTable({
            startY: 54,
            head: [['Filhos diretos', 'Mutação', 'Nascimento', 'Categoria']],
            body: children.length
                ? children.map((item) => [item.anilha, item.mutacao || '—', formatDateBr(item.nascimento), item.categoria || '—'])
                : [['Sem filhos para os filtros atuais', '—', '—', '—']],
            styles: { fontSize: 8.5 },
            headStyles: { fillColor: [14, 165, 233], textColor: 255 }
        });

        doc.save(`genealogia_${root.anilha}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportGenealogyPng = async (rootId = '', options = {}) => {
        const graphPanel = document.getElementById('genealogy-graph');
        if (!graphPanel) {
            alert('Painel da genealogia não encontrado.');
            return;
        }

        const root = DB.aves.find((ave) => ave.id === (rootId || selectedAveId));
        if (!root) {
            alert('Selecione uma ave para exportar o laudo.');
            return;
        }

        const rootDossier = getAveDossier(root.id);
        const paiTag = normalizeAnilha(rootDossier.base?.pai_anilha);
        const maeTag = normalizeAnilha(rootDossier.base?.mae_anilha);
        const recNome = DB.recintos.find((recinto) => recinto.id === root.recinto)?.nome || 'Sem recinto';
        const speciesFilter = document.getElementById('genealogy-filter-species')?.value || 'all';
        const categoryFilter = document.getElementById('genealogy-filter-category')?.value || 'all';

        const lanes = Array.from(graphPanel.querySelectorAll('.genealogy-lane')).map((laneEl) => ({
            title: laneEl.querySelector('.genealogy-lane-title')?.textContent?.trim() || '',
            nodes: Array.from(laneEl.querySelectorAll('.genealogy-node')).map((nodeEl) => ({
                title: nodeEl.querySelector('.genealogy-node-title')?.textContent?.trim() || '',
                main: nodeEl.querySelector('.genealogy-node-main')?.textContent?.trim() || '',
                sub: nodeEl.querySelector('.genealogy-node-sub')?.textContent?.trim() || '',
                isRoot: nodeEl.classList.contains('root'),
                isRisk: nodeEl.classList.contains('risk'),
                isExternal: nodeEl.classList.contains('external')
            }))
        })).filter((lane) => lane.nodes.length);

        if (!lanes.length) {
            alert('Não há dados de grafo para exportar.');
            return;
        }

        const perfil = DB.perfil || {};
        const nomeCriatorio = perfil.nome_criatorio || DB.config?.responsavel || 'Criador Pro';
        const responsavel = perfil.responsavel || DB.config?.responsavel || 'Não informado';
        const ibama = perfil.ibama_ctf || 'Não informado';
        const documento = perfil.documento || 'Não informado';
        const endereco = perfil.endereco || 'Não informado';
        const logoUrl = sanitizeImageUrl(perfil.logo_url || '');
        const riskNote = graphPanel.querySelector('.genealogy-risk')?.textContent?.trim() || 'Sem observações de risco.';

        const canvasW = 1600;
        const canvasH = 2200;
        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            alert('Não foi possível inicializar o canvas para exportação.');
            return;
        }

        const drawRoundedRect = (x, y, w, h, r, fill, stroke) => {
            const radius = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (fill) {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            if (stroke) {
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };

        const wrapText = (text, maxWidth, maxLines = 3) => {
            const words = String(text || '').split(/\s+/).filter(Boolean);
            const lines = [];
            let line = '';
            words.forEach((word) => {
                const testLine = line ? `${line} ${word}` : word;
                if (ctx.measureText(testLine).width <= maxWidth || !line) {
                    line = testLine;
                } else if (lines.length < maxLines) {
                    lines.push(line);
                    line = word;
                }
            });
            if (line && lines.length < maxLines) lines.push(line);
            return lines;
        };

        const loadImage = (src) => new Promise((resolve) => {
            if (!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
        drawRoundedRect(32, 32, canvasW - 64, canvasH - 64, 22, null, '#0f172a');

        // Cabeçalho institucional
        drawRoundedRect(70, 70, canvasW - 140, 260, 18, '#0f172a', '#1e293b');
        const logoImg = await loadImage(logoUrl);
        if (logoImg) {
            const logoBox = 180;
            const ratio = Math.min(logoBox / logoImg.width, logoBox / logoImg.height);
            const w = Math.max(1, Math.round(logoImg.width * ratio));
            const h = Math.max(1, Math.round(logoImg.height * ratio));
            const x = 98 + ((logoBox - w) / 2);
            const y = 100 + ((logoBox - h) / 2);
            drawRoundedRect(98, 100, logoBox, logoBox, 14, '#ffffff', '#cbd5e1');
            ctx.drawImage(logoImg, x, y, w, h);
        } else {
            drawRoundedRect(98, 100, 180, 180, 14, '#111827', '#334155');
            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 22px Outfit, Arial, sans-serif';
            ctx.fillText('LOGO', 148, 196);
        }

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 42px Outfit, Arial, sans-serif';
        ctx.fillText('LAUDO GENEALÓGICO DE VENDA', 320, 146);
        ctx.font = '700 30px Outfit, Arial, sans-serif';
        ctx.fillText(String(nomeCriatorio).toUpperCase(), 320, 190);
        ctx.font = '500 20px Outfit, Arial, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`Responsável: ${responsavel}`, 320, 226);
        ctx.fillText(`IBAMA/CTF: ${ibama}   |   Documento: ${documento}`, 320, 258);
        const endLines = wrapText(`Endereço: ${endereco}`, 1180, 2);
        endLines.forEach((line, idx) => ctx.fillText(line, 320, 286 + (idx * 24)));

        // Bloco de identificação do animal
        drawRoundedRect(70, 360, canvasW - 140, 220, 14, '#f8fafc', '#cbd5e1');
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 28px Outfit, Arial, sans-serif';
        ctx.fillText(`Animal: ${root.anilha}`, 96, 406);
        ctx.font = '500 20px Outfit, Arial, sans-serif';
        ctx.fillText(`Espécie: ${root.especie || '—'}   |   Mutação: ${root.mutacao || '—'}   |   Sexo: ${root.sexo || '—'}`, 96, 440);
        ctx.fillText(`Nascimento: ${formatDateBr(root.nascimento)}   |   Categoria: ${root.categoria || '—'}   |   Recinto: ${recNome}`, 96, 470);
        ctx.fillText(`Pai: ${paiTag || '—'}   |   Mãe: ${maeTag || '—'}`, 96, 500);
        ctx.fillText(`Linhagem: ${rootDossier.base?.linhagem || '—'}`, 96, 530);
        ctx.font = '500 18px Outfit, Arial, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(`Filtro aplicado no laudo: espécie ${speciesFilter === 'all' ? 'todas' : speciesFilter} | categoria ${categoryFilter === 'all' ? 'todas' : categoryFilter}`, 96, 560);

        // Grafo resumido (versão documento)
        const laneStartY = 620;
        const laneGap = 20;
        const laneH = 220;
        const laneW = canvasW - 140;
        const nodeW = 280;
        const nodeH = 120;
        const nodeGap = 16;
        const maxCols = 5;

        lanes.slice(0, 5).forEach((lane, laneIdx) => {
            const laneX = 70;
            const laneY = laneStartY + (laneIdx * (laneH + laneGap));
            drawRoundedRect(laneX, laneY, laneW, laneH, 12, '#0b1220', '#1e293b');
            ctx.fillStyle = '#93c5fd';
            ctx.font = '700 18px Outfit, Arial, sans-serif';
            ctx.fillText(lane.title, laneX + 16, laneY + 30);

            lane.nodes.slice(0, 10).forEach((node, nodeIdx) => {
                const col = nodeIdx % maxCols;
                const row = Math.floor(nodeIdx / maxCols);
                const x = laneX + 16 + (col * (nodeW + nodeGap));
                const y = laneY + 46 + (row * (nodeH + 10));
                const fill = node.isRoot ? '#164e63' : node.isExternal ? '#3f2a12' : '#111827';
                const stroke = node.isRisk ? '#f97316' : node.isRoot ? '#22d3ee' : '#334155';
                drawRoundedRect(x, y, nodeW, nodeH, 10, fill, stroke);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '700 12px Outfit, Arial, sans-serif';
                ctx.fillText(node.title, x + 10, y + 18);
                ctx.fillStyle = '#f8fafc';
                ctx.font = '700 16px Outfit, Arial, sans-serif';
                ctx.fillText(node.main || '—', x + 10, y + 44);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '12px Outfit, Arial, sans-serif';
                wrapText(node.sub || '', nodeW - 20, 2).forEach((line, idx) => {
                    ctx.fillText(line, x + 10, y + 66 + (idx * 16));
                });
            });
        });

        // Risco e observações
        drawRoundedRect(70, 1805, canvasW - 140, 140, 12, '#fff7ed', '#fdba74');
        ctx.fillStyle = '#9a3412';
        ctx.font = '700 20px Outfit, Arial, sans-serif';
        ctx.fillText('Observações de Consanguinidade', 96, 1840);
        ctx.fillStyle = '#7c2d12';
        ctx.font = '15px Outfit, Arial, sans-serif';
        wrapText(riskNote, canvasW - 210, 3).forEach((line, idx) => {
            ctx.fillText(line, 96, 1868 + (idx * 22));
        });

        // Rodapé de entrega/assinatura
        drawRoundedRect(70, 1965, canvasW - 140, 150, 12, '#f8fafc', '#cbd5e1');
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 18px Outfit, Arial, sans-serif';
        ctx.fillText('Comprador: ____________________________________________', 96, 2010);
        ctx.fillText('Data da entrega: ____/____/________', 96, 2042);
        ctx.fillText('Assinatura do responsável: _______________________________', 96, 2074);
        ctx.fillStyle = '#64748b';
        ctx.font = '500 14px Outfit, Arial, sans-serif';
        ctx.fillText(`Documento gerado em ${new Date().toLocaleString('pt-BR')} | ${nomeCriatorio}`, 96, 2102);

        if (options.returnCanvas) {
            return { canvas, root };
        }

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
        if (!blob) {
            alert('Falha ao gerar o laudo em PNG.');
            return;
        }
        downloadBlob(blob, `laudo_genealogico_${root.anilha}_${new Date().toISOString().split('T')[0]}.png`);
    };

    const exportGenealogyLaudoPdf = async (rootId = '') => {
        if (!hasPdfLib) {
            alert('A biblioteca de PDF não carregou. Para usar esta função, abra a aplicação com acesso à internet ou incorpore as bibliotecas localmente.');
            return;
        }

        const report = await exportGenealogyPng(rootId, { returnCanvas: true });
        if (!report?.canvas || !report?.root) return;

        const { canvas, root } = report;
        const imageData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 8;
        const usableW = pageW - (margin * 2);
        const usableH = pageH - (margin * 2);
        const imageH = (canvas.height * usableW) / canvas.width;

        let heightLeft = imageH;
        let y = margin;
        doc.addImage(imageData, 'PNG', margin, y, usableW, imageH, undefined, 'FAST');
        heightLeft -= usableH;

        while (heightLeft > 0) {
            doc.addPage();
            y = margin - (imageH - heightLeft);
            doc.addImage(imageData, 'PNG', margin, y, usableW, imageH, undefined, 'FAST');
            heightLeft -= usableH;
        }

        doc.save(`laudo_genealogico_${root.anilha}_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    const renderRecintoDetail = () => {
        const titleEl = document.getElementById('recinto-detail-title');
        const subtitleEl = document.getElementById('recinto-detail-subtitle');
        const tipoEl = document.getElementById('recinto-meta-tipo');
        const avesEl = document.getElementById('recinto-meta-aves');
        const ultimaEl = document.getElementById('recinto-meta-ultima');
        const notesTbody = document.querySelector('#rec-notes-table tbody');
        const btnLabelPdf = document.getElementById('btn-recinto-label-pdf');
        if (!titleEl || !subtitleEl || !tipoEl || !avesEl || !ultimaEl || !notesTbody || !btnLabelPdf) return;

        const recinto = DB.recintos.find((item) => item.id === selectedRecintoId);
        if (!recinto) {
            titleEl.textContent = 'Ficha do Recinto';
            subtitleEl.textContent = 'Selecione um recinto para abrir os dados técnicos e o histórico.';
            tipoEl.textContent = '—';
            avesEl.textContent = '0';
            ultimaEl.textContent = 'Sem histórico';
            notesTbody.innerHTML = '<tr><td colspan="4" class="text-muted">Nenhum registro encontrado.</td></tr>';
            btnLabelPdf.disabled = true;
            return;
        }

        const avesNoRecinto = DB.aves.filter((ave) => ave.recinto === recinto.id);
        const notes = getRecintoNotes(recinto.id);
        const lastNote = notes[0];

        titleEl.textContent = `${recinto.nome} (${recinto.id})`;
        subtitleEl.textContent = recinto.descricao || 'Sem descrição cadastrada.';
        tipoEl.textContent = recinto.tipo;
        avesEl.textContent = String(avesNoRecinto.length);
        ultimaEl.textContent = lastNote ? `${lastNote.date} - ${lastNote.type}` : 'Sem histórico';
        btnLabelPdf.disabled = false;
        btnLabelPdf.setAttribute('data-recinto-id', recinto.id);

        notesTbody.innerHTML = notes.length
            ? notes.map((note) => `
                <tr>
                    <td>${escapeHtml(note.date)}</td>
                    <td>${escapeHtml(note.type)}</td>
                    <td>${escapeHtml(note.text)}</td>
                    <td><button class="btn-del-note" data-note-id="${escapeHtml(note.id)}" style="background:transparent;border:none;cursor:pointer;">❌</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-muted">Nenhuma anotação para este recinto.</td></tr>';

        notesTbody.querySelectorAll('.btn-del-note').forEach((button) => {
            button.addEventListener('click', () => {
                const noteId = button.getAttribute('data-note-id');
                if (!noteId || !selectedRecintoId) return;
                removeRecintoNote(selectedRecintoId, noteId);
                renderRecintoDetail();
            });
        });
    };

    const exportRecintoLabelPdf = (recintoId) => {
        const recinto = DB.recintos.find((item) => item.id === recintoId);
        if (!recinto) {
            alert('Selecione um recinto primeiro.');
            return;
        }
        if (!hasPdfLib) {
            alert('Biblioteca de PDF indisponível.');
            return;
        }
        const avesNoRecinto = DB.aves.filter((ave) => ave.recinto === recinto.id);
        const notes = getRecintoNotes(recinto.id);
        const latest = notes[0];
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Placa do Recinto: ${recinto.nome}`, 14, 18);
        doc.setFontSize(11);
        doc.text(`ID: ${recinto.id}`, 14, 28);
        doc.text(`Tipo: ${recinto.tipo}`, 14, 35);
        doc.text(`Aves alocadas: ${avesNoRecinto.length}`, 14, 42);
        doc.text(`Descricao: ${recinto.descricao || 'Sem descricao'}`, 14, 49);
        doc.text(`Ultima anotacao: ${latest ? `${latest.date} - ${latest.type}` : 'Sem historico'}`, 14, 56);
        doc.autoTable({
            startY: 64,
            head: [['Anilha', 'Especie', 'Mutacao', 'Sexo']],
            body: avesNoRecinto.map((ave) => [ave.anilha, ave.especie, ave.mutacao, ave.sexo]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [251, 191, 36], textColor: 0 }
        });
        doc.save(`placa_recinto_${recinto.id}.pdf`);
    };

    const renderRecintosLegacy = () => {
        const container = document.getElementById('recintos-grid-container');
        if (!container) return;
        container.innerHTML = '';

        DB.recintos.forEach((recinto) => {
            const color = recinto.tipo === 'Quarentena' ? '#e74c3c' : recinto.tipo === 'Matrizes' ? '#fbbf24' : '#2ecc71';
            const avesNoRecinto = DB.aves.filter((ave) => ave.recinto === recinto.id);
            const card = document.createElement('div');
            card.className = 'glass p-4';
            card.style.borderTop = `4px solid ${color}`;
            const qrMarkup = hasQrLib ? `<div style="background:white;padding:10px;border-radius:8px;display:inline-block;margin:0.5rem 0;"><div id="qr-${escapeHtml(recinto.id)}"></div></div>` : '<div class="small text-muted" style="margin:0.8rem 0;">QR Code indisponível no modo offline sem a biblioteca carregada.</div>';
            const qrUrl = `${window.location.origin}${window.location.pathname}?module=recintos&recinto=${encodeURIComponent(recinto.id)}`;
            card.innerHTML = `
                <h3>${escapeHtml(recinto.nome)}</h3>
                <p class="text-muted small mb-2">${escapeHtml(recinto.tipo)} — <strong style="color:${color}">${avesNoRecinto.length} ave(s)</strong></p>
                ${qrMarkup}
                <p class="small text-muted" style="word-break:break-all;">${escapeHtml(qrUrl)}</p>
                <p class="small">${escapeHtml(recinto.descricao)}</p>
                <div class="aves-recinto mt-2" style="font-size:0.82rem;color:var(--text-muted);">
                    ${avesNoRecinto.length ? avesNoRecinto.map((ave) => `<span style="display:inline-block;background:rgba(255,255,255,0.07);border-radius:6px;padding:2px 8px;margin:2px;">${escapeHtml(ave.anilha)} (${escapeHtml(ave.mutacao)})</span>`).join('') : '<em>Nenhuma ave</em>'}
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:10px;">
                    <button class="btn-primary btn-open-recinto" data-id="${escapeHtml(recinto.id)}" style="flex:1;padding:0.5rem;font-size:0.8rem;background:#0ea5e9;">Abrir ficha</button>
                    <button class="btn-primary btn-label-recinto" data-id="${escapeHtml(recinto.id)}" style="flex:1;padding:0.5rem;font-size:0.8rem;background:#10b981;">Etiqueta</button>
                    <button class="btn-primary btn-del-recinto" data-id="${escapeHtml(recinto.id)}" style="flex:1;padding:0.5rem;font-size:0.8rem;background:#e74c3c;">Remover</button>
                </div>
            `;
            container.appendChild(card);

            if (hasQrLib) {
                const qrTarget = card.querySelector(`#qr-${CSS.escape(recinto.id)}`);
                if (qrTarget) {
                    new window.QRCode(qrTarget, {
                        text: qrUrl,
                        width: 110,
                        height: 110,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: window.QRCode.CorrectLevel.H
                    });
                }
            }
        });

        container.querySelectorAll('.btn-del-recinto').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este recinto?')) return;
                await DB.removeRecinto(id);
                if (selectedRecintoId === id) selectedRecintoId = null;
                renderRecintos();
                renderPlantel();
            });
        });

        container.querySelectorAll('.btn-open-recinto').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                if (!id) return;
                selectedRecintoId = id;
                renderRecintoDetail();
                const panel = document.getElementById('recinto-detail-panel');
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        container.querySelectorAll('.btn-label-recinto').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                if (!id) return;
                exportRecintoLabelPdf(id);
            });
        });

        renderRecintoDetail();
    };

    const cruzarLocusLegacy = (a1, a2) => {
        const p1 = a1 === 2 ? ['a', 'a'] : a1 === 1 ? ['A', 'a'] : ['A', 'A'];
        const p2 = a2 === 2 ? ['a', 'a'] : a2 === 1 ? ['A', 'a'] : ['A', 'A'];
        const results = {};
        for (const g1 of p1) {
            for (const g2 of p2) {
                const key = [g1, g2].sort().join('');
                results[key] = (results[key] || 0) + 25;
            }
        }
        return results;
    };

    const calcularCruzamentoRingneckLegacy = (nomePai, nomeMae) => {
        const pai = ringneckGenetica[nomePai] || ringneckGenetica['Verde Ancestral'];
        const mae = ringneckGenetica[nomeMae] || ringneckGenetica['Verde Ancestral'];
        const loci = ['blue', 'ino', 'grey', 'opaline', 'indigo', 'violet', 'cleartail'];
        const resultadosLoci = {};
        loci.forEach((locus) => { resultadosLoci[locus] = cruzarLocus(pai[locus] || 0, mae[locus] || 0); });

        const filhotes = [];
        const pBlue = resultadosLoci.blue.aa || 0;
        const pVerde = (resultadosLoci.blue.AA || 0) + (resultadosLoci.blue.Aa || 0);
        const pIno = resultadosLoci.ino.aa || 0;
        const pGrey = resultadosLoci.grey.aa || 0;
        const pIndigo = resultadosLoci.indigo.aa || 0;
        const pViolet = resultadosLoci.violet.aa || 0;

        if (pBlue > 0 && pIno > 0) filhotes.push({ name: 'Albino', prob: Math.round(pBlue * pIno / 100), sex: 'M/F' });
        if (pVerde > 0 && pIno > 0) filhotes.push({ name: 'Lutino', prob: Math.round(pVerde * pIno / 100), sex: 'M/F' });
        if (pBlue > 0 && pIndigo > 0) filhotes.push({ name: 'Cobalto', prob: Math.round(pBlue * pIndigo / 200), sex: 'M/F' });
        if (pBlue > 0) filhotes.push({ name: 'Azul Sky', prob: Math.round(pBlue * (100 - pIno) / 100), sex: 'M/F' });
        if (pVerde > 0) {
            const pVerdeLivre = Math.round(pVerde * (100 - pIno) / 100);
            if (pVerdeLivre > 0) filhotes.push({ name: resultadosLoci.blue.Aa ? 'Verde / Azul (Split)' : 'Verde Ancestral', prob: pVerdeLivre, sex: 'M/F' });
        }
        if (pGrey > 0) filhotes.push({ name: 'Cinza', prob: pGrey, sex: 'M/F' });
        if (pIndigo > 0 && pBlue === 0) filhotes.push({ name: 'Índigo', prob: pIndigo, sex: 'M/F' });
        if (pViolet > 0) filhotes.push({ name: 'Violeta SF', prob: pViolet, sex: 'M/F' });
        return filhotes.filter((item) => item.prob > 0).sort((a, b) => b.prob - a.prob);
    };

    const calcularCruzamentoCalopsitaLegacy = (nomePai, nomeMae) => {
        const pai = calopsitaGenetica[nomePai] || calopsitaGenetica.Cinza;
        const mae = calopsitaGenetica[nomeMae] || calopsitaGenetica.Cinza;
        const loci = ['ino', 'cb', 'canela', 'opaline'];
        const filhotes = [];
        loci.forEach((locus) => {
            const result = cruzarLocusLegacy(pai[locus] || 0, mae[locus] || 0);
            const pExpr = result.aa || 0;
            const pSplit = result.Aa || 0;
            const labels = { ino: 'Lutino', cb: 'Cara Branca', canela: 'Canela', opaline: 'Arlequim' };
            if (pExpr > 0) filhotes.push({ name: labels[locus], prob: pExpr, sex: 'M/F' });
            if (pSplit > 0 && pExpr < 100) filhotes.push({ name: `Cinza / ${labels[locus]} (Split)`, prob: pSplit, sex: 'M/F' });
        });
        const todosZero = loci.every((locus) => (calopsitaGenetica[nomePai]?.[locus] || 0) === 0 && (calopsitaGenetica[nomeMae]?.[locus] || 0) === 0);
        if (todosZero || !filhotes.length) filhotes.push({ name: 'Cinza Normal', prob: 100, sex: 'M/F' });
        return filhotes.filter((item) => item.prob > 0).sort((a, b) => b.prob - a.prob);
    };
    const runCruzamentoLegacy = () => {
        const grid = document.getElementById('results-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="loading-dna">Analisando mutações...</div>';
        const especie = document.getElementById('species-select').value;
        const nomePai = document.getElementById('pai-select').value;
        const nomeMae = document.getElementById('mae-select').value;

        setTimeout(() => {
            const results = especie === 'ringneck' ? calcularCruzamentoRingneckLegacy(nomePai, nomeMae) : calcularCruzamentoCalopsitaLegacy(nomePai, nomeMae);
            if (!results.length) {
                grid.innerHTML = '<div class="loading-dna">Nenhum resultado calculado para esta combinação.</div>';
                return;
            }
            const totalProb = results.reduce((sum, item) => sum + item.prob, 0);
            grid.innerHTML = `
                <div class="result-box glass mt-4">
                    <h4>Estimativa de Filhotes - ${escapeHtml(nomePai)} × ${escapeHtml(nomeMae)}</h4>
                    <div class="res-list">
                        ${results.map((result) => {
                            const pct = totalProb > 0 ? Math.round(result.prob / totalProb * 100) : result.prob;
                            return `
                                <div class="res-row">
                                    <div class="bird-thumb" style="background-image:url('${galleryUrl}')"></div>
                                    <div class="res-data" style="flex:1">
                                        <strong>${escapeHtml(result.name)}</strong>
                                        <span>${pct}%</span>
                                        <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;margin-top:4px;">
                                            <div style="background:var(--primary);width:${pct}%;height:6px;border-radius:4px;"></div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:1rem;">* Valores aproximados baseados em herança mendeliana simples.</p>
                </div>
            `;
        }, 400);
    };

    const runIdentificationLegacy = () => {
        const olhos = document.getElementById('id-olhos').value;
        const cabeca = document.getElementById('id-cabeca').value;
        const dorso = document.getElementById('id-dorso').value;
        const anel = document.getElementById('id-anel')?.value || 'normal';
        const panel = document.getElementById('id-result-panel');
        if (!panel) return;

        let fenotipo = 'Verde Ancestral';
        let notas = [];
        let genetica = '';
        const isIno = olhos === 'red';
        const isAzul = dorso === 'azul' || dorso === 'cinza';
        const isCinza = dorso === 'cinza';

        if (isIno && isAzul) {
            fenotipo = 'Albino';
            genetica = 'bb / ino ino';
            notas.push('Bloqueio total de eumelanina e faeomelanina. Confirmar por teste de cruzamento.');
        } else if (isIno) {
            fenotipo = 'Lutino';
            genetica = 'BB ou Bb / ino ino';
            notas.push('Bloqueio de eumelanina. Corpo amarelo intenso. Ligado ao sexo.');
        } else if (isCinza && cabeca === 'normal') {
            fenotipo = 'Cinza';
            genetica = 'grey grey';
            notas.push('Gene cinza autossômico dominante. Pode sobrepor azul.');
        } else if (isAzul) {
            fenotipo = 'Azul Sky';
            genetica = 'bb / +/+';
            notas.push('Diluição de faeomelanina por dois alelos recessivos blue.');
        } else if (dorso === 'verde' && cabeca === 'cb') {
            fenotipo = 'Cara Branca';
            genetica = 'cb cb';
            notas.push('Mutação cara branca, autossômica recessiva.');
        } else if (dorso === 'verde' && cabeca === 'buttercup') {
            fenotipo = 'Buttercup / Lutino parcial';
            genetica = 'Verificar';
            notas.push('Cabeça amarela intensa pode indicar Lutino ou Buttercup.');
        } else if (dorso === 'indigo') {
            fenotipo = 'Índigo';
            genetica = 'ind ind';
            notas.push('Mutação índigo: corpo azul-esverdeado profundo, autossômica recessiva.');
        } else if (dorso === 'violeta') {
            fenotipo = 'Violeta SF';
            genetica = 'Vt / +';
            notas.push('Violeta SF: um alelo violeta. Cor roxa no peito visível.');
        } else {
            genetica = 'BB / +/+';
            notas.push('Fenótipo selvagem. Sem mutações visíveis detectadas.');
        }

        if (anel === 'amarelo') notas.push('Colar amarelo visível - macho adulto.');
        if (anel === 'ausente') notas.push('Sem colar - fêmea ou jovem.');

        panel.innerHTML = `
            <div class="diagnosis-header glass mb-3">LAUDO PERICIAL</div>
            <div class="res-row glass">
                <div class="bird-thumb" style="background-image:url('${galleryUrl}')"></div>
                <div class="res-data">
                    <div class="diag-title">FENÓTIPO IDENTIFICADO</div>
                    <div class="diag-value" style="font-size:1.4rem;font-weight:800;color:var(--primary)">${escapeHtml(fenotipo)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Genótipo provável: <code>${escapeHtml(genetica)}</code></div>
                </div>
            </div>
            <div class="mt-3 p-3 glass" style="background:rgba(0,0,0,0.2);">
                <strong>Notas Técnicas:</strong><br>
                <ul style="margin-top:0.5rem;padding-left:1.2rem;">
                    ${notas.map((nota) => `<li style="margin-bottom:0.4rem;">${escapeHtml(nota)}</li>`).join('')}
                </ul>
            </div>
        `;
    };

    const renderFinanceiroLegacy2 = () => {
        const totals = DB.getTotais();
        document.getElementById('fin-entradas').textContent = formatCurrency(totals.entradas);
        document.getElementById('fin-saidas').textContent = formatCurrency(totals.saidas);
        document.getElementById('fin-saldo').textContent = formatCurrency(totals.saldo);
        document.getElementById('fin-saldo').style.color = totals.saldo >= 0 ? '#2ecc71' : '#e74c3c';

        const tbody = document.querySelector('#fin-table tbody');
        if (!tbody) return;
        tbody.innerHTML = [...DB.financas].reverse().map((financa) => `
            <tr>
                <td>${escapeHtml(financa.data || '—')}</td>
                <td><span style="color:${financa.tipo === 'entrada' ? '#2ecc71' : '#e74c3c'}">${financa.tipo === 'entrada' ? '▲ Entrada' : '▼ Saída'}</span></td>
                <td>${escapeHtml(financa.descricao)}</td>
                <td style="font-weight:700;color:${financa.tipo === 'entrada' ? '#2ecc71' : '#e74c3c'}">${formatCurrency(financa.valor)}</td>
                <td><button class="btn-delete-fin" data-id="${escapeHtml(financa.id)}" style="background:transparent;border:none;cursor:pointer;">❌</button></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-delete-fin').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este lançamento?')) return;
                await DB.removeFinanca(id);
                renderFinanceiro();
                renderDashboard();
            });
        });
    };

    const loadProfileToFormLegacy = () => {
        document.getElementById('admin-criatorio-nome').value = DB.perfil.nome_criatorio || '';
        document.getElementById('admin-responsavel').value = DB.perfil.responsavel || DB.config.responsavel || '';
        document.getElementById('admin-ibama').value = DB.perfil.ibama_ctf || '';
        document.getElementById('admin-doc').value = DB.perfil.documento || '';
        document.getElementById('admin-endereco').value = DB.perfil.endereco || '';
        document.getElementById('admin-foco').value = DB.perfil.foco_criacao || '';
        document.getElementById('admin-logo-url').value = DB.perfil.logo_url || '';
        DB.applyProfile();
    };

    const updateSpeciesLegacy = () => {
        const species = document.getElementById('species-select').value;
        const options = SpeciesMutations[species].map((mutation) => `<option value="${escapeHtml(mutation)}">${escapeHtml(mutation)}</option>`).join('');
        document.getElementById('pai-select').innerHTML = options;
        document.getElementById('mae-select').innerHTML = options;
    };
    const goToModuleLegacy = (target) => {
        if (!target) return;
        document.querySelectorAll('.sidebar-nav li').forEach((navItem) => {
            navItem.classList.toggle('active', navItem.getAttribute('data-module') === target);
        });
        document.querySelectorAll('.module').forEach((module) => {
            module.classList.toggle('active', module.id === target);
        });
        if (target === 'dashboard') renderDashboard();
        if (target === 'plantel') renderPlantel();
        if (target === 'recintos') renderRecintos();
        if (target === 'financeiro') renderFinanceiro();
        if (target === 'master-admin') renderMasterAdminPanel();
    };

    const initNavigationLegacy = () => {
        document.querySelectorAll('.sidebar-nav li').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                goToModule(item.getAttribute('data-module'));
            });
        });
    };

    const initQuickActionsLegacy = () => {
        document.querySelectorAll('.quick-action-btn[data-quick-module]').forEach((button) => {
            button.addEventListener('click', () => {
                const targetModule = button.getAttribute('data-quick-module');
                goToModule(targetModule);
            });
        });
    };

    const booksLegacy = [
        { id: 1, title: 'Genética em Psitacídeos', color: '#2ecc71', content: 'Mendel e a cor das penas. Diferenças entre herança autossômica e ligada ao sexo.' },
        { id: 2, title: 'Manual Ringneck Pro', color: '#3498db', content: 'Padrões de exposição, identificação e manejo da mutação Cleartail.' },
        { id: 3, title: 'Medicina Aviária', color: '#e67e22', content: 'Protocolos de primeiros socorros e sinais clínicos iniciais em aves ornamentais.' },
        { id: 4, title: 'Nutrição de Aves', color: '#e74c3c', content: 'Estratégias de nutrição para manutenção, reprodução e crescimento saudável.' },
        { id: 5, title: 'Biologia Reprodutiva', color: '#9b59b6', content: 'Fases da postura, incubação artificial e manejo de filhotes.' }
    ];

    const openBookLegacy = (book) => {
        document.getElementById('book-title').innerText = book.title;
        document.getElementById('page-content-title').innerText = `Capítulo Especial: ${book.title}`;
        document.getElementById('page-content-text').innerText = book.content;
        document.getElementById('modal-book-reader').style.display = 'flex';
    };

    const initLibraryLegacy = () => {
        const libraryGrid = document.getElementById('library-grid');
        if (!libraryGrid) return;
    };

    const openBookLegacy2 = (book) => {
        document.getElementById('book-title').innerText = book.title;
        document.getElementById('page-content-title').innerText = `Capítulo Especial: ${book.title}`;
        document.getElementById('page-content-text').innerText = book.content;
        document.getElementById('modal-book-reader').style.display = 'flex';
    };

    const initLibraryLegacy2 = () => {
        const libraryGrid = document.getElementById('library-grid');
        if (!libraryGrid) return;
        libraryGrid.innerHTML = '';
        books.forEach((book) => {
            const card = document.createElement('div');
            card.className = 'book-card glass';
            card.style.borderLeft = `4px solid ${book.color}`;
            card.innerHTML = `<strong>${escapeHtml(book.title)}</strong><p class="small text-muted">Clique para ler o manual</p>`;
            card.addEventListener('click', () => openBook(book));
            libraryGrid.appendChild(card);
        });
    };

    // ============================================================
    // REGISTRO DE PWA & INSTALAÇÃO EM CELULAR / TABLET / PC
    // ============================================================
    let deferredPwaPrompt = null;
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then((reg) => {
                console.log('Criador Pro PWA ServiceWorker registrado com sucesso:', reg.scope);
            }).catch((err) => {
                console.warn('Falha ao registrar ServiceWorker do Criador Pro:', err);
            });
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const installBtn = document.getElementById('btn-pwa-install');
        if (installBtn) installBtn.style.display = 'flex';
    });

    document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
        if (deferredPwaPrompt) {
            deferredPwaPrompt.prompt();
            const { outcome } = await deferredPwaPrompt.userChoice;
            if (outcome === 'accepted') {
                alert('🎉 Aplicativo Criador Pro instalado com sucesso no seu dispositivo!');
            }
            deferredPwaPrompt = null;
        } else {
            alert('📱 Para instalar no iOS (iPhone/iPad): toque no botão Compartilhar do Safari e selecione "Adicionar à Tela de Início".\n\nNo Android/Chrome ou PC: use o menu do navegador > "Instalar aplicativo".');
        }
    });

    // ============================================================
    // PAINEL MASTER ADMIN & SUPORTE TÉCNICO A CLIENTES (IMPERSONATION)
    // ============================================================
    let isMasterAdmin = false;
    let isSupportModeActive = false;
    let originalMasterPerfil = null;

    DB.clientesMaster = [
        {
            id: 'cli-001',
            nome: 'João Silva',
            criatorio: 'Criatório Sol Nascente',
            email: 'joao@solnascente.com.br',
            whatsapp: '(11) 98877-6655',
            documento: '111.222.333-44',
            ie: '123.456.789.110',
            certStatus: 'Vinculado',
            certVencimento: '2027-12-31',
            dataCadastro: '2026-07-15',
            status: 'Ativo',
            nfeCount: 12
        },
        {
            id: 'cli-002',
            nome: 'Maria Souza',
            criatorio: 'Criadouro Pássaro de Ouro',
            email: 'maria@passarodeouro.com.br',
            whatsapp: '(31) 97766-5544',
            documento: '222.333.444-55',
            ie: '987.654.321.000',
            certStatus: 'Pendente',
            certVencimento: '—',
            dataCadastro: '2026-07-20',
            status: 'Ativo',
            nfeCount: 0
        },
        {
            id: 'cli-003',
            nome: 'Carlos Oliveira',
            criatorio: 'Criatório Vale Verde',
            email: 'carlos@valeverde.com.br',
            whatsapp: '(19) 99112-2334',
            documento: '333.444.555-66',
            ie: '456.789.123.444',
            certStatus: 'Vinculado',
            certVencimento: '2027-08-15',
            dataCadastro: '2026-07-25',
            status: 'Ativo',
            nfeCount: 5
        }
    ];

    const renderMasterAdminPanel = () => {
        const tbody = document.getElementById('master-clients-table-body');
        if (!tbody) return;

        const statClientes = document.getElementById('master-stat-clientes');
        const statAtivos = document.getElementById('master-stat-ativos');
        const statCertificados = document.getElementById('master-stat-certificados');
        const statNfe = document.getElementById('master-stat-nfe');

        if (statClientes) statClientes.textContent = String(DB.clientesMaster.length);
        if (statAtivos) statAtivos.textContent = String(DB.clientesMaster.filter(c => c.status === 'Ativo').length);
        if (statCertificados) statCertificados.textContent = String(DB.clientesMaster.filter(c => c.certStatus === 'Vinculado').length);
        if (statNfe) statNfe.textContent = String(DB.clientesMaster.reduce((sum, c) => sum + (c.nfeCount || 0), 0));

        const searchVal = (document.getElementById('master-search-cliente')?.value || '').toLowerCase();
        const filtered = DB.clientesMaster.filter(c => 
            c.nome.toLowerCase().includes(searchVal) ||
            c.criatorio.toLowerCase().includes(searchVal) ||
            c.email.toLowerCase().includes(searchVal) ||
            c.documento.includes(searchVal)
        );

        tbody.innerHTML = filtered.map(cli => `
            <tr>
                <td><strong>${escapeHtml(cli.criatorio)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(cli.nome)}</small></td>
                <td>${escapeHtml(cli.email)}<br><small style="color:var(--text-muted);">${escapeHtml(cli.whatsapp)}</small></td>
                <td><code>${escapeHtml(cli.documento)}</code><br><small style="color:var(--text-muted);">IE: ${escapeHtml(cli.ie || 'Pendente')}</small></td>
                <td>
                    <span class="badge" style="background:${cli.certStatus === 'Vinculado' ? '#10b981' : '#f59e0b'}; color:#fff; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;">
                        ${cli.certStatus === 'Vinculado' ? '✓ Vinculado' : '⚠️ Pendente'}
                    </span>
                </td>
                <td>${escapeHtml(cli.dataCadastro)}</td>
                <td><span style="color:#10b981; font-weight:700;">● ${escapeHtml(cli.status)}</span></td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <button class="btn-ui btn-ui-amber btn-master-suporte" data-cli-id="${escapeHtml(cli.id)}" style="padding:0.35rem 0.65rem; font-size:0.78rem; font-weight:700;">🎧 Acessar (Suporte)</button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-master-suporte').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cli-id');
                suporteAcessarCriador(id);
            });
        });
    };

    const suporteAcessarCriador = (clienteId) => {
        const cliente = DB.clientesMaster.find(c => c.id === clienteId);
        if (!cliente) return;

        if (!isSupportModeActive) {
            originalMasterPerfil = { ...DB.perfil };
        }

        isSupportModeActive = true;
        DB.perfil.nome_criatorio = cliente.criatorio;
        DB.perfil.responsavel = cliente.nome;
        DB.perfil.documento = cliente.documento;
        DB.perfil.ie = cliente.ie;

        const bannerEl = document.getElementById('support-mode-banner');
        const nameEl = document.getElementById('support-mode-criatorio-name');
        if (bannerEl) bannerEl.style.display = 'flex';
        if (nameEl) nameEl.textContent = `${cliente.criatorio} (${cliente.nome})`;

        // Atualizar formulário do perfil admin
        const nameInput = document.getElementById('admin-criatorio-nome');
        const respInput = document.getElementById('admin-responsavel');
        const docInput = document.getElementById('admin-doc');
        const ieInput = document.getElementById('admin-ie');

        if (nameInput) nameInput.value = cliente.criatorio;
        if (respInput) respInput.value = cliente.nome;
        if (docInput) docInput.value = cliente.documento;
        if (ieInput) ieInput.value = cliente.ie || '';

        // Atualizar interface
        renderDashboard();
        renderPlantel();
        renderRecintos();
        renderFinanceiro();

        // Direcionar para a página de configurações "Meu Criatório" para auxílio fiscal
        goToModule('admin');

        alert(`🎧 MODO SUPORTE ATIVADO!\n\nVocê agora está no ambiente do cliente: ${cliente.criatorio}.\nPode realizar os ajustes de Certificado A1, Inscrição Estadual e Nota Fiscal para ajudá-lo.`);
    };

    window.sairSuporteModo = () => {
        if (!isSupportModeActive) return;
        isSupportModeActive = false;
        if (originalMasterPerfil) {
            DB.perfil = { ...originalMasterPerfil };
        }
        const bannerEl = document.getElementById('support-mode-banner');
        if (bannerEl) bannerEl.style.display = 'none';

        loadProfileToForm();
        renderDashboard();
        renderPlantel();
        renderRecintos();
        renderFinanceiro();

        goToModule('master-admin');
        renderMasterAdminPanel();
        alert('✓ Modo Suporte encerrado. Você retornou ao Painel Master Admin.');
    };

    window.switchAuthTab = (signupMode) => {
        isSignupMode = signupMode;
        const loginErrorEl = document.getElementById('loginError');
        if (loginErrorEl) loginErrorEl.style.display = 'none';

        const loginTab = document.getElementById('tab-login');
        const signupTab = document.getElementById('tab-signup');
        const loginFields = document.getElementById('form-login-fields');
        const signupFields = document.getElementById('form-signup-fields');
        const btnDoLogin = document.getElementById('btn-do-login');

        if (loginTab) {
            loginTab.style.background = signupMode ? 'transparent' : '#0ea5e9';
            loginTab.style.color = signupMode ? '#94a3b8' : '#fff';
        }
        if (signupTab) {
            signupTab.style.background = signupMode ? '#0ea5e9' : 'transparent';
            signupTab.style.color = signupMode ? '#fff' : '#94a3b8';
        }

        if (loginFields) loginFields.style.display = signupMode ? 'none' : 'block';
        if (signupFields) signupFields.style.display = signupMode ? 'block' : 'none';

        if (btnDoLogin) btnDoLogin.innerText = signupMode ? 'Criar Conta de Criador' : 'Acessar Sistema';
    };

    window.handleLoginSubmit = () => {
        handleLogin();
    };

    window.fillMasterAdminLogin = (e) => {
        if (e) e.preventDefault();
        window.switchAuthTab(false);
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = 'admin@admin.com';
        if (passInput) passInput.value = '123456';
        alert('🛡️ DADOS DE ADMINISTRADOR MASTER PREENCHIDOS!\n\nE-mail: admin@admin.com\nSenha: 123456\n\nClique em "Acessar Sistema" para entrar no Painel Master.');
    };

    if (window.location.hash === '#admin') {
        setTimeout(() => window.fillMasterAdminLogin(), 300);
    }

    const finishLogin = async (session) => {
        DB.session = session || null;
        const loginErrorEl = document.getElementById('loginError');
        const loginOverlayEl = document.getElementById('loginOverlay');
        const appContainerEl = document.querySelector('.app-layout');
        const userEmail = session?.user?.email || document.getElementById('login-email')?.value || '';

        if (loginErrorEl) loginErrorEl.style.display = 'none';
        if (loginOverlayEl) loginOverlayEl.style.display = 'none';
        if (appContainerEl) appContainerEl.style.display = 'flex';

        // Verificar se é Conta Master Admin
        if (userEmail.toLowerCase().includes('admin')) {
            isMasterAdmin = true;
            const masterNav = document.getElementById('nav-master-admin');
            if (masterNav) masterNav.style.display = 'block';
        }

        renderDashboard();
        renderPlantel();
        renderRecintos();
        renderFinanceiro();
        if (isMasterAdmin) renderMasterAdminPanel();

        if (session?.user?.id) {
            await DB.syncWithCloud();
            renderDashboard();
            renderPlantel();
            renderRecintos();
            renderFinanceiro();
        }
        if (pendingRouteModule) goToModule(pendingRouteModule);
        if (pendingRouteRecinto) {
            selectedRecintoId = pendingRouteRecinto;
            goToModule('recintos');
            renderRecintoDetail();
        }
    };

    const handleLogin = async () => {
        const loginErrorEl = document.getElementById('loginError');

        if (isSignupMode) {
            const nome = document.getElementById('signup-nome')?.value.trim();
            const criatorio = document.getElementById('signup-criatorio')?.value.trim();
            const doc = document.getElementById('signup-doc')?.value.trim();
            const email = document.getElementById('signup-email')?.value.trim();
            const password = document.getElementById('signup-password')?.value.trim();

            if (!nome || !criatorio || !email || !password) {
                alert('Preencha todos os campos obrigatórios do cadastro.');
                return;
            }

            if (!supabase) {
                // Atualizar dados de perfil localmente
                await DB.updatePerfil({
                    nome_criatorio: criatorio,
                    responsavel: nome,
                    documento: doc
                });
                alert(`🎉 CONTA CRIADA COM SUCESSO!\n\nBem-vindo(a), ${nome}!\nCriatório: ${criatorio}`);
                await finishLogin({ user: { email, user_metadata: { nome, criatorio } } });
                return;
            }

            const response = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nome, criatorio, documento: doc }
                }
            });

            if (response.error) {
                if (loginErrorEl) {
                    loginErrorEl.innerText = response.error.message;
                    loginErrorEl.style.display = 'block';
                }
                return;
            }

            await DB.updatePerfil({
                nome_criatorio: criatorio,
                responsavel: nome,
                documento: doc
            });

            alert('🎉 Conta de criador criada com sucesso na Nuvem!');
            if (response.data.session) {
                await finishLogin(response.data.session);
            } else {
                if (loginErrorEl) {
                    loginErrorEl.innerText = 'Conta criada. Faça o login para acessar o painel.';
                    loginErrorEl.style.display = 'block';
                }
                switchAuthTab(false);
            }
        } else {
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value.trim();

            if (!email || !password) {
                alert('Informe e-mail e senha de acesso.');
                return;
            }

            // Acesso garantido para o Administrador Master
            if (email.toLowerCase().includes('admin')) {
                await finishLogin({ user: { email, id: 'admin-master-id' } });
                return;
            }

            if (!supabase) {
                await finishLogin({ user: { email } });
                return;
            }

            const response = await supabase.auth.signInWithPassword({ email, password });
            if (response.error) {
                if (loginErrorEl) {
                    loginErrorEl.innerText = response.error.message;
                    loginErrorEl.style.display = 'block';
                }
                return;
            }
            await finishLogin(response.data.session);
        }
    };

    (async () => {
        try {
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) await finishLogin(session);
                else {
                    const loginOverlayEl = document.getElementById('loginOverlay');
                    if (loginOverlayEl) loginOverlayEl.style.display = 'flex';
                }
            } else {
                const loginOverlayEl = document.getElementById('loginOverlay');
                if (loginOverlayEl) loginOverlayEl.style.display = 'flex';
            }
        } catch (err) {
            console.error('Falha na verificação de autenticação do Criador Pro:', err);
        }
    })();

    document.getElementById('tab-login').addEventListener('click', () => switchAuthTab(false));
    document.getElementById('tab-signup').addEventListener('click', () => switchAuthTab(true));
    document.getElementById('btn-do-login').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keypress', (event) => { if (event.key === 'Enter') handleLogin(); });

    document.getElementById('btn-add-ave').addEventListener('click', () => { document.getElementById('modal-add-ave').style.display = 'block'; });
    document.getElementById('btn-cancel-ave').addEventListener('click', () => { document.getElementById('modal-add-ave').style.display = 'none'; });
    window.handleSaveAve = async () => {
        const anilha = document.getElementById('add-anilha')?.value.trim();
        const mutacao = document.getElementById('add-mutacao')?.value.trim();
        if (!anilha || !mutacao) return alert('Preencha ao menos a anilha e a mutação da ave.');
        const pai_anilha = document.getElementById('add-pai-anilha')?.value.trim() || '';
        const mae_anilha = document.getElementById('add-mae-anilha')?.value.trim() || '';
        const foto_url = document.getElementById('add-foto-url')?.value.trim() || '';

        const novaAve = await DB.addAve({
            anilha,
            mutacao,
            especie: document.getElementById('add-especie')?.value || 'Ringneck',
            sexo: document.getElementById('add-sexo')?.value || 'Macho',
            categoria: 'Plantel',
            nascimento: document.getElementById('add-nascimento')?.value || '',
            recinto: document.getElementById('add-recinto-select')?.value || '',
            pai_anilha,
            mae_anilha,
            foto_url,
            status: 'Ativo'
        });
        selectedAveId = novaAve?.id || selectedAveId;
        if (document.getElementById('add-anilha')) document.getElementById('add-anilha').value = '';
        if (document.getElementById('add-mutacao')) document.getElementById('add-mutacao').value = '';
        if (document.getElementById('add-nascimento')) document.getElementById('add-nascimento').value = '';
        if (document.getElementById('add-pai-anilha')) document.getElementById('add-pai-anilha').value = '';
        if (document.getElementById('add-mae-anilha')) document.getElementById('add-mae-anilha').value = '';
        if (document.getElementById('add-foto-url')) document.getElementById('add-foto-url').value = '';
        if (document.getElementById('add-foto-preview')) document.getElementById('add-foto-preview').style.display = 'none';

        if (window.closeModal) window.closeModal('modal-add-ave');
        else if (document.getElementById('modal-add-ave')) document.getElementById('modal-add-ave').style.display = 'none';
        renderPlantel();
        renderDashboard();
        renderRecintos();
        updateMarketingSelect();
        alert('🎉 Ave cadastrada e salva no plantel com sucesso!');
    };

    document.getElementById('btn-save-ave')?.addEventListener('click', window.handleSaveAve);

    document.getElementById('busca-plantel')?.addEventListener('input', renderPlantel);
        document.getElementById('btn-export-pdf').addEventListener('click', exportPlantelPdf);
document.getElementById('btn-save-ave-base')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        updateAveDossier(selectedAveId, (data) => {
            data.base = {
                pai_anilha: document.getElementById('ave-pai-anilha').value.trim(),
                mae_anilha: document.getElementById('ave-mae-anilha').value.trim(),
                linhagem: document.getElementById('ave-linhagem').value.trim(),
                matriz_status: document.getElementById('ave-matriz-status').value || 'Nao definido'
            };
        });
        renderAveDetail();
    });

    document.getElementById('btn-add-ave-hist')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        const date = document.getElementById('ave-hist-date').value || new Date().toISOString().split('T')[0];
        const type = document.getElementById('ave-hist-type').value || 'Manejo';
        const text = document.getElementById('ave-hist-text').value.trim();
        if (!text) return alert('Informe a descrição do histórico.');
        updateAveDossier(selectedAveId, (data) => {
            data.historico = Array.isArray(data.historico) ? data.historico : [];
            data.historico.push({ id: createId('HIST'), date, type, text });
        });
        document.getElementById('ave-hist-text').value = '';
        renderAveDetail();
    });

    document.getElementById('btn-add-ave-exam')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        const date = document.getElementById('ave-exam-date').value || new Date().toISOString().split('T')[0];
        const type = document.getElementById('ave-exam-type').value.trim();
        const result = document.getElementById('ave-exam-result').value.trim();
        const link = sanitizeHttpUrl(document.getElementById('ave-exam-link').value.trim());
        if (!type || !result) return alert('Informe tipo e resultado do exame.');
        updateAveDossier(selectedAveId, (data) => {
            data.exames = Array.isArray(data.exames) ? data.exames : [];
            data.exames.push({ id: createId('EXAM'), date, type, result, link });
        });
        document.getElementById('ave-exam-type').value = '';
        document.getElementById('ave-exam-result').value = '';
        document.getElementById('ave-exam-link').value = '';
        renderAveDetail();
    });

    document.getElementById('btn-add-ave-photo')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        const url = sanitizeImageUrl(document.getElementById('ave-photo-url').value.trim());
        const note = document.getElementById('ave-photo-note').value.trim();
        if (!url) return alert('Informe uma URL de imagem válida (http/https).');
        updateAveDossier(selectedAveId, (data) => {
            data.fotos = Array.isArray(data.fotos) ? data.fotos : [];
            data.fotos.push({ id: createId('PHOTO'), url, note, date: new Date().toISOString().split('T')[0] });
        });
        document.getElementById('ave-photo-url').value = '';
        document.getElementById('ave-photo-note').value = '';
        renderAveDetail();
    });

    document.getElementById('btn-add-ave-season')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        const name = document.getElementById('ave-season-name').value.trim();
        if (!name) return alert('Informe a temporada.');
        const ovos = parseWholeNumber(document.getElementById('ave-season-ovos').value);
        const eclodidos = parseWholeNumber(document.getElementById('ave-season-eclodidos').value);
        const desmamados = parseWholeNumber(document.getElementById('ave-season-desmamados').value);
        const note = document.getElementById('ave-season-note').value.trim();
        updateAveDossier(selectedAveId, (data) => {
            data.temporadas = Array.isArray(data.temporadas) ? data.temporadas : [];
            data.temporadas.push({ id: createId('SEASON'), name, ovos, eclodidos, desmamados, note });
        });
        document.getElementById('ave-season-name').value = '';
        document.getElementById('ave-season-ovos').value = '';
        document.getElementById('ave-season-eclodidos').value = '';
        document.getElementById('ave-season-desmamados').value = '';
        document.getElementById('ave-season-note').value = '';
        renderAveDetail();
    });

    document.getElementById('btn-ave-report-pdf')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave primeiro.');
        exportAveReportPdf(selectedAveId);
    });

    window.populateRecintoPairSelects = () => {
        const paiSelect = document.getElementById('rec-pai-select');
        const maeSelect = document.getElementById('rec-mae-select');
        
        const machos = DB.aves.filter(a => a.sexo === 'Macho' || a.sexo === 'Indefinido');
        const femeas = DB.aves.filter(a => a.sexo === 'Fêmea' || a.sexo === 'Indefinido');

        if (paiSelect) {
            paiSelect.innerHTML = '<option value="">— Selecionar Macho do Plantel —</option>' +
                machos.map(a => `<option value="${escapeHtml(a.id)}">[${escapeHtml(a.anilha)}] ${escapeHtml(a.especie)} - ${escapeHtml(a.mutacao)}</option>`).join('');
        }
        if (maeSelect) {
            maeSelect.innerHTML = '<option value="">— Selecionar Fêmea do Plantel —</option>' +
                femeas.map(a => `<option value="${escapeHtml(a.id)}">[${escapeHtml(a.anilha)}] ${escapeHtml(a.especie)} - ${escapeHtml(a.mutacao)}</option>`).join('');
        }
    };

    document.getElementById('btn-add-recinto')?.addEventListener('click', () => {
        window.populateRecintoPairSelects();
        if (window.openModal) window.openModal('modal-add-recinto');
        else document.getElementById('modal-add-recinto').style.display = 'block';
    });
    document.getElementById('btn-cancel-recinto')?.addEventListener('click', () => { document.getElementById('modal-add-recinto').style.display = 'none'; });
    window.handleSaveRecinto = async () => {
        const nome = document.getElementById('rec-nome')?.value.trim();
        if (!nome) return alert('Informe o nome do recinto / setor.');
        const ala = document.getElementById('rec-ala')?.value || 'Ala de Matrizes';
        const tipo_comp = document.getElementById('rec-tipo-comp')?.value || 'Gaiola Convencional';
        const qtd_comp = document.getElementById('rec-qtd-comp')?.value || '1';
        const dimensoes = document.getElementById('rec-dimensoes')?.value.trim() || '100cm x 60cm x 60cm';
        
        const paiId = document.getElementById('rec-pai-select')?.value;
        const maeId = document.getElementById('rec-mae-select')?.value;
        const avePai = DB.aves.find(a => a.id === paiId);
        const aveMae = DB.aves.find(a => a.id === maeId);

        const paiStr = avePai ? `♂️ Pai: ${avePai.anilha}` : '';
        const maeStr = aveMae ? `♀️ Mãe: ${aveMae.anilha}` : '';
        const anilha_casal = [paiStr, maeStr].filter(Boolean).join(' | ') || 'Sem casal alocado';
        const descricao = document.getElementById('rec-desc')?.value.trim() || '';

        const novoRec = await DB.addRecinto({ nome, ala, tipo_comp, qtd_comp, dimensoes, anilha_casal, descricao: descricao || ala });

        if (avePai) avePai.recinto = novoRec.id;
        if (aveMae) aveMae.recinto = novoRec.id;
        DB.saveAves();

        if (document.getElementById('rec-nome')) document.getElementById('rec-nome').value = '';
        if (document.getElementById('rec-desc')) document.getElementById('rec-desc').value = '';
        if (document.getElementById('rec-pai-select')) document.getElementById('rec-pai-select').value = '';
        if (document.getElementById('rec-mae-select')) document.getElementById('rec-mae-select').value = '';

        if (window.closeModal) window.closeModal('modal-add-recinto');
        else if (document.getElementById('modal-add-recinto')) document.getElementById('modal-add-recinto').style.display = 'none';

        renderRecintos();
        renderPlantel();
        renderDashboard();

        alert('🎉 Recinto salvo com sucesso!');
    };

    document.getElementById('btn-save-recinto')?.addEventListener('click', window.handleSaveRecinto);

    document.getElementById('btn-save-ovo')?.addEventListener('click', async () => {
        const codigo = document.getElementById('ovo-codigo').value.trim();
        const recinto_id = document.getElementById('ovo-recinto-select').value;
        const data_incubacao = document.getElementById('ovo-data-incubacao').value;
        if (!codigo || !data_incubacao) return alert('Informe ao menos o código do ovo e a data de incubação.');

        await DB.addOvo({
            codigo,
            recinto_id,
            pai_anilha: document.getElementById('ovo-pai-anilha')?.value.trim() || '',
            mae_anilha: document.getElementById('ovo-mae-anilha')?.value.trim() || '',
            data_postura: document.getElementById('ovo-data-postura')?.value || data_incubacao,
            data_incubacao,
            status: 'Em Incubação'
        });

        document.getElementById('ovo-codigo').value = '';
        if (window.closeModal) window.closeModal('modal-add-ovo');
        renderOvos();
    });

    document.getElementById('btn-save-filhote-uti')?.addEventListener('click', async () => {
        const anilha = document.getElementById('uti-anilha').value.trim();
        const nascimento = document.getElementById('uti-nascimento').value;
        if (!anilha || !nascimento) return alert('Informe a anilha e data de nascimento do filhote.');

        await DB.addFilhoteUti({
            anilha,
            especie: document.getElementById('uti-especie')?.value || 'Ringneck',
            nascimento,
            peso_inicial: Number(document.getElementById('uti-peso-inicial')?.value || 15),
            pai_anilha: document.getElementById('uti-pai-anilha')?.value.trim() || '',
            mae_anilha: document.getElementById('uti-mae-anilha')?.value.trim() || '',
            status: 'Em Tratagem'
        });

        document.getElementById('uti-anilha').value = '';
        if (window.closeModal) window.closeModal('modal-add-filhote-uti');
        renderUtiFilhotes();
    });

    document.getElementById('btn-save-peso-filhote')?.addEventListener('click', async () => {
        const filhoteId = document.getElementById('peso-filhote-select').value;
        const valor = parseFloat(document.getElementById('peso-valor').value);
        if (!filhoteId || Number.isNaN(valor)) return alert('Selecione o filhote e informe o peso em gramas.');

        await DB.addPesoFilhote(filhoteId, {
            data: document.getElementById('peso-data')?.value || new Date().toISOString().split('T')[0],
            valor,
            papo: document.getElementById('peso-papo')?.value || 'Cheio',
            obs: document.getElementById('peso-obs')?.value.trim() || ''
        });

        document.getElementById('peso-valor').value = '';
        document.getElementById('peso-obs').value = '';
        if (window.closeModal) window.closeModal('modal-add-peso-filhote');
        renderUtiFilhotes();
    });

    document.getElementById('btn-export-maternidade-pdf')?.addEventListener('click', exportMaternidadePdf);
    document.getElementById('btn-export-maternidade-csv')?.addEventListener('click', exportMaternidadeCsv);

    document.getElementById('btn-save-insumo')?.addEventListener('click', async () => {
        const nome = document.getElementById('insumo-nome').value.trim();
        const categoria = document.getElementById('insumo-categoria').value;
        const qtd = parseFloat(document.getElementById('insumo-qtd').value);
        const minimo = parseFloat(document.getElementById('insumo-minimo').value);
        if (!nome || Number.isNaN(qtd)) return alert('Informe o nome do alimento e a quantidade.');

        await DB.addInsumo({
            nome,
            categoria,
            qtd,
            minimo: Number.isNaN(minimo) ? 2 : minimo,
            fornecedor: document.getElementById('insumo-fornecedor')?.value.trim() || '',
            validade: document.getElementById('insumo-validade')?.value || ''
        });

        document.getElementById('insumo-nome').value = '';
        document.getElementById('insumo-qtd').value = '';
        if (window.closeModal) window.closeModal('modal-add-insumo');
        renderEstoqueAlimentos();
    });

    document.getElementById('btn-save-cardapio')?.addEventListener('click', async () => {
        const nome = document.getElementById('cardapio-nome').value.trim();
        const recinto_id = document.getElementById('cardapio-recinto-select').value;
        const ingredientes = document.getElementById('cardapio-ingredientes').value.trim();
        if (!nome || !ingredientes) return alert('Informe o nome e os ingredientes do cardápio.');

        await DB.addCardapio({
            nome,
            recinto_id,
            ingredientes,
            frequencia: document.getElementById('cardapio-frequencia')?.value || 'Diário (2x ao dia)',
            horario: document.getElementById('cardapio-horario')?.value.trim() || '07:30 e 15:00'
        });

        document.getElementById('cardapio-nome').value = '';
        document.getElementById('cardapio-ingredientes').value = '';
        if (window.closeModal) window.closeModal('modal-add-cardapio');
        renderCardapios();
    });

    document.getElementById('btn-save-escala-manejo')?.addEventListener('click', async () => {
        const recinto_id = document.getElementById('escala-recinto-select').value;
        const turno = document.getElementById('escala-turno').value;
        const tratador = document.getElementById('escala-tratador').value.trim();
        const limpador = document.getElementById('escala-limpador').value.trim();
        if (!tratador && !limpador) return alert('Informe ao menos o tratador ou o responsável pela limpeza.');

        await DB.addEscalaManejo({
            recinto_id,
            turno,
            tratador: tratador || 'Não informado',
            limpador: limpador || 'Não informado'
        });

        document.getElementById('escala-tratador').value = '';
        document.getElementById('escala-limpador').value = '';
        if (window.closeModal) window.closeModal('modal-add-escala-manejo');
        renderEscalaManejo();
    });

    document.getElementById('btn-export-cozinha-pdf')?.addEventListener('click', exportCozinhaPdf);
    document.getElementById('btn-export-cozinha-csv')?.addEventListener('click', exportCozinhaCsv);

    document.getElementById('btn-save-quarentena')?.addEventListener('click', async () => {
        const anilha = document.getElementById('quar-anilha').value.trim();
        const origem = document.getElementById('quar-origem').value.trim();
        const data_chegada = document.getElementById('quar-data-chegada').value;
        const data_alta = document.getElementById('quar-data-alta').value;
        if (!anilha || !origem || !data_chegada) return alert('Informe ao menos a anilha, origem e data de chegada.');

        await DB.addQuarentena({
            anilha,
            especie_mutacao: document.getElementById('quar-especie-mutacao')?.value.trim() || 'Ringneck',
            origem,
            recinto_id: document.getElementById('quar-recinto-select').value,
            gta: document.getElementById('quar-gta')?.value.trim() || 'N/A',
            nf: document.getElementById('quar-nf')?.value.trim() || 'N/A',
            data_chegada,
            data_alta: data_alta || data_chegada,
            prontuario: document.getElementById('quar-prontuario')?.value.trim() || 'Em quarentena.',
            doc_url: document.getElementById('quar-doc-url')?.value.trim() || '',
            status: 'Em Quarentena'
        });

        document.getElementById('quar-anilha').value = '';
        document.getElementById('quar-origem').value = '';
        document.getElementById('quar-doc-url').value = '';
        if (window.closeModal) window.closeModal('modal-add-quarentena');
        renderQuarentena();
    });

    document.getElementById('btn-save-enfermaria')?.addEventListener('click', async () => {
        const anilha = document.getElementById('enf-anilha').value.trim();
        const diagnostico = document.getElementById('enf-diagnostico').value.trim();
        const medicamento = document.getElementById('enf-medicamento').value.trim();
        if (!anilha || !diagnostico || !medicamento) return alert('Informe a anilha, diagnóstico e o medicamento.');

        await DB.addEnfermaria({
            anilha,
            recinto_id: document.getElementById('enf-recinto-select').value,
            diagnostico,
            medicamento,
            dosagem: document.getElementById('enf-dosagem')?.value.trim() || 'Conforme prescrição',
            dias: Number(document.getElementById('enf-dias')?.value || 7),
            responsavel: document.getElementById('enf-responsavel')?.value.trim() || 'Veterinário',
            data_internacao: new Date().toISOString().split('T')[0],
            status: 'Em Tratamento'
        });

        document.getElementById('enf-anilha').value = '';
        document.getElementById('enf-diagnostico').value = '';
        document.getElementById('enf-medicamento').value = '';
        if (window.closeModal) window.closeModal('modal-add-enfermaria');
        renderEnfermaria();
    });

    document.getElementById('btn-save-saida')?.addEventListener('click', async () => {
        const anilha = document.getElementById('saida-anilha').value.trim();
        const destino = document.getElementById('saida-destino').value.trim();
        const data_transporte = document.getElementById('saida-data-transporte').value;
        if (!anilha || !destino || !data_transporte) return alert('Informe a anilha, destino e data de transporte.');

        await DB.addSaida({
            anilha,
            destino,
            data_transporte,
            gta: document.getElementById('saida-gta')?.value.trim() || 'Emitida',
            chk_gta: document.getElementById('chk-gta')?.checked ?? true,
            chk_nf: document.getElementById('chk-nf')?.checked ?? true,
            chk_cert: document.getElementById('chk-cert')?.checked ?? true,
            chk_laudo: document.getElementById('chk-laudo')?.checked ?? true,
            foto_url: document.getElementById('saida-foto-url')?.value.trim() || '',
            status: 'Pronto para Envio'
        });

        document.getElementById('saida-anilha').value = '';
        document.getElementById('saida-destino').value = '';
        document.getElementById('saida-foto-url').value = '';
        if (window.closeModal) window.closeModal('modal-add-saida');
        renderSaida();
    });

    document.getElementById('btn-export-quarentena-pdf')?.addEventListener('click', exportQuarentenaPdf);
    document.getElementById('btn-export-quarentena-csv')?.addEventListener('click', exportQuarentenaCsv);

    document.getElementById('btn-rec-note-add')?.addEventListener('click', () => {
        if (!selectedRecintoId) return alert('Selecione um recinto primeiro.');
        const date = document.getElementById('rec-note-date').value || new Date().toISOString().split('T')[0];
        const type = document.getElementById('rec-note-type').value || 'Observacao';
        const text = document.getElementById('rec-note-text').value.trim();
        if (!text) return alert('Escreva a anotação.');
        addRecintoNote(selectedRecintoId, { date, type, text });
        document.getElementById('rec-note-text').value = '';
        renderRecintoDetail();
    });

    document.getElementById('btn-recinto-label-pdf')?.addEventListener('click', () => {
        const id = document.getElementById('btn-recinto-label-pdf').getAttribute('data-recinto-id');
        if (!id) return alert('Selecione um recinto primeiro.');
        exportRecintoLabelPdf(id);
    });

    document.getElementById('genealogy-root-select')?.addEventListener('change', (event) => {
        const rootId = event.currentTarget.value;
        renderGenealogyPanel(rootId);
    });

    document.getElementById('genealogy-filter-species')?.addEventListener('change', () => {
        renderGenealogyPanel();
    });

    document.getElementById('genealogy-filter-category')?.addEventListener('change', () => {
        renderGenealogyPanel();
    });

    document.getElementById('btn-genealogy-use-selected')?.addEventListener('click', () => {
        if (!selectedAveId) return alert('Selecione uma ave na tabela primeiro.');
        renderGenealogyPanel(selectedAveId);
    });

    document.getElementById('btn-genealogy-refresh')?.addEventListener('click', () => {
        renderGenealogyPanel();
    });

    document.getElementById('btn-genealogy-export-pdf')?.addEventListener('click', () => {
        exportGenealogyLaudoPdf(selectedAveId);
    });

    document.getElementById('btn-genealogy-export-png')?.addEventListener('click', () => {
        exportGenealogyPng(selectedAveId);
    });

    document.getElementById('species-select').addEventListener('change', updateSpecies);
    document.getElementById('btn-cruzamento').addEventListener('click', runCruzamento);
    document.getElementById('btn-identificar').addEventListener('click', runIdentification);
    document.getElementById('btn-send-vet').addEventListener('click', () => handleChat('vet-input', 'vet-chat-history', 'VetPro AI', 'Analisando sintomas com base no protocolo clínico. Recomendo avaliação das fezes, isolamento preventivo e consulta presencial se persistir por mais de 48h.'));
    document.getElementById('vet-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleChat('vet-input', 'vet-chat-history', 'VetPro AI', 'Analisando sintomas com base no protocolo clínico. Recomendo avaliação das fezes, isolamento preventivo e consulta presencial se persistir por mais de 48h.');
    });

    document.getElementById('mkt-select-ave')?.addEventListener('change', (e) => {
        const aveId = e.target.value;
        const ave = DB.aves.find(a => a.id === aveId);
        if (ave) {
            if (document.getElementById('mkt-especie')) document.getElementById('mkt-especie').value = ave.especie || 'Ringneck';
            if (document.getElementById('mkt-mutacao')) document.getElementById('mkt-mutacao').value = ave.mutacao || '';
            generateMarketingAd(ave);
        }
    });

    document.getElementById('btn-gen-marketing')?.addEventListener('click', () => {
        const aveId = document.getElementById('mkt-select-ave')?.value;
        const ave = DB.aves.find(a => a.id === aveId);
        generateMarketingAd(ave);
    });

    document.getElementById('btn-add-financa').addEventListener('click', () => { document.getElementById('modal-add-financa').style.display = 'block'; });
    
    const fetchNfeList = async () => {
        const tbody = document.getElementById('nfe-table-body');
        if (!tbody) return;
        try {
            const resp = await fetch('/api/nfe/lista');
            const data = await resp.json();
            if (!data.ok || !Array.isArray(data.notas)) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-muted">Nenhuma nota emitida ainda.</td></tr>';
                return;
            }
            tbody.innerHTML = data.notas.map(nota => `
                <tr>
                    <td><strong>Nº ${escapeHtml(nota.numero)}</strong><br><small style="color:var(--text-muted); font-size:0.75rem;">Série ${escapeHtml(nota.serie)}</small></td>
                    <td>${new Date(nota.dataEmissao).toLocaleDateString('pt-BR')} ${new Date(nota.dataEmissao).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                    <td><span style="background:rgba(14,165,233,0.15); color:#0ea5e9; padding:3px 8px; border-radius:6px; font-weight:700;">${escapeHtml(nota.animalAnilha)}</span><br><small style="color:var(--text-muted);">${escapeHtml(nota.especie)}</small></td>
                    <td><strong>${escapeHtml(nota.compradorNome)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(nota.compradorDoc)} (${escapeHtml(nota.compradorUf)})</small></td>
                    <td style="font-weight:700; color:#2ecc71;">${formatCurrency(nota.valor)}</td>
                    <td>${escapeHtml(nota.gta || 'N/A')}</td>
                    <td><span class="badge" style="background:#22c55e; color:#fff; padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.78rem;">✓ ${escapeHtml(nota.status)}</span></td>
                    <td>
                        <div style="display:flex; gap:0.4rem;">
                            <button class="btn-ui btn-ui-secondary btn-open-danfe" data-nfe-id="${escapeHtml(nota.id)}" style="padding:0.35rem 0.6rem; font-size:0.75rem;">🖨️ DANFE</button>
                            <button class="btn-ui btn-ui-secondary btn-send-wa-nfe" data-chave="${escapeHtml(nota.chave)}" data-num="${escapeHtml(nota.numero)}" style="padding:0.35rem 0.6rem; font-size:0.75rem;">💬 Whats</button>
                        </div>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.btn-open-danfe').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-nfe-id');
                    window.open(`/api/nfe/danfe?id=${encodeURIComponent(id)}`, '_blank');
                });
            });

            tbody.querySelectorAll('.btn-send-wa-nfe').forEach(btn => {
                btn.addEventListener('click', () => {
                    const num = btn.getAttribute('data-num');
                    const chave = btn.getAttribute('data-chave');
                    const text = encodeURIComponent(`Olá! Segue a Nota Fiscal Eletrônica Nº ${num} emitida pelo Criador Pro.\nChave SEFAZ: ${chave}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                });
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-muted">Falha ao carregar lista de notas.</td></tr>';
        }
    };

    window.openModalEmitirNfe = () => {
        const select = document.getElementById('nfe-animal-select');
        if (select) {
            select.innerHTML = '<option value="">— Selecionar Animal do Plantel —</option>' +
                DB.aves.map(a => `<option value="${escapeHtml(a.anilha)}" data-especie="${escapeHtml(a.especie)} (${escapeHtml(a.mutacao)})">[${escapeHtml(a.anilha)}] ${escapeHtml(a.especie)} - ${escapeHtml(a.mutacao)}</option>`).join('');
        }
        if (window.openModal) window.openModal('modal-emitir-nfe');
        else document.getElementById('modal-emitir-nfe').style.display = 'block';
    };

    document.getElementById('nfe-animal-select')?.addEventListener('change', (e) => {
        const selectedOpt = e.target.options[e.target.selectedIndex];
        const especie = selectedOpt?.getAttribute('data-especie');
        if (especie) {
            document.getElementById('nfe-especie').value = especie;
        }
    });

    document.getElementById('btn-transmitir-nfe')?.addEventListener('click', async () => {
        const animalAnilha = document.getElementById('nfe-animal-select').value;
        const especie = document.getElementById('nfe-especie').value.trim();
        const ncm = document.getElementById('nfe-ncm').value.trim();
        const compradorNome = document.getElementById('nfe-comprador-nome').value.trim();
        const compradorDoc = document.getElementById('nfe-comprador-doc').value.trim();
        const compradorUf = document.getElementById('nfe-comprador-uf').value;
        const cfop = document.getElementById('nfe-cfop').value;
        const gta = document.getElementById('nfe-gta').value.trim();
        const valor = parseFloat(document.getElementById('nfe-valor').value);
        const obs = document.getElementById('nfe-obs').value.trim();

        if (!animalAnilha || !compradorNome || Number.isNaN(valor) || valor <= 0) {
            return alert('Preencha os campos obrigatórios: Animal do Plantel, Comprador e Valor válido.');
        }

        try {
            const resp = await fetch('/api/nfe/emitir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    animalAnilha,
                    especie,
                    ncm,
                    compradorNome,
                    compradorDoc,
                    compradorUf,
                    cfop,
                    gta,
                    valor,
                    obs
                })
            });

            const result = await resp.json();
            if (!result.ok) {
                return alert(`Erro ao emitir Nota Fiscal: ${result.error}`);
            }

            // Registrar lançamento financeiro automático
            await DB.addFinanca({
                tipo: 'entrada',
                descricao: `Venda Animal Anilha ${animalAnilha} (NF-e Nº ${result.nota.numero})`,
                valor: valor,
                data: new Date().toISOString().split('T')[0]
            });

            alert(`🎉 NOTA FISCAL EMITIDA E AUTORIZADA PELA SEFAZ COM SUCESSO!\n\nNº da Nota: ${result.nota.numero}\nChave de Acesso: ${result.nota.chave}\nProtocolo: ${result.nota.protocolo}`);

            if (window.closeModal) window.closeModal('modal-emitir-nfe');
            else document.getElementById('modal-emitir-nfe').style.display = 'none';

            renderFinanceiro();
            renderDashboard();
            fetchNfeList();
        } catch (err) {
            alert('Falha na comunicação com o emissor fiscal de notas.');
        }
    });
    
    document.getElementById('btn-cancel-financa').addEventListener('click', () => { document.getElementById('modal-add-financa').style.display = 'none'; });
    document.getElementById('btn-save-financa').addEventListener('click', async () => {
        const descricao = document.getElementById('fin-desc').value.trim();
        const valor = parseFloat(document.getElementById('fin-valor').value);
        const tipo = document.getElementById('fin-tipo').value;
        const data = document.getElementById('fin-data').value;
        if (!descricao || Number.isNaN(valor) || valor <= 0) return alert('Preencha descrição e valor válido.');
        await DB.addFinanca({ tipo, descricao, valor, data });
        document.getElementById('fin-desc').value = '';
        document.getElementById('fin-valor').value = '';
        document.getElementById('modal-add-financa').style.display = 'none';
        renderFinanceiro();
        renderDashboard();
    });

    document.getElementById('btn-save-admin').addEventListener('click', async () => {
        const ie = document.getElementById('admin-ie')?.value.trim() || '';
        const regime = document.getElementById('admin-regime')?.value || '';
        const ambiente = document.getElementById('admin-ambiente')?.value || '';

        await DB.updatePerfil({
            nome_criatorio: document.getElementById('admin-criatorio-nome').value.trim(),
            responsavel: document.getElementById('admin-responsavel').value.trim(),
            ibama_ctf: document.getElementById('admin-ibama').value.trim(),
            documento: document.getElementById('admin-doc').value.trim(),
            endereco: document.getElementById('admin-endereco').value.trim(),
            logo_url: sanitizeImageUrl(document.getElementById('admin-logo-url').value)
        });

        fetch('/api/nfe/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ie, regime, ambiente })
        }).catch(() => {});

        alert('Perfil oficial e Configurações Fiscais atualizados com sucesso.');
    });

    document.getElementById('tutor-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleChat('tutor-input', 'tutor-chat-history', 'Tutor Academia', 'Conceito importante: a herança ligada ao sexo em psitacídeos segue o padrão ZW. Fêmeas expressam mutações ligadas ao sexo com apenas um alelo.');
    });

    document.getElementById('btn-close-reader').addEventListener('click', () => { document.getElementById('modal-book-reader').style.display = 'none'; });
    document.getElementById('btn-use-vet').addEventListener('click', () => {
        document.getElementById('modal-book-reader').style.display = 'none';
        goToModule('vet');
        document.getElementById('vet-input').value = `Analisando com base no livro: ${document.getElementById('book-title').innerText}`;
    });

    updateSpecies();
    initGeneticaV2();
    initNavigation();
    initQuickActions();
    initLibrary();
    loadProfileToForm();
    const recNoteDate = document.getElementById('rec-note-date');
    if (recNoteDate && !recNoteDate.value) recNoteDate.value = new Date().toISOString().split('T')[0];
    const aveHistDate = document.getElementById('ave-hist-date');
    if (aveHistDate && !aveHistDate.value) aveHistDate.value = new Date().toISOString().split('T')[0];
    const aveExamDate = document.getElementById('ave-exam-date');
    if (aveExamDate && !aveExamDate.value) aveExamDate.value = new Date().toISOString().split('T')[0];
    renderPlantel();
    renderRecintos();
    renderDashboard();
    renderFinanceiro();
    renderOvos();
    renderUtiFilhotes();
    renderEstoqueAlimentos();
    renderCardapios();
    renderEscalaManejo();
    renderQuarentena();
    renderEnfermaria();
    renderSaida();
    switchAuthTab(false);
    } catch (err) {
        console.error('Falha na inicialização do modulo principal:', err);
    }
}

// ============================================================
// ESTÚDIO IA — MIDAS / SPIELBERG / STANLEY
// Exposto globalmente para uso via onclick no HTML
// ============================================================
window.switchEstudioTab = function(tabName) {
    document.querySelectorAll('.estudio-tab-content').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.calc-tabs-nav .tab-btn-calc').forEach(btn => {
        btn.classList.remove('active');
    });
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.style.display = 'block';
    const buttons = document.querySelectorAll('.calc-tabs-nav .tab-btn-calc');
    const tabIndex = ['midas','spielberg','stanley'].indexOf(tabName);
    if (buttons[tabIndex]) buttons[tabIndex].classList.add('active');
};

window.runAgent = async function(agentName) {
    const inputEl = document.getElementById(`${agentName}-input`);
    const resultEl = document.getElementById(`${agentName}-result`);
    if (!inputEl || !resultEl) return;

    const query = inputEl.value.trim();
    if (!query) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = '<em>⚠️ Digite uma instrução ou texto antes de acionar o agente.</em>';
        return;
    }

    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.5rem;">⚙️</span><em>Agente ${agentName.toUpperCase()} processando...</em></div>`;

    try {
        const apiUrl = window.CRIADOR_PRO_CONFIG?.apiBase || 'http://localhost:4173';
        const response = await fetch(`${apiUrl}/api/agents/${agentName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            const errMsg = data.error || 'Erro desconhecido no agente.';
            // Se for por falta de API Key, exibir mensagem amigável
            if (errMsg.includes('OPENAI_API_KEY')) {
                resultEl.innerHTML = `
                    <div style="border-left: 4px solid #fbbf24; padding:12px; border-radius:4px; background:rgba(251,191,36,0.1);">
                        <strong>⚠️ Agente sem chave de IA configurada</strong><br>
                        Para ativar os agentes MIDAS, SPIELBERG e STANLEY, adicione sua <code>OPENAI_API_KEY</code> 
                        no arquivo <code>.env</code> na pasta do projeto e reinicie o servidor.
                        <br><br>
                        <small>Caminho: <code>e:\\programa criador pro - trabalho\\.env</code></small>
                    </div>`;
            } else {
                resultEl.innerHTML = `<em style="color:#f87171;">❌ Erro: ${errMsg}</em>`;
            }
            return;
        }

        // Formatar resposta com quebras de linha como HTML
        const formatted = (data.reply || '').replace(/\n/g, '<br>');
        resultEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="color:#a3e635;">✅ ${agentName.toUpperCase()} respondeu:</strong>
                <button onclick="navigator.clipboard.writeText(document.getElementById('${agentName}-result').innerText)"
                    style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:0.75rem;">
                    📋 Copiar
                </button>
            </div>
            <div class="agent-response-content">${formatted}</div>`;
    } catch (err) {
        resultEl.innerHTML = `<em style="color:#f87171;">❌ Falha de conexão com a API local. Verifique se o servidor está rodando na porta 4173.</em>`;
    }
};

// Modules run after DOMContentLoaded — call immediately
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", __initPainel);
} else {
    __initPainel();
}
