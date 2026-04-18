import {
    GENETICS_RULES,
    RINGNECK_CATALOG,
    SPECIES_ROADMAP,
    calculateMultiLocus,
    runValidationSuite
} from './packages/genetics-engine/index.js';

document.addEventListener('DOMContentLoaded', () => {
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
        ringneck: ['Verde Ancestral', 'Azul Sky', 'Cinza', 'Lutino', 'Albino', 'Opalino', 'Cleartail', 'Violeta SF', 'Ãndigo', 'Cobalto', 'Violeta DF'],
        calopsita: ['Cinza', 'Lutino', 'Arlequim', 'Cara Branca', 'Canela', 'PÃ©rola', 'Albino']
    };

    const ringneckGenetica = {
        'Verde Ancestral': { blue: 0, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 0, splitBlue: false },
        'Azul Sky': { blue: 2, ino: 0, grey: 0, opaline: 0, indigo: 0, violet: 0, splitBlue: false },
        'Cinza': { blue: 0, ino: 0, grey: 2, opaline: 0, indigo: 0, violet: 0 },
        'Lutino': { blue: 0, ino: 2, grey: 0, opaline: 0, indigo: 0, violet: 0 },
        'Albino': { blue: 2, ino: 2, grey: 0, opaline: 0, indigo: 0, violet: 0 },
        'Opalino': { blue: 0, ino: 0, grey: 0, opaline: 2, indigo: 0, violet: 0 },
        'Ãndigo': { blue: 0, ino: 0, grey: 0, opaline: 0, indigo: 2, violet: 0 },
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
        'PÃ©rola': { ino: 0, cb: 0, canela: 0, opaline: 1 },
        'Albino': { ino: 2, cb: 2, canela: 0, opaline: 0 }
    };

    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.querySelector('.app-container');
    const loginError = document.getElementById('login-error');
    const userNameDisplay = document.getElementById('user-name-display');
    let isSignupMode = false;

    const safeParse = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`NÃ£o foi possÃ­vel ler ${key} do armazenamento local.`, error);
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

    const normalizeAve = (ave) => ({
        id: ave.id || createId('AVE'),
        anilha: ave.anilha || '',
        especie: ave.especie || 'Ringneck',
        mutacao: ave.mutacao || '',
        sexo: ave.sexo || 'Indefinido',
        status: ave.status || 'Ativo',
        nascimento: ave.nascimento || '',
        recinto: ave.recinto || ave.recinto_id || ''
    });

    const normalizeRecinto = (recinto) => ({
        id: recinto.id || createId('REC'),
        nome: recinto.nome || 'Recinto sem nome',
        tipo: recinto.tipo || 'Matrizes',
        descricao: recinto.descricao || ''
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

    class StorageService {
        constructor() {
            this.config = safeParse('cp_config', { responsavel: 'Pingo D\'Ouro' });
            this.aves = safeParse('cp_aves', []).map(normalizeAve);
            this.recintos = safeParse('cp_recintos', []).map(normalizeRecinto);
            this.financas = safeParse('cp_financas', []).map(normalizeFinanca);
            this.perfil = safeParse('cp_perfil', {});
            this.session = null;
            this.initMockData();
        }

        saveConfig() { localStorage.setItem('cp_config', JSON.stringify(this.config)); }
        saveAves() { localStorage.setItem('cp_aves', JSON.stringify(this.aves)); }
        saveRecintos() { localStorage.setItem('cp_recintos', JSON.stringify(this.recintos)); }
        saveFinancas() { localStorage.setItem('cp_financas', JSON.stringify(this.financas)); }
        savePerfil() { localStorage.setItem('cp_perfil', JSON.stringify(this.perfil)); }

        initMockData() {
            if (this.aves.length === 0) {
                this.aves = [
                    normalizeAve({ id: '1', anilha: 'RN-2024-001', especie: 'Ringneck', mutacao: 'Azul Sky', sexo: 'Macho', status: 'Ativo', nascimento: '2024-01-15', recinto: 'R1' }),
                    normalizeAve({ id: '2', anilha: 'RN-2024-002', especie: 'Ringneck', mutacao: 'Verde Ancestral', sexo: 'FÃªmea', status: 'Ativo', nascimento: '2024-02-10', recinto: 'R1' }),
                    normalizeAve({ id: '3', anilha: 'CAL-2023-442', especie: 'Calopsita', mutacao: 'PÃ©rola', sexo: 'FÃªmea', status: 'Ativo', nascimento: '2023-06-20', recinto: 'R2' })
                ];
                this.saveAves();
            }
            if (this.recintos.length === 0) {
                this.recintos = [
                    normalizeRecinto({ id: 'R1', nome: 'Viveiro Matrizes A', tipo: 'Matrizes', descricao: 'Aves em reproduÃ§Ã£o ativa' }),
                    normalizeRecinto({ id: 'R2', nome: 'Voadeira Filhotes', tipo: 'Filhotes', descricao: 'Recinto de sociabilizaÃ§Ã£o' }),
                    normalizeRecinto({ id: 'R3', nome: 'Setor Quarentena', tipo: 'Quarentena', descricao: 'Isolamento preventivo' })
                ];
                this.saveRecintos();
            }
            if (this.financas.length === 0) {
                this.financas = [
                    normalizeFinanca({ id: 'F1', tipo: 'entrada', descricao: 'Venda RN Azul Sky', valor: 1200, data: '2024-03-01' }),
                    normalizeFinanca({ id: 'F2', tipo: 'saida', descricao: 'RaÃ§Ã£o mensal', valor: 350, data: '2024-03-05' }),
                    normalizeFinanca({ id: 'F3', tipo: 'entrada', descricao: 'Venda Calopsita PÃ©rola', valor: 450, data: '2024-03-12' }),
                    normalizeFinanca({ id: 'F4', tipo: 'saida', descricao: 'Medicamentos', valor: 180, data: '2024-03-18' })
                ];
                this.saveFinancas();
            }
        }
        applyProfile() {
            if (this.perfil.nome_criatorio && userNameDisplay) {
                userNameDisplay.textContent = this.perfil.nome_criatorio;
                const sidebarLogo = document.querySelector('.sidebar-header .logo');
                if (sidebarLogo) {
                    const [firstWord, ...rest] = this.perfil.nome_criatorio.split(' ');
                    sidebarLogo.innerHTML = `ðŸ§¬ ${escapeHtml(firstWord || 'Criador')}<span>${escapeHtml(rest.join(' '))}</span>`;
                }
            }

            const preview = document.getElementById('logo-preview');
            if (preview) {
                preview.replaceChildren();
                const logoUrl = sanitizeImageUrl(this.perfil.logo_url);
                if (logoUrl) {
                    const image = document.createElement('img');
                    image.src = logoUrl;
                    image.alt = 'Logo do criatÃ³rio';
                    image.loading = 'lazy';
                    image.addEventListener('error', () => {
                        preview.textContent = 'Logo invÃ¡lida';
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
                console.error('Erro na sincronizaÃ§Ã£o com a nuvem:', error);
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
                    console.error('NÃ£o foi possÃ­vel salvar o perfil na nuvem.', error);
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
                        status: localAve.status,
                        nascimento: localAve.nascimento || null,
                        recinto_id: localAve.recinto || null,
                        user_id: this.session.user.id
                    }]);
                    await this.syncWithCloud();
                } catch (error) {
                    console.error('NÃ£o foi possÃ­vel sincronizar a ave com a nuvem.', error);
                }
            }
            return localAve;
        }

        async removeAve(id) {
            const ave = this.aves.find((item) => item.id === id);
            this.aves = this.aves.filter((item) => item.id !== id);
            this.saveAves();

            if (supabase && this.session?.user?.id && ave?.anilha) {
                try {
                    await supabase.from('aves').delete().eq('user_id', this.session.user.id).eq('anilha', ave.anilha);
                } catch (error) {
                    console.error('NÃ£o foi possÃ­vel remover a ave na nuvem.', error);
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

        getTotais() {
            const total = this.aves.length;
            const machos = this.aves.filter((ave) => ave.sexo === 'Macho').length;
            const femeas = this.aves.filter((ave) => ave.sexo === 'FÃªmea').length;
            const pares = Math.min(machos, femeas);
            const entradas = this.financas.filter((item) => item.tipo === 'entrada').reduce((sum, item) => sum + Number(item.valor || 0), 0);
            const saidas = this.financas.filter((item) => item.tipo === 'saida').reduce((sum, item) => sum + Number(item.valor || 0), 0);
            return { total, machos, femeas, pares, entradas, saidas, saldo: entradas - saidas };
        }
    }

    const DB = new StorageService();

    const exportPlantelCsv = () => {
        const header = ['Anilha', 'EspÃ©cie', 'MutaÃ§Ã£o', 'Sexo', 'Nascimento', 'Recinto', 'Status'];
        const rows = DB.aves.map((ave) => [
            ave.anilha,
            ave.especie,
            ave.mutacao,
            ave.sexo,
            ave.nascimento || '',
            DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || '',
            ave.status
        ]);
        const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `plantel_criador_pro_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportPlantelPdf = () => {
        if (!hasPdfLib) {
            alert('A biblioteca de PDF nÃ£o carregou. Para usar esta funÃ§Ã£o, abra a aplicaÃ§Ã£o com acesso Ã  internet ou incorpore as bibliotecas localmente.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Plantel - Criador Pro 5.0', 14, 18);
        doc.setFontSize(10);
        doc.text(`ResponsÃ¡vel: ${DB.config.responsavel || 'NÃ£o informado'}   |   Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
        doc.autoTable({
            startY: 32,
            head: [['Anilha', 'EspÃ©cie', 'MutaÃ§Ã£o', 'Sexo', 'Nascimento', 'Recinto', 'Status']],
            body: DB.aves.map((ave) => [ave.anilha, ave.especie, ave.mutacao, ave.sexo, ave.nascimento || 'â€”', DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || 'â€”', ave.status]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [251, 191, 36], textColor: 0 }
        });
        doc.save(`plantel_criador_pro_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    const renderDashboard = () => {
        const totals = DB.getTotais();
        document.getElementById('dash-aves').textContent = String(totals.total);
        document.getElementById('dash-pares').textContent = String(totals.pares);
        document.getElementById('dash-saldo').textContent = formatCurrency(totals.saldo);
    };

    const renderPlantel = () => {
        const tbody = document.querySelector('#plantel-table tbody');
        if (!tbody) return;

        const query = (document.getElementById('busca-plantel')?.value || '').trim().toLowerCase();
        const avesFiltradas = DB.aves.filter((ave) => [ave.anilha, ave.especie, ave.mutacao, ave.sexo].join(' ').toLowerCase().includes(query));

        tbody.innerHTML = avesFiltradas.map((ave) => {
            const recNome = DB.recintos.find((recinto) => recinto.id === ave.recinto)?.nome || 'â€”';
            const sexoLabel = ave.sexo === 'Macho' ? 'â™‚ï¸' : ave.sexo === 'FÃªmea' ? 'â™€ï¸' : 'â“';
            return `
                <tr>
                    <td><strong>${escapeHtml(ave.anilha)}</strong></td>
                    <td>${escapeHtml(ave.especie)}</td>
                    <td>${escapeHtml(ave.mutacao)}</td>
                    <td>${sexoLabel}</td>
                    <td>${escapeHtml(ave.nascimento || 'â€”')}</td>
                    <td><span class="badge-recinto">${escapeHtml(recNome)}</span></td>
                    <td><span class="badge positive">${escapeHtml(ave.status)}</span></td>
                    <td><button class="btn-delete-ave" data-id="${escapeHtml(ave.id)}" style="background:transparent;border:none;cursor:pointer;" title="Remover">âŒ</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-ave').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover esta ave?')) return;
                await DB.removeAve(id);
                renderPlantel();
                renderDashboard();
                renderRecintos();
            });
        });

        const recintoSelect = document.getElementById('add-recinto-select');
        if (recintoSelect) {
            recintoSelect.innerHTML = '<option value="">â€” Sem recinto â€”</option>' + DB.recintos.map((recinto) => `<option value="${escapeHtml(recinto.id)}">${escapeHtml(recinto.nome)}</option>`).join('');
        }
    };

    const renderRecintos = () => {
        const container = document.getElementById('recintos-grid-container');
        if (!container) return;
        container.innerHTML = '';

        DB.recintos.forEach((recinto) => {
            const color = recinto.tipo === 'Quarentena' ? '#e74c3c' : recinto.tipo === 'Matrizes' ? '#fbbf24' : '#2ecc71';
            const avesNoRecinto = DB.aves.filter((ave) => ave.recinto === recinto.id);
            const card = document.createElement('div');
            card.className = 'glass p-4';
            card.style.borderTop = `4px solid ${color}`;
            const qrMarkup = hasQrLib ? `<div style="background:white;padding:10px;border-radius:8px;display:inline-block;margin:0.5rem 0;"><div id="qr-${escapeHtml(recinto.id)}"></div></div>` : '<div class="small text-muted" style="margin:0.8rem 0;">QR Code indisponÃ­vel no modo offline sem a biblioteca carregada.</div>';
            card.innerHTML = `
                <h3>${escapeHtml(recinto.nome)}</h3>
                <p class="text-muted small mb-2">${escapeHtml(recinto.tipo)} â€” <strong style="color:${color}">${avesNoRecinto.length} ave(s)</strong></p>
                ${qrMarkup}
                <p class="small">${escapeHtml(recinto.descricao)}</p>
                <div class="aves-recinto mt-2" style="font-size:0.82rem;color:var(--text-muted);">
                    ${avesNoRecinto.length ? avesNoRecinto.map((ave) => `<span style="display:inline-block;background:rgba(255,255,255,0.07);border-radius:6px;padding:2px 8px;margin:2px;">${escapeHtml(ave.anilha)} (${escapeHtml(ave.mutacao)})</span>`).join('') : '<em>Nenhuma ave</em>'}
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:10px;">
                    <button class="btn-primary btn-del-recinto" data-id="${escapeHtml(recinto.id)}" style="flex:1;padding:0.5rem;font-size:0.8rem;background:#e74c3c;">Remover</button>
                </div>
            `;
            container.appendChild(card);

            if (hasQrLib) {
                const qrTarget = card.querySelector(`#qr-${CSS.escape(recinto.id)}`);
                if (qrTarget) {
                    new window.QRCode(qrTarget, {
                        text: `[CRIADOR-PRO] RECINTO:${recinto.id}|${recinto.nome}`,
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
                renderRecintos();
                renderPlantel();
            });
        });
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
                    <h5>FÃªmeas:</h5>
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
        const content = "RELATÃ“RIO GENÃ‰TICO - CRIADOR PRO\n\nResultado do Cruzamento:\n" + document.getElementById('results-grid-v2').innerText;
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
        if (pIndigo > 0 && pBlue === 0) filhotes.push({ name: 'Ãndigo', prob: pIndigo, sex: 'M/F' });
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
        grid.innerHTML = '<div class="loading-dna">Analisando mutaÃ§Ãµes...</div>';
        const especie = document.getElementById('species-select').value;
        const nomePai = document.getElementById('pai-select').value;
        const nomeMae = document.getElementById('mae-select').value;

        setTimeout(() => {
            const results = especie === 'ringneck' ? calcularCruzamentoRingneck(nomePai, nomeMae) : calcularCruzamentoCalopsita(nomePai, nomeMae);
            if (!results.length) {
                grid.innerHTML = '<div class="loading-dna">Nenhum resultado calculado para esta combinaÃ§Ã£o.</div>';
                return;
            }
            const totalProb = results.reduce((sum, item) => sum + item.prob, 0);
            grid.innerHTML = `
                <div class="result-box glass mt-4">
                    <h4>Estimativa de Filhotes - ${escapeHtml(nomePai)} Ã— ${escapeHtml(nomeMae)}</h4>
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
                    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:1rem;">* Valores aproximados baseados em heranÃ§a mendeliana simples.</p>
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
            notas.push('Gene cinza autossÃ´mico dominante. Pode sobrepor azul.');
        } else if (isAzul) {
            fenotipo = 'Azul Sky';
            genetica = 'bb / +/+';
            notas.push('DiluiÃ§Ã£o de faeomelanina por dois alelos recessivos blue.');
        } else if (dorso === 'verde' && cabeca === 'cb') {
            fenotipo = 'Cara Branca';
            genetica = 'cb cb';
            notas.push('MutaÃ§Ã£o cara branca, autossÃ´mica recessiva.');
        } else if (dorso === 'verde' && cabeca === 'buttercup') {
            fenotipo = 'Buttercup / Lutino parcial';
            genetica = 'Verificar';
            notas.push('CabeÃ§a amarela intensa pode indicar Lutino ou Buttercup.');
        } else if (dorso === 'indigo') {
            fenotipo = 'Ãndigo';
            genetica = 'ind ind';
            notas.push('MutaÃ§Ã£o Ã­ndigo: corpo azul-esverdeado profundo, autossÃ´mica recessiva.');
        } else if (dorso === 'violeta') {
            fenotipo = 'Violeta SF';
            genetica = 'Vt / +';
            notas.push('Violeta SF: um alelo violeta. Cor roxa no peito visÃ­vel.');
        } else {
            genetica = 'BB / +/+';
            notas.push('FenÃ³tipo selvagem. Sem mutaÃ§Ãµes visÃ­veis detectadas.');
        }

        if (anel === 'amarelo') notas.push('Colar amarelo visÃ­vel - macho adulto.');
        if (anel === 'ausente') notas.push('Sem colar - fÃªmea ou jovem.');

        panel.innerHTML = `
            <div class="diagnosis-header glass mb-3">LAUDO PERICIAL</div>
            <div class="res-row glass">
                <div class="bird-thumb" style="background-image:url('${galleryUrl}')"></div>
                <div class="res-data">
                    <div class="diag-title">FENÃ“TIPO IDENTIFICADO</div>
                    <div class="diag-value" style="font-size:1.4rem;font-weight:800;color:var(--primary)">${escapeHtml(fenotipo)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">GenÃ³tipo provÃ¡vel: <code>${escapeHtml(genetica)}</code></div>
                </div>
            </div>
            <div class="mt-3 p-3 glass" style="background:rgba(0,0,0,0.2);">
                <strong>Notas TÃ©cnicas:</strong><br>
                <ul style="margin-top:0.5rem;padding-left:1.2rem;">
                    ${notas.map((nota) => `<li style="margin-bottom:0.4rem;">${escapeHtml(nota)}</li>`).join('')}
                </ul>
            </div>
        `;
    };

    const renderFinanceiro = () => {
        const totals = DB.getTotais();
        document.getElementById('fin-entradas').textContent = formatCurrency(totals.entradas);
        document.getElementById('fin-saidas').textContent = formatCurrency(totals.saidas);
        document.getElementById('fin-saldo').textContent = formatCurrency(totals.saldo);
        document.getElementById('fin-saldo').style.color = totals.saldo >= 0 ? '#2ecc71' : '#e74c3c';

        const tbody = document.querySelector('#fin-table tbody');
        if (!tbody) return;
        tbody.innerHTML = [...DB.financas].reverse().map((financa) => `
            <tr>
                <td>${escapeHtml(financa.data || 'â€”')}</td>
                <td><span style="color:${financa.tipo === 'entrada' ? '#2ecc71' : '#e74c3c'}">${financa.tipo === 'entrada' ? 'â–² Entrada' : 'â–¼ SaÃ­da'}</span></td>
                <td>${escapeHtml(financa.descricao)}</td>
                <td style="font-weight:700;color:${financa.tipo === 'entrada' ? '#2ecc71' : '#e74c3c'}">${formatCurrency(financa.valor)}</td>
                <td><button class="btn-delete-fin" data-id="${escapeHtml(financa.id)}" style="background:transparent;border:none;cursor:pointer;">âŒ</button></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-delete-fin').forEach((button) => {
            button.addEventListener('click', async (event) => {
                const id = event.currentTarget.getAttribute('data-id');
                if (!id || !confirm('Remover este lanÃ§amento?')) return;
                await DB.removeFinanca(id);
                renderFinanceiro();
                renderDashboard();
            });
        });
    };

    const handleChat = (inputId, historyId, botName, baseResp) => {
        const input = document.getElementById(inputId);
        const history = document.getElementById(historyId);
        if (!input || !history || !input.value.trim()) return;

        const userMessage = document.createElement('div');
        userMessage.className = 'user-msg';
        userMessage.innerText = input.value.trim();
        history.appendChild(userMessage);
        input.value = '';

        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'vet-msg';
            botMessage.innerText = `${botName}: ${baseResp}`;
            history.appendChild(botMessage);
            history.scrollTop = history.scrollHeight;
        }, 500);
    };

    const loadProfileToForm = () => {
        document.getElementById('admin-criatorio-nome').value = DB.perfil.nome_criatorio || '';
        document.getElementById('admin-responsavel').value = DB.perfil.responsavel || DB.config.responsavel || '';
        document.getElementById('admin-ibama').value = DB.perfil.ibama_ctf || '';
        document.getElementById('admin-doc').value = DB.perfil.documento || '';
        document.getElementById('admin-endereco').value = DB.perfil.endereco || '';
        document.getElementById('admin-foco').value = DB.perfil.foco_criacao || '';
        document.getElementById('admin-logo-url').value = DB.perfil.logo_url || '';
        DB.applyProfile();
    };

    const updateSpecies = () => {
        const speciesSelect = document.getElementById('species-select');
        const paiSelect = document.getElementById('pai-select');
        const maeSelect = document.getElementById('mae-select');
        if (!speciesSelect || !paiSelect || !maeSelect) return;
        const species = speciesSelect.value;
        const options = SpeciesMutations[species].map((mutation) => `<option value="${escapeHtml(mutation)}">${escapeHtml(mutation)}</option>`).join('');
        paiSelect.innerHTML = options;
        maeSelect.innerHTML = options;
    };
    const initNavigation = () => {
        document.querySelectorAll('.sidebar-nav li').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const target = item.getAttribute('data-module');
                document.querySelectorAll('.sidebar-nav li').forEach((navItem) => navItem.classList.remove('active'));
                item.classList.add('active');
                document.querySelectorAll('.module').forEach((module) => module.classList.toggle('active', module.id === target));
                if (target === 'dashboard') renderDashboard();
                if (target === 'plantel') renderPlantel();
                if (target === 'recintos') renderRecintos();
                if (target === 'financeiro') renderFinanceiro();
            });
        });
    };

    const books = [
        { id: 1, title: 'GenÃ©tica em PsitacÃ­deos', color: '#2ecc71', content: 'Mendel e a cor das penas. DiferenÃ§as entre heranÃ§a autossÃ´mica e ligada ao sexo.' },
        { id: 2, title: 'Manual Ringneck Pro', color: '#3498db', content: 'PadrÃµes de exposiÃ§Ã£o, identificaÃ§Ã£o e manejo da mutaÃ§Ã£o Cleartail.' },
        { id: 3, title: 'Medicina AviÃ¡ria', color: '#e67e22', content: 'Protocolos de primeiros socorros e sinais clÃ­nicos iniciais em aves ornamentais.' },
        { id: 4, title: 'NutriÃ§Ã£o de Aves', color: '#e74c3c', content: 'EstratÃ©gias de nutriÃ§Ã£o para manutenÃ§Ã£o, reproduÃ§Ã£o e crescimento saudÃ¡vel.' },
        { id: 5, title: 'Biologia Reprodutiva', color: '#9b59b6', content: 'Fases da postura, incubaÃ§Ã£o artificial e manejo de filhotes.' }
    ];

    const openBook = (book) => {
        document.getElementById('book-title').innerText = book.title;
        document.getElementById('page-content-title').innerText = `CapÃ­tulo Especial: ${book.title}`;
        document.getElementById('page-content-text').innerText = book.content;
        document.getElementById('modal-book-reader').style.display = 'flex';
    };

    const initLibrary = () => {
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

    const switchAuthTab = (signupMode) => {
        isSignupMode = signupMode;
        loginError.style.display = 'none';
        document.getElementById('tab-login').classList.toggle('active', !signupMode);
        document.getElementById('tab-signup').classList.toggle('active', signupMode);
        document.getElementById('btn-do-login').innerText = signupMode ? 'Criar Minha Conta' : 'Acessar Sistema';
    };

    const finishLogin = async (session) => {
        DB.session = session || null;
        loginError.style.display = 'none';
        loginOverlay.style.display = 'none';
        appContainer.style.display = 'flex';
        renderDashboard();
        renderPlantel();
        renderRecintos();
        renderFinanceiro();
        if (session?.user?.id) {
            await DB.syncWithCloud();
            renderDashboard();
            renderPlantel();
            renderRecintos();
            renderFinanceiro();
        }
    };

    const handleLogin = async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (!email || !password) {
            alert('Preencha todos os campos.');
            return;
        }

        if (!supabase) {
            if (email === 'admin@admin.com' && password === '123456') {
                await finishLogin({ user: { email: 'admin@admin.com' } });
            } else {
                loginError.innerText = 'Credenciais invÃ¡lidas no modo local. Use admin@admin.com / 123456 ou configure o Supabase em config.js.';
                loginError.style.display = 'block';
            }
            return;
        }

        const response = isSignupMode ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
        if (response.error) {
            loginError.innerText = response.error.message;
            loginError.style.display = 'block';
            return;
        }
        if (isSignupMode && !response.data.session) {
            loginError.innerText = 'Conta criada. Verifique seu e-mail para confirmar o acesso, se sua configuraÃ§Ã£o do Supabase exigir confirmaÃ§Ã£o.';
            loginError.style.display = 'block';
            return;
        }
        await finishLogin(response.data.session);
    };

    document.getElementById('tab-login').addEventListener('click', () => switchAuthTab(false));
    document.getElementById('tab-signup').addEventListener('click', () => switchAuthTab(true));
    document.getElementById('btn-do-login').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keypress', (event) => { if (event.key === 'Enter') handleLogin(); });

    document.getElementById('btn-add-ave').addEventListener('click', () => { document.getElementById('modal-add-ave').style.display = 'block'; });
    document.getElementById('btn-cancel-ave').addEventListener('click', () => { document.getElementById('modal-add-ave').style.display = 'none'; });
    document.getElementById('btn-save-ave').addEventListener('click', async () => {
        const anilha = document.getElementById('add-anilha').value.trim();
        const mutacao = document.getElementById('add-mutacao').value.trim();
        if (!anilha || !mutacao) return alert('Preencha anilha e mutaÃ§Ã£o.');
        await DB.addAve({ anilha, mutacao, especie: document.getElementById('add-especie').value, sexo: document.getElementById('add-sexo').value, nascimento: document.getElementById('add-nascimento').value, recinto: document.getElementById('add-recinto-select').value || '', status: 'Ativo' });
        document.getElementById('add-anilha').value = '';
        document.getElementById('add-mutacao').value = '';
        document.getElementById('add-nascimento').value = '';
        document.getElementById('modal-add-ave').style.display = 'none';
        renderPlantel();
        renderDashboard();
        renderRecintos();
    });

    document.getElementById('busca-plantel')?.addEventListener('input', renderPlantel);
    document.getElementById('btn-export-csv').addEventListener('click', exportPlantelCsv);
    document.getElementById('btn-export-pdf').addEventListener('click', exportPlantelPdf);

    document.getElementById('btn-add-recinto').addEventListener('click', () => { document.getElementById('modal-add-recinto').style.display = 'block'; });
    document.getElementById('btn-cancel-recinto').addEventListener('click', () => { document.getElementById('modal-add-recinto').style.display = 'none'; });
    document.getElementById('btn-save-recinto').addEventListener('click', async () => {
        const nome = document.getElementById('rec-nome').value.trim();
        const tipo = document.getElementById('rec-tipo').value;
        const descricao = document.getElementById('rec-desc').value.trim();
        if (!nome) return alert('Informe o nome do recinto.');
        await DB.addRecinto({ nome, tipo, descricao: descricao || tipo });
        document.getElementById('rec-nome').value = '';
        document.getElementById('rec-desc').value = '';
        document.getElementById('modal-add-recinto').style.display = 'none';
        renderRecintos();
        renderPlantel();
    });
    document.getElementById('species-select').addEventListener('change', updateSpecies);
    // document.getElementById('btn-cruzamento').addEventListener('click', runCruzamento); // Desativado na v2
    document.getElementById('btn-identificar').addEventListener('click', runIdentification);
    document.getElementById('btn-send-vet').addEventListener('click', () => handleChat('vet-input', 'vet-chat-history', 'VetPro AI', 'Analisando sintomas com base no protocolo clÃ­nico. Recomendo avaliaÃ§Ã£o das fezes, isolamento preventivo e consulta presencial se persistir por mais de 48h.'));
    document.getElementById('vet-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleChat('vet-input', 'vet-chat-history', 'VetPro AI', 'Analisando sintomas com base no protocolo clÃ­nico. Recomendo avaliaÃ§Ã£o das fezes, isolamento preventivo e consulta presencial se persistir por mais de 48h.');
    });

    document.getElementById('btn-gen-marketing').addEventListener('click', () => {
        const especie = document.getElementById('mkt-especie').value;
        const mutacao = document.getElementById('mkt-mutacao').value.trim() || especie;
        document.getElementById('mkt-result').innerHTML = `
            <div class="glass p-3">
                <strong>AnÃºncio Gerado:</strong><br><br>
                <em>DisponÃ­vel: ${escapeHtml(mutacao)} - ProcedÃªncia garantida.</em><br><br>
                Ave de criaÃ§Ã£o responsÃ¡vel, criada com manejo tÃ©cnico e alimentaÃ§Ã£o especializada.<br>
                Plantel de alta genÃ©tica. <strong>Entrego com anilha, nota e histÃ³rico sanitÃ¡rio.</strong><br><br>
                Entre em contato para reservar. Vagas limitadas.<br>
                <small style="color:var(--text-muted)">#CriadorPro #Ringneck #PsitacÃ­deos #${escapeHtml(mutacao.replace(/\s/g, ''))}</small>
            </div>
        `;
    });

    document.getElementById('btn-add-financa').addEventListener('click', () => { document.getElementById('modal-add-financa').style.display = 'block'; });
    document.getElementById('btn-cancel-financa').addEventListener('click', () => { document.getElementById('modal-add-financa').style.display = 'none'; });
    document.getElementById('btn-save-financa').addEventListener('click', async () => {
        const descricao = document.getElementById('fin-desc').value.trim();
        const valor = parseFloat(document.getElementById('fin-valor').value);
        const tipo = document.getElementById('fin-tipo').value;
        const data = document.getElementById('fin-data').value;
        if (!descricao || Number.isNaN(valor) || valor <= 0) return alert('Preencha descriÃ§Ã£o e valor vÃ¡lido.');
        await DB.addFinanca({ tipo, descricao, valor, data });
        document.getElementById('fin-desc').value = '';
        document.getElementById('fin-valor').value = '';
        document.getElementById('modal-add-financa').style.display = 'none';
        renderFinanceiro();
        renderDashboard();
    });

    document.getElementById('btn-save-admin').addEventListener('click', async () => {
        await DB.updatePerfil({
            nome_criatorio: document.getElementById('admin-criatorio-nome').value.trim(),
            responsavel: document.getElementById('admin-responsavel').value.trim(),
            ibama_ctf: document.getElementById('admin-ibama').value.trim(),
            documento: document.getElementById('admin-doc').value.trim(),
            endereco: document.getElementById('admin-endereco').value.trim(),
            foco_criacao: document.getElementById('admin-foco').value.trim(),
            logo_url: sanitizeImageUrl(document.getElementById('admin-logo-url').value)
        });
        alert('Perfil oficial atualizado com sucesso.');
    });

    document.getElementById('tutor-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleChat('tutor-input', 'tutor-chat-history', 'Tutor Academia', 'Conceito importante: a heranÃ§a ligada ao sexo em psitacÃ­deos segue o padrÃ£o ZW. FÃªmeas expressam mutaÃ§Ãµes ligadas ao sexo com apenas um alelo.');
    });

    document.getElementById('btn-close-reader').addEventListener('click', () => { document.getElementById('modal-book-reader').style.display = 'none'; });
    document.getElementById('btn-use-vet').addEventListener('click', () => {
        document.getElementById('modal-book-reader').style.display = 'none';
        document.querySelector('[data-module="vet"]')?.click();
        document.getElementById('vet-input').value = `Analisando com base no livro: ${document.getElementById('book-title').innerText}`;
    });

    initGeneticaV2();
    updateSpecies();
    initNavigation();
    initLibrary();
    loadProfileToForm();
    renderPlantel();
    renderRecintos();
    renderDashboard();
    renderFinanceiro();
    switchAuthTab(false);
});

