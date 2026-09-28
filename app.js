'use strict';
// ============================================================
// MENTORIAS E-COMMERCE — lógica do app
// ============================================================

let DB = null;
let paginaAtual = 'dashboard';

const CORES = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6', '#F97316', '#EF4444', '#84CC16', '#06B6D4', '#A855F7', '#E11D48'];
const COR_GRUPO = '#A855F7';

const STATUS_AULA = {
  agendada:  { l: 'Agendada',       c: 'info' },
  realizada: { l: 'Realizada',      c: 'success' },
  falta:     { l: 'Aluno faltou',   c: 'danger' },
  remarcada: { l: 'Remarcada',      c: 'warning' },
  cancelada: { l: 'Cancelada',      c: 'gray' }
};
const STATUS_ALUNO = {
  ativo:     { l: 'Ativo',       c: 'success' },
  lead:      { l: 'Negociando',  c: 'info' },
  pausado:   { l: 'Pausado',     c: 'warning' },
  concluido: { l: 'Concluído',   c: 'accent' },
  cancelado: { l: 'Cancelado',   c: 'gray' }
};
const FREQ = {
  semanal:   { l: 'Semanal',   dias: 7 },
  quinzenal: { l: 'Quinzenal', dias: 14 },
  mensal:    { l: 'Mensal',    meses: 1 }
};
const PLATAFORMAS = ['Shopify', 'Nuvemshop', 'Tray', 'Loja Integrada', 'WooCommerce', 'Yampi', 'Mercado Livre', 'Shopee', 'Amazon', 'Magalu', 'TikTok Shop', 'Ainda não tem loja', 'Outra'];
const MODOS = {
  mensal:  { l: 'Pacote parcelado (mensal)', curto: 'Parcelado' },
  avista:  { l: 'Pacote à vista (valor total)', curto: 'À vista' },
  semanal: { l: 'Por semana', curto: 'Por semana' },
  aula:    { l: 'Por aula', curto: 'Por aula' }
};
const FORMAS = ['Pix', 'Cartão de crédito', 'Boleto', 'Transferência', 'Dinheiro', 'Outro'];
const DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_SEM_LONGO = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ============================================================
// UTILITÁRIOS
// ============================================================
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function hojeISO() { return toISO(new Date()); }
function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function addDias(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); }
function addMeses(s, n) {
  const d = parseISO(s);
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, ultimo));
  return toISO(d);
}
function diasEntre(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function soma(arr, f) { return arr.reduce((s, x) => s + num(f ? f(x) : x), 0); }
const fmtBRL = v => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function fmtCurto(v) {
  v = num(v);
  if (Math.abs(v) >= 1000000) return 'R$ ' + (v / 1000000).toFixed(1).replace('.', ',') + 'M';
  if (Math.abs(v) >= 1000) return 'R$ ' + (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.', ',') + 'k';
  return 'R$ ' + Math.round(v);
}
function fmtData(s) { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; }
function fmtDataCurta(s) { if (!s) return '—'; const [, m, d] = s.split('-'); return `${d}/${m}`; }
function fmtDataSemana(s) { const d = parseISO(s); return DIAS_SEM[d.getDay()] + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + (d.getFullYear() !== new Date().getFullYear() ? '/' + String(d.getFullYear()).slice(2) : ''); }
function fmtMes(ym) { const [y, m] = ym.split('-').map(Number); return MESES_CURTO[m - 1] + '/' + String(y).slice(2); }
function fmtMesLongo(ym) { const [y, m] = ym.split('-').map(Number); return MESES[m - 1] + ' de ' + y; }
function minutos(h) { const [a, b] = String(h || '00:00').split(':').map(Number); return (a || 0) * 60 + (b || 0); }
function horaFim(hora, dur) { const t = minutos(hora) + num(dur || 60); return pad(Math.floor(t / 60) % 24) + ':' + pad(t % 60); }
function dataHora(a) { const d = parseISO(a.data); const m = minutos(a.hora); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; }
function fimAula(a) { return new Date(dataHora(a).getTime() + (num(a.duracao) || 60) * 60000); }
function linhas(t) { return String(t || '').split('\n').map(s => s.trim()).filter(Boolean); }
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function iniciais(nome) {
  const p = String(nome || '?').trim().split(/\s+/);
  return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
function primeiroNome(n) { return String(n || '').trim().split(/\s+/)[0]; }
function relDia(s) {
  const h = hojeISO();
  if (s === h) return 'Hoje';
  if (s === addDias(h, 1)) return 'Amanhã';
  if (s === addDias(h, -1)) return 'Ontem';
  return null;
}
function semanaAtual() {
  const d = new Date();
  const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7);
  return [toISO(ini), addDias(toISO(ini), 6)];
}
const porDataHora = (a, b) => (a.data + a.hora).localeCompare(b.data + b.hora);
function badge(txt, c) { return `<span class="badge badge-${c}">${esc(txt)}</span>`; }
function corValida(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#6366F1'; }
function plural(n, s, p) { return n + ' ' + (n === 1 ? s : (p || s + 's')); }

// ============================================================
// DADOS
// ============================================================
function programaExemplo() {
  return {
    id: 'prog-exemplo',
    nome: 'Mentoria E-commerce 12 semanas',
    descricao: 'Do zero à escala: estrutura, tráfego, conversão e operação',
    frequencia: 'semanal', duracao: 60, hora: '19:00', valor: 3000, parcelas: 3,
    temas: [
      'Diagnóstico do negócio e definição de metas',
      'Nicho, produto campeão e análise de concorrência',
      'Fornecedores, custos, margem e precificação',
      'Estrutura da loja: plataforma, layout e páginas que convertem',
      'Marketplaces: Mercado Livre, Shopee e Amazon',
      'Tráfego pago I: Meta Ads (estrutura de campanhas)',
      'Tráfego pago II: Google Ads e Shopping',
      'Criativos, conteúdo e Instagram que vende',
      'Conversão (CRO): checkout, ofertas e ticket médio',
      'Logística, frete e experiência de entrega',
      'Pós-venda, CRM, e-mail e WhatsApp marketing',
      'Métricas, fluxo de caixa e plano de escala de 90 dias'
    ]
  };
}

// Programas de 10 aulas (básico → avançado), um para cada plataforma
const TEMAS_PLATAFORMA = {
  geral: ['E-commerce do básico ao avançado', 'Outra', [
    'Diagnóstico do negócio e fundamentos do e-commerce', 'Escolha de nicho e produtos campeões', 'Fornecedores, custos e precificação',
    'Estrutura da loja e canais de venda', 'Cadastro de produtos e fotos que vendem', 'Logística, frete e entrega',
    'Tráfego pago I: Meta Ads', 'Tráfego pago II: Google Ads', 'Pós-venda, CRM e recompra', 'Métricas, escala e plano de crescimento']],
  shopify: ['Shopify do básico ao avançado', 'Shopify', [
    'Fundamentos do e-commerce e configuração inicial da Shopify', 'Tema, layout e identidade visual da loja', 'Cadastro de produtos, coleções e fotos que vendem',
    'Pagamentos, frete e checkout', 'Apps essenciais e integrações', 'Página de produto e otimização de conversão (CRO)',
    'Tráfego pago: Meta Ads para Shopify', 'Google Ads, Google Shopping e SEO da loja', 'E-mail marketing, carrinho abandonado e pós-venda', 'Métricas, automações e escala']],
  nuvemshop: ['Nuvemshop do básico ao avançado', 'Nuvemshop', [
    'Fundamentos e configuração da Nuvemshop', 'Layout, tema e identidade visual', 'Produtos, variações e categorias',
    'Meios de pagamento, Nuvem Envio e frete', 'Aplicativos e integrações (ERP e marketplaces)', 'Conversão: página de produto, cupons e checkout',
    'Tráfego pago com Meta Ads', 'Google Ads, Google Shopping e SEO', 'Pós-venda, e-mail marketing e WhatsApp', 'Indicadores, escala e planejamento']],
  mercadolivre: ['Mercado Livre do básico ao avançado', 'Mercado Livre', [
    'Fundamentos do Mercado Livre e configuração da conta', 'Reputação, termômetro e regras da plataforma', 'Pesquisa de produtos e concorrência',
    'Anúncios que vendem: título, fotos e ficha técnica', 'Precificação, tarifas e margem', 'Mercado Envios e Full',
    'Mercado Ads (Product Ads)', 'Atendimento, perguntas e pós-venda', 'Promoções, campanhas e catálogo', 'Métricas, escala e gestão de estoque']],
  shopee: ['Shopee do básico ao avançado', 'Shopee', [
    'Fundamentos da Shopee e configuração da loja', 'Regras, penalidades e métricas de desempenho', 'Pesquisa de produtos e nichos na Shopee',
    'Anúncios otimizados: título, fotos e vídeos', 'Precificação, comissões e frete grátis', 'Envios e logística',
    'Shopee Ads', 'Campanhas, cupons e datas promocionais', 'Atendimento, chat e avaliações', 'Métricas e escala da loja']],
  tiktok: ['TikTok Shop do básico ao avançado', 'TikTok Shop', [
    'Fundamentos do TikTok Shop e configuração da conta', 'Regras, políticas e saúde da loja', 'Produtos virais e pesquisa de tendências',
    'Cadastro de produtos e vitrine', 'Conteúdo que vende: vídeos curtos e roteiros', 'Afiliados e creators',
    'Lives de venda', 'TikTok Ads (GMV Max e campanhas)', 'Logística, envios e atendimento', 'Métricas, escala e estratégia de conteúdo']],
  amazon: ['Amazon do básico ao avançado', 'Amazon', [
    'Fundamentos da Amazon e conta de vendedor', 'Regras, métricas da conta e categorias', 'Pesquisa de produtos e concorrência',
    'Listagem: título, bullets, imagens e conteúdo A+', 'Precificação, tarifas e Buy Box', 'Logística: DBA (FBA) e envios',
    'Amazon Ads (Sponsored Products)', 'Avaliações e atendimento', 'Promoções, cupons e datas especiais', 'Métricas, escala e gestão de estoque']]
};
const idProgPlataforma = chave => 'prog-10-' + chave;
function chavePlataforma(plataforma) {
  const k = Object.keys(TEMAS_PLATAFORMA).find(k => TEMAS_PLATAFORMA[k][1] === plataforma);
  return k || 'geral';
}
function programasPlataforma() {
  return Object.entries(TEMAS_PLATAFORMA).map(([k, [nome, plat, temas]]) => ({
    id: idProgPlataforma(k), nome, plataforma: k === 'geral' ? '' : plat,
    descricao: `10 aulas do básico ao avançado${k === 'geral' ? '' : ' em ' + plat}, com 30 dias de suporte no final`,
    frequencia: 'semanal', duracao: 60, hora: '19:00', valor: 0, parcelas: 1, suporteDias: 30, temas: temas.slice()
  }));
}

function dbPadrao() {
  return {
    versao: 1,
    config: {
      mentor: 'Felipe',
      horaPadrao: '19:00',
      duracaoPadrao: 60,
      frequenciaPadrao: 'semanal',
      notificar: true,
      msgLembrete: 'Olá {nome}! 👋\nPassando para lembrar da nossa aula de mentoria {quando}, às {hora}.\n📌 Tema: {tema}\n{link}\n\nAté lá! — {mentor}',
      msgCobranca: 'Olá {nome}, tudo bem? 😊\nPassando para lembrar do pagamento da mentoria: {descricao}, no valor de {valor}, com vencimento em {vencimento}.\nQualquer dúvida estou à disposição! — {mentor}'
    },
    programas: [programaExemplo()],
    alunos: [],
    aulas: [],
    pagamentos: [],
    _del: {},
    _savedAt: 0
  };
}

function normalizar(d) {
  const p = dbPadrao();
  if (!d || typeof d !== 'object') return p;
  const r = {
    ...p, ...d,
    config: { ...p.config, ...(d.config || {}) },
    programas: Array.isArray(d.programas) ? d.programas : p.programas,
    alunos: Array.isArray(d.alunos) ? d.alunos : [],
    aulas: Array.isArray(d.aulas) ? d.aulas : [],
    pagamentos: Array.isArray(d.pagamentos) ? d.pagamentos : []
  };
  // garante os programas de 10 aulas por plataforma (sem recriar os que você excluiu)
  const del = r._del || {};
  programasPlataforma().forEach(p => { if (!del[p.id] && !r.programas.some(x => x.id === p.id)) r.programas.push(p); });
  r.alunos.forEach(a => {
    a.evolucao = a.evolucao || []; a.notas = a.notas || []; a.cor = corValida(a.cor);
    if (a.suporte) a.suporte.atendimentos = a.suporte.atendimentos || [];
  });
  r.aulas.forEach(a => { a.alunoIds = a.alunoIds || []; a.presencas = a.presencas || {}; });
  r.programas.forEach(pr => { pr.temas = pr.temas || []; });
  return r;
}

async function carregar() {
  let d = null;
  if (window.api) {
    d = await window.api.carregar();
  } else {
    try { d = JSON.parse(localStorage.getItem('mentorias-db') || 'null'); } catch (e) {}
  }
  DB = normalizar(d);
  atualizarBase();
}

// ── Controle de alterações por item ──────────────────────────
// Cada mentorado/aula/cobrança/programa ganha um carimbo _upd quando muda, e
// exclusões viram "lápides" em DB._del. Assim a sincronização mescla item a
// item (computador x iPhone) em vez de um arquivo inteiro sobrescrever o outro.
const COLECOES = ['programas', 'alunos', 'aulas', 'pagamentos'];
let _base = {};
function mapaItens(db) {
  const m = {};
  COLECOES.forEach(c => db[c].forEach(it => { const { _upd, ...resto } = it; m[c + ':' + it.id] = JSON.stringify(resto); }));
  const { _upd, ...cfg } = db.config;
  m.config = JSON.stringify(cfg);
  return m;
}
function atualizarBase() { _base = mapaItens(DB); }
function carimbar() {
  const agora = Date.now();
  const atual = mapaItens(DB);
  DB._del = DB._del || {};
  COLECOES.forEach(c => DB[c].forEach(it => { if (_base[c + ':' + it.id] !== atual[c + ':' + it.id]) it._upd = agora; }));
  if (_base.config !== atual.config) DB.config._upd = agora;
  Object.keys(_base).forEach(k => { if (k !== 'config' && !(k in atual)) DB._del[k.split(':')[1]] = agora; });
  _base = atual;
}

// Gravações em fila — nunca duas escritas simultâneas, e sempre na ordem certa
let _filaSalvar = Promise.resolve();
function gravarLocal() {
  const snap = JSON.parse(JSON.stringify(DB));
  _filaSalvar = _filaSalvar.then(async () => {
    try {
      if (window.api) {
        const r = await window.api.salvar(snap);
        if (!r || !r.ok) toast('Erro ao salvar: ' + ((r && r.erro) || 'desconhecido'), 'error');
      } else {
        localStorage.setItem('mentorias-db', JSON.stringify(snap));
      }
    } catch (e) { toast('Erro ao salvar: ' + e.message, 'error'); }
  });
  return _filaSalvar;
}
function salvar() {
  carimbar();
  DB._savedAt = Date.now();
  const p = gravarLocal();
  agendarSync();
  return p;
}

function commit(msg) {
  salvar();
  renderTudo();
  if (msg) toast(msg);
}

// ============================================================
// SINCRONIZAÇÃO COM O IPHONE (GitHub)
// ============================================================
// Dados: repo PRIVADO ZyntraGlobal/mentorias-dados (dados.json).
// App do iPhone: repo público ZyntraGlobal/mentorias-app (GitHub Pages).
// O token NUNCA fica no código público: fica salvo só no aparelho. No iPhone,
// ele chega via acesso.json — o token criptografado (AES-GCM) com a senha que
// você define no computador; sem a senha, o arquivo público é inútil.
const GH_OWNER = 'ZyntraGlobal';
const GH_REPO_DADOS = 'mentorias-dados';
const GH_REPO_APP = 'mentorias-app';
const API_DADOS = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO_DADOS}/contents/dados.json`;
const API_ACESSO = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO_APP}/contents/acesso.json`;
const URL_APP = `https://zyntraglobal.github.io/${GH_REPO_APP}/`;
const EM_PAGES = location.hostname.endsWith('github.io');

const SYNC = { token: '', ultima: 0, estado: 'off', erro: '' };
let _sincronizando = false, _syncPendente = false, _syncTimer = null, _renderPendente = false;

async function carregarToken() {
  try {
    if (window.api) { const s = await window.api.lerSync(); SYNC.token = (s && s.token) || ''; }
    else SYNC.token = localStorage.getItem('mentorias-token') || '';
  } catch (e) { SYNC.token = ''; logSync('ERRO ao ler token: ' + e.message); }
  logSync('app aberto · sincronização ' + (SYNC.token ? 'ligada' : 'DESLIGADA (sem token)'));
}
async function guardarToken(token) {
  SYNC.token = token || '';
  if (window.api) await window.api.gravarSync(token ? { token } : null);
  else if (token) localStorage.setItem('mentorias-token', token);
  else localStorage.removeItem('mentorias-token');
}
function ghHeaders(token) {
  return { Authorization: 'Bearer ' + (token || SYNC.token), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}
function b64Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64Decode(b64) {
  const bytes = Uint8Array.from(atob(String(b64).replace(/\n/g, '')), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
async function fetchTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms || 15000);
  try { return await fetch(url, { ...opts, cache: 'no-store', signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}
async function ghGetArquivo(api, token) {
  const r = await fetchTimeout(api, { headers: ghHeaders(token) });
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Token inválido ou sem permissão' : 'GitHub respondeu ' + r.status);
  const info = await r.json();
  let texto;
  if (info.content) texto = b64Decode(info.content);
  else {
    // arquivos acima de 1 MB vêm sem conteúdo — busca o bruto
    const raw = await fetchTimeout(api, { headers: { ...ghHeaders(token), Accept: 'application/vnd.github.raw' } });
    texto = await raw.text();
  }
  return { data: JSON.parse(texto), sha: info.sha };
}
async function ghPutArquivo(api, conteudo, sha, msg, token) {
  const body = { message: msg, content: b64Encode(conteudo) };
  if (sha) body.sha = sha;
  const r = await fetchTimeout(api, { method: 'PUT', headers: { ...ghHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.status === 409 || r.status === 422) return { conflito: true };
  if (!r.ok) throw new Error('GitHub respondeu ' + r.status + ' ao gravar');
  return { ok: true };
}

function dadosSemMeta(db) {
  return JSON.stringify({ config: db.config, programas: db.programas, alunos: db.alunos, aulas: db.aulas, pagamentos: db.pagamentos, _del: db._del || {} });
}
function mesclar(L, R) {
  const del = { ...(R._del || {}) };
  Object.entries(L._del || {}).forEach(([id, t]) => { if (!del[id] || t > del[id]) del[id] = t; });
  const out = { ...L, _del: del };
  COLECOES.forEach(c => {
    const mapa = new Map(), ordem = [];
    const add = it => {
      const ex = mapa.get(it.id);
      if (!ex) { mapa.set(it.id, it); ordem.push(it.id); }
      else if ((it._upd || 0) > (ex._upd || 0)) mapa.set(it.id, it);
    };
    L[c].forEach(add); R[c].forEach(add);
    out[c] = ordem.map(id => mapa.get(id)).filter(it => !(del[it.id] && del[it.id] >= (it._upd || 0)));
  });
  out.config = (R.config._upd || 0) > (L.config._upd || 0) ? R.config : L.config;
  return out;
}

function agendarSync(ms) {
  if (!SYNC.token) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => sincronizar(), ms == null ? 1500 : ms);
}
function logSync(msg) {
  try { if (window.api && window.api.logSync) window.api.logSync(msg); } catch (e) {}
}
let _syncInicio = 0, _falhasSeguidas = 0;
async function sincronizar(manual) {
  if (!SYNC.token) { if (manual) toast('Sincronização não configurada — veja Configurações', 'error'); return; }
  // trava de segurança: uma sincronização nunca pode bloquear as outras por mais de 60 s
  if (_sincronizando && Date.now() - _syncInicio < 60000) { _syncPendente = true; return; }
  if (_sincronizando) logSync('sincronização anterior travada — liberando');
  _sincronizando = true;
  _syncInicio = Date.now();
  try {
    SYNC.estado = 'sync'; renderSyncStatus();
    for (let tentativa = 0; ; tentativa++) {
      const rem = await ghGetArquivo(API_DADOS);
      const remoto = rem.data ? normalizar(rem.data) : null;
      const merged = remoto ? mesclar(DB, remoto) : DB;
      if (dadosSemMeta(merged) !== dadosSemMeta(DB)) {
        DB = normalizar(merged);
        DB._savedAt = Date.now();
        atualizarBase();
        gravarLocal();
        logSync('recebeu alterações do outro aparelho');
        if (algumModalAberto()) _renderPendente = true; else renderTudo();
      }
      if (remoto && dadosSemMeta(DB) === dadosSemMeta(remoto)) break; // já está igual
      const r = await ghPutArquivo(API_DADOS, JSON.stringify(DB, null, 2), rem.sha, 'sync ' + (window.api ? 'desktop' : 'iphone'));
      if (!r.conflito) { logSync('enviou alterações'); break; }
      // outro aparelho gravou no meio do caminho — busca de novo e mescla
      logSync('conflito ao gravar (tentativa ' + (tentativa + 1) + ')');
      if (tentativa >= 4) throw new Error('conflito repetido ao gravar');
      await new Promise(res => setTimeout(res, 400 + Math.random() * 800));
    }
    if (SYNC.estado !== 'ok' || _falhasSeguidas) logSync('ok');
    SYNC.estado = 'ok'; SYNC.erro = ''; SYNC.ultima = Date.now(); _falhasSeguidas = 0;
    if (manual) toast('Sincronizado ✓');
  } catch (e) {
    SYNC.estado = 'erro';
    SYNC.erro = e.name === 'AbortError' ? 'sem conexão' : (e.message === 'Failed to fetch' ? 'sem conexão com o GitHub' : e.message);
    _falhasSeguidas++;
    logSync('ERRO: ' + (e && (e.stack || e.message) || e));
    if (manual) toast('Falha ao sincronizar: ' + SYNC.erro, 'error');
  } finally {
    _sincronizando = false;
    renderSyncStatus();
    if (_syncPendente) { _syncPendente = false; agendarSync(300); }
  }
}
function renderSyncStatus() {
  const b = $('sync-btn');
  if (!b) return;
  b.style.display = SYNC.token ? '' : 'none';
  b.classList.toggle('syncing', SYNC.estado === 'sync');
  b.classList.toggle('synced', SYNC.estado === 'ok');
  b.classList.toggle('erro', SYNC.estado === 'erro');
  b.title = SYNC.estado === 'erro' ? 'Falha na sincronização: ' + SYNC.erro + ' — clique para tentar de novo'
    : SYNC.ultima ? 'Sincronizado às ' + new Date(SYNC.ultima).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' — clique para sincronizar agora' : 'Sincronizar agora';
  const st = $('cf-sync-status');
  if (st) st.innerHTML = syncStatusHTML();
  // aviso bem visível quando não está conseguindo sincronizar (2+ falhas seguidas)
  const av = $('aviso-sync');
  if (av) {
    const mostrar = SYNC.token && SYNC.estado === 'erro' && _falhasSeguidas >= 2;
    av.style.display = mostrar ? '' : 'none';
    if (mostrar) $('aviso-sync-txt').textContent = `Não está sincronizando (${SYNC.erro}). O que você lançar fica salvo ${window.api ? 'neste computador' : 'neste iPhone'} e vai para o outro aparelho quando voltar.`;
  }
}
function syncStatusHTML() {
  if (!SYNC.token) return badge('Desligada', 'gray');
  if (SYNC.estado === 'erro') return badge('⚠ ' + SYNC.erro, 'danger');
  if (SYNC.estado === 'sync') return badge('Sincronizando...', 'info');
  return badge('✓ Conectada' + (SYNC.ultima ? ' · ' + new Date(SYNC.ultima).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''), 'success');
}

// ── Criptografia do acesso (senha → chave AES-GCM via PBKDF2) ──
async function derivarChave(senha, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const bytesParaB64 = b => btoa(String.fromCharCode(...b));
const b64ParaBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
// Login = usuário + senha: os dois entram juntos na chave (sem o usuário certo, a senha não abre)
const credencial = (usuario, senha) => String(usuario || '').trim().toLowerCase() + '\u0000' + senha;
async function cifrarToken(token, usuario, senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await derivarChave(credencial(usuario, senha), salt), new TextEncoder().encode(token));
  return { v: 2, salt: bytesParaB64(salt), iv: bytesParaB64(iv), ct: bytesParaB64(new Uint8Array(ct)) };
}
async function decifrarToken(acesso, usuario, senha) {
  // v1 (antes do login com usuário) usava só a senha
  const material = acesso.v >= 2 ? credencial(usuario, senha) : senha;
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ParaBytes(acesso.iv) }, await derivarChave(material, b64ParaBytes(acesso.salt)), b64ParaBytes(acesso.ct));
  return new TextDecoder().decode(pt);
}
async function buscarAcesso() {
  const r = await fetchTimeout(URL_APP + 'acesso.json?t=' + Date.now(), {});
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('não foi possível acessar o servidor (' + r.status + ')');
  return r.json();
}
// Entrar usando a senha (iPhone, ou outro computador)
async function entrarComSenha(usuario, senha) {
  const acesso = await buscarAcesso();
  if (!acesso) throw new Error('O acesso ainda não foi configurado no computador (Configurações → iPhone).');
  let token;
  try { token = await decifrarToken(acesso, usuario, senha); } catch (e) { throw new Error('Usuário ou senha incorretos'); }
  await guardarToken(token);
  if (window.api) await guardarVerificador(usuario, senha);
  marcarAtividade(true);
}
// Primeira configuração / troca de login (no computador): valida o token, publica o acesso cifrado
async function configurarSync(token, usuario, senha) {
  await ghGetArquivo(API_DADOS, token); // lança erro se o token não acessar o repo de dados
  const atual = await ghGetArquivo(API_ACESSO, token).catch(e => { throw new Error('O token precisa de acesso também ao repositório ' + GH_REPO_APP); });
  const acesso = await cifrarToken(token, usuario, senha);
  const r = await ghPutArquivo(API_ACESSO, JSON.stringify(acesso), atual.sha, 'acesso iphone', token);
  if (!r.ok) throw new Error('não foi possível publicar o acesso — tente de novo');
  await guardarToken(token);
  if (window.api) await guardarVerificador(usuario, senha);
  marcarAtividade(true);
}

// ============================================================
// REGRAS DE NEGÓCIO
// ============================================================
const getAluno = id => DB.alunos.find(a => a.id === id);
const getPrograma = id => DB.programas.find(p => p.id === id);
const nomeAluno = id => (getAluno(id) || {}).nome || '(removido)';
const aulasDoAluno = id => DB.aulas.filter(a => a.alunoIds.includes(id));
const pagsDoAluno = id => DB.pagamentos.filter(p => p.alunoId === id);
const aulaConta = a => a.status !== 'cancelada' && a.status !== 'remarcada';
const aulaConsumida = a => a.status === 'realizada' || a.status === 'falta';
const aulaPendenteConfirmacao = a => a.status === 'agendada' && fimAula(a) < new Date();

function nomesAula(a) {
  const ns = a.alunoIds.map(nomeAluno);
  if (ns.length === 1) return ns[0];
  if (ns.length > 3) return ns.slice(0, 3).map(primeiroNome).join(', ') + ' +' + (ns.length - 3);
  return ns.map(primeiroNome).join(', ');
}
function corAula(a) {
  if (a.alunoIds.length > 1) return COR_GRUPO;
  const al = getAluno(a.alunoIds[0]);
  return al ? corValida(al.cor) : '#6366F1';
}
function statusPag(p) {
  if (p.pagoEm) return 'pago';
  return p.vencimento < hojeISO() ? 'atrasado' : 'pendente';
}
function finAluno(id) {
  const ps = pagsDoAluno(id);
  const pago = soma(ps.filter(p => p.pagoEm), p => p.valor);
  const cobrado = soma(ps, p => p.valor);
  const atrasados = ps.filter(p => statusPag(p) === 'atrasado');
  return { qtd: ps.length, cobrado, pago, aberto: cobrado - pago, atrasado: soma(atrasados, p => p.valor), qtdAtrasado: atrasados.length };
}
const pacote = al => !al.modoCobranca || al.modoCobranca === 'mensal' || al.modoCobranca === 'avista';
function textoModo(al) {
  const m = al.modoCobranca || 'mensal';
  if (m === 'aula') return al.valorUnit ? `${fmtBRL(al.valorUnit)} por aula` : 'Por aula';
  if (m === 'semanal') return al.valorUnit ? `${fmtBRL(al.valorUnit)} por semana` : 'Por semana';
  return (m === 'avista' ? 'À vista' : 'Parcelado') + (al.valor ? ' · ' + fmtBRL(al.valor) : '');
}
function badgeFin(id) {
  const f = finAluno(id);
  if (!f.qtd) return badge('Sem cobranças', 'gray');
  if (f.qtdAtrasado) return badge('⚠ Em atraso', 'danger');
  if (f.aberto <= 0.005) return badge('✓ Quitado', 'success');
  return badge('Em dia', 'info');
}
function progressoAluno(id) {
  const as = aulasDoAluno(id).filter(aulaConta);
  const agora = new Date();
  const proxima = as.filter(a => a.status === 'agendada' && fimAula(a) >= agora).sort(porDataHora)[0] || null;
  const j = jornadaAluno(id);
  // com programa: progresso = temas já dados (falta não conta, a aula precisa ser remarcada)
  if (j.total) return { total: j.total, feitas: j.realizadas, proxima };
  return { total: as.length, feitas: as.filter(aulaConsumida).length, proxima };
}
// Jornada do programa: uma "vaga" por tema (aula 1..N), com o que aconteceu em cada uma
function jornadaAluno(id) {
  const al = getAluno(id);
  const pr = al && getPrograma(al.programaId);
  const temas = pr ? pr.temas : [];
  const aulas = aulasDoAluno(id);
  const slots = temas.map((tema, i) => {
    const doSlot = aulas.filter(a => num(a.numero) === i + 1).sort(porDataHora);
    return {
      n: i + 1, tema, aulas: doSlot,
      realizada: doSlot.find(a => a.status === 'realizada') || null,
      agendada: doSlot.find(a => a.status === 'agendada') || null,
      faltas: doSlot.filter(a => a.status === 'falta')
    };
  });
  const realizadas = slots.filter(s => s.realizada).length;
  const concluida = !!temas.length && realizadas === temas.length;
  return {
    pr, slots, total: temas.length, realizadas,
    faltas: aulas.filter(a => a.status === 'falta').length,
    agendadas: slots.filter(s => !s.realizada && s.agendada).length,
    concluida, dataFim: concluida ? slots.map(s => s.realizada.data).sort().pop() : ''
  };
}
// Suporte pós-mentoria
function suporteAluno(al) {
  const s = al && al.suporte;
  if (!s || !s.inicio) return null;
  const dias = num(s.dias) || 30;
  const fim = addDias(s.inicio, dias);
  const hoje = hojeISO();
  const estado = hoje < s.inicio ? 'futuro' : hoje <= fim ? 'ativo' : 'encerrado';
  return { ...s, dias, fim, estado, restam: diasEntre(hoje, fim), decorridos: Math.min(dias, Math.max(0, diasEntre(s.inicio, hoje))) };
}
// Quando a última aula do programa é realizada, o suporte começa sozinho
function verificarFimJornada(alunoIds) {
  alunoIds.forEach(id => {
    const al = getAluno(id);
    if (!al || (al.suporte && al.suporte.inicio)) return;
    const j = jornadaAluno(id);
    if (!j.concluida) return;
    const diasSup = j.pr && j.pr.suporteDias != null && j.pr.suporteDias !== '' ? num(j.pr.suporteDias) : 30;
    if (!diasSup) return; // programa sem suporte
    al.suporte = { inicio: j.dataFim, dias: diasSup, atendimentos: (al.suporte && al.suporte.atendimentos) || [] };
    setTimeout(() => toast(`🎉 ${primeiroNome(al.nome)} concluiu as ${j.total} aulas! Suporte de ${al.suporte.dias} dias até ${fmtData(addDias(j.dataFim, al.suporte.dias))}`), 400);
  });
}
function proximoNumeroAula(alunoId) {
  const ns = aulasDoAluno(alunoId).filter(aulaConta).map(a => num(a.numero));
  return (ns.length ? Math.max(...ns) : 0) + 1;
}
function datasCronograma(inicio, freq, n) {
  const f = FREQ[freq] || FREQ.semanal;
  const out = [];
  for (let i = 0; i < n; i++) out.push(f.meses ? addMeses(inicio, i * f.meses) : addDias(inicio, i * f.dias));
  return out;
}
function fimPrevisto(programa, inicio) {
  if (!programa || !inicio || !programa.temas.length) return '';
  const ds = datasCronograma(inicio, programa.frequencia, programa.temas.length);
  return ds[ds.length - 1];
}

// ============================================================
// COMPONENTES
// ============================================================
function avatar(al, cls) {
  if (!al) return `<span class="avatar ${cls || ''}" style="background:#475569">?</span>`;
  return `<span class="avatar ${cls || ''}" style="background:${corValida(al.cor)}">${esc(iniciais(al.nome))}</span>`;
}
function pessoaHTML(al, sub) {
  return `<div class="pessoa">${avatar(al)}<div style="min-width:0"><div class="nome">${esc(al ? al.nome : '(removido)')}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div></div>`;
}
function pessoasAula(a) {
  if (a.alunoIds.length === 1) return pessoaHTML(getAluno(a.alunoIds[0]));
  return `<div class="pessoa"><span class="avatar" style="background:${COR_GRUPO}">${a.alunoIds.length}</span><div style="min-width:0"><div class="nome">Grupo</div><div class="sub">${esc(nomesAula(a))}</div></div></div>`;
}
function badgeAula(a) {
  if (aulaPendenteConfirmacao(a)) return badge('A confirmar', 'warning');
  const s = STATUS_AULA[a.status] || STATUS_AULA.agendada;
  return badge(s.l, s.c);
}
function badgePag(p) {
  const st = statusPag(p);
  if (st === 'pago') return badge('✓ Pago em ' + fmtDataCurta(p.pagoEm), 'success');
  const d = diasEntre(hojeISO(), p.vencimento);
  if (st === 'atrasado') return badge(`Atrasado há ${plural(-d, 'dia')}`, 'danger');
  if (d === 0) return badge('Vence hoje', 'orange');
  if (d <= 7) return badge(`Vence em ${plural(d, 'dia')}`, 'warning');
  return badge('A vencer', 'gray');
}
function barraProgresso(feitas, total, cor, faltas) {
  const pct = total ? Math.round(feitas / total * 100) : 0;
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${cor || 'var(--accent)'}"></div></div><div class="prog-txt">${feitas}/${total} aulas · ${pct}%${faltas ? ` · <span class="neg">${plural(faltas, 'falta')}</span>` : ''}</div>`;
}
function seg(opts, atual, fn) {
  return `<div class="seg">${opts.map(([v, l]) => `<button class="${v === atual ? 'on' : ''}" onclick="${fn(v)}">${l}</button>`).join('')}</div>`;
}
function optionsAlunos(sel, vazio) {
  const ord = DB.alunos.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  return (vazio ? `<option value="">${vazio}</option>` : '') + ord.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.nome)}</option>`).join('');
}
function options(obj, sel) {
  return Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(v.l || v)}</option>`).join('');
}
function optionsLista(lista, sel) {
  return lista.map(v => `<option ${v === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
const filtros = {
  aulas: { periodo: 'proximas', aluno: '', status: '', busca: '' },
  alunos: { status: 'ativo', busca: '' },
  fin: { status: 'abertos', aluno: '', mes: '' }
};
let agendaMes = hojeISO().slice(0, 7);
let agendaPags = true;

const PAGINAS = {
  dashboard: {
    t: 'Visão Geral', r: () => renderDashboard(),
    sub: () => { const d = new Date(); return `Olá, ${DB.config.mentor || 'mentor'} · ${DIAS_SEM_LONGO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; },
    acoes: `<button class="btn btn-ghost" onclick="novaCobranca()">+ Cobrança</button><button class="btn btn-ghost" onclick="novoAluno()">+ Mentorado</button><button class="btn btn-primary" onclick="novaAula()">+ Nova aula</button>`
  },
  agenda: { t: 'Agenda', r: () => renderAgenda(), sub: () => 'Clique em um dia para ver todas as aulas dele', acoes: `<button class="btn btn-primary" onclick="novaAula()">+ Nova aula</button>` },
  aulas: { t: 'Aulas', r: () => renderAulas(), sub: () => 'Datas, horários, temas e registro de cada encontro', acoes: `<button class="btn btn-primary" onclick="novaAula()">+ Nova aula</button>` },
  alunos: { t: 'Mentorados', r: () => renderAlunos(), sub: () => 'Clique em um mentorado para ver tudo sobre ele', acoes: `<button class="btn btn-primary" onclick="novoAluno()">+ Novo mentorado</button>` },
  programas: { t: 'Programas & Temas', r: () => renderProgramas(), sub: () => 'Modelos de mentoria com a sequência de temas das aulas', acoes: `<button class="btn btn-primary" onclick="novoPrograma()">+ Novo programa</button>` },
  financeiro: { t: 'Financeiro', r: () => renderFinanceiro(), sub: () => 'Quem já pagou, quem está devendo e o que vai entrar', acoes: `<button class="btn btn-ghost" onclick="exportarCSV()">⬇ Exportar CSV</button><button class="btn btn-primary" onclick="novaCobranca()">+ Nova cobrança</button>` },
  config: { t: 'Configurações', r: () => renderConfig(), sub: () => 'Preferências, mensagens e backup', acoes: '' }
};

function ir(p) {
  paginaAtual = p;
  document.querySelectorAll('.nav-item, .mnav-item').forEach(n => n.classList.toggle('active', n.dataset.page === p));
  const mais = $('mnav-mais');
  if (mais) mais.classList.toggle('active', p === 'programas' || p === 'config');
  document.querySelectorAll('.page').forEach(s => s.classList.toggle('active', s.id === 'page-' + p));
  $('content').scrollTop = 0;
  renderTudo();
}
function setFiltro(pg, campo, valor) { filtros[pg][campo] = valor; renderTudo(); }

function renderTudo() {
  renderSidebar();
  const pg = PAGINAS[paginaAtual];
  $('page-title').textContent = pg.t;
  $('page-sub').textContent = pg.sub ? pg.sub() : '';
  $('topbar-actions').innerHTML = pg.acoes || '';
  pg.r();
  if ($('modal-detalhe').classList.contains('open')) renderDetalhe();
}

function renderSidebar() {
  const mes = hojeISO().slice(0, 7);
  const recebido = soma(DB.pagamentos.filter(p => p.pagoEm && p.pagoEm.slice(0, 7) === mes), p => p.valor);
  const aberto = soma(DB.pagamentos.filter(p => !p.pagoEm && p.vencimento.slice(0, 7) <= mes), p => p.valor);
  $('side-label').textContent = 'Recebido em ' + MESES[+mes.slice(5) - 1];
  $('side-valor').textContent = fmtBRL(recebido);
  $('side-sub').textContent = fmtBRL(aberto) + ' em aberto até o fim do mês';
  const atr = DB.pagamentos.filter(p => statusPag(p) === 'atrasado').length;
  const pend = DB.aulas.filter(aulaPendenteConfirmacao).length;
  $('cnt-fin').style.display = atr ? '' : 'none'; $('cnt-fin').textContent = atr;
  $('cnt-aulas').style.display = pend ? '' : 'none'; $('cnt-aulas').textContent = pend;
}

// ============================================================
// PÁGINA: VISÃO GERAL
// ============================================================
function renderDashboard() {
  const agora = new Date(), hoje = hojeISO(), mes = hoje.slice(0, 7);
  const ativos = DB.alunos.filter(a => a.status === 'ativo');
  const [si, sf] = semanaAtual();
  const semana = DB.aulas.filter(a => a.data >= si && a.data <= sf && aulaConta(a));
  const aulasHoje = DB.aulas.filter(a => a.data === hoje && aulaConta(a));
  const recMes = soma(DB.pagamentos.filter(p => p.pagoEm && p.pagoEm.slice(0, 7) === mes), p => p.valor);
  const abertoMes = soma(DB.pagamentos.filter(p => !p.pagoEm && p.vencimento.slice(0, 7) === mes), p => p.valor);
  const atrasados = DB.pagamentos.filter(p => statusPag(p) === 'atrasado');
  const pend = DB.aulas.filter(aulaPendenteConfirmacao);
  const proximas = DB.aulas.filter(a => a.status === 'agendada' && fimAula(a) >= agora && a.data !== hoje).sort(porDataHora).slice(0, 7);
  const vencendo = DB.pagamentos.filter(p => !p.pagoEm && p.vencimento <= addDias(hoje, 10)).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 7);

  let h = '';
  if (!DB.alunos.length) {
    h += `<div class="card mb-16"><div class="empty-state" style="padding:36px 20px"><div class="icon">🚀</div>
      <p style="font-size:16px;color:var(--text);font-weight:700;margin-bottom:6px">Bem-vindo ao seu sistema de mentorias!</p>
      <p>Cadastre seu primeiro mentorado — em seguida o sistema monta o cronograma de aulas e as parcelas automaticamente.</p>
      <button class="btn btn-primary" onclick="novoAluno()">+ Cadastrar primeiro mentorado</button>
      <button class="btn btn-ghost" onclick="ir('programas')" style="margin-left:6px">📚 Ver programa modelo</button></div></div>`;
  }
  if (pend.length) {
    h += `<div class="alerta alerta-warn"><span style="font-size:20px">📝</span><div class="grow"><b>${plural(pend.length, 'aula já passou', 'aulas já passaram')}</b> e ainda ${pend.length === 1 ? 'está' : 'estão'} como "agendada". Confirme se ${pend.length === 1 ? 'foi realizada' : 'foram realizadas'}.</div><button class="btn btn-ghost btn-sm" onclick="filtros.aulas.periodo='pendentes';ir('aulas')">Revisar</button></div>`;
  }
  if (atrasados.length) {
    const nAl = new Set(atrasados.map(p => p.alunoId)).size;
    h += `<div class="alerta alerta-danger"><span style="font-size:20px">💸</span><div class="grow"><b>${plural(atrasados.length, 'pagamento em atraso', 'pagamentos em atraso')}</b> somando <b>${fmtBRL(soma(atrasados, p => p.valor))}</b> (${plural(nAl, 'mentorado')}).</div><button class="btn btn-ghost btn-sm" onclick="filtros.fin.status='atrasado';ir('financeiro')">Ver cobranças</button></div>`;
  }

  if (aulasHoje.length) {
    h += `<div class="card mb-16"><div class="card-head"><h3>🗓 Suas aulas de hoje <span class="muted" style="font-weight:500;font-size:12px">· ${plural(aulasHoje.length, 'aula')} · ${aulasHoje.filter(aulaConsumida).length} feita${aulasHoje.filter(aulaConsumida).length === 1 ? '' : 's'}</span></h3>
      <button class="btn btn-ghost btn-xs" onclick="novaAula({data:'${hoje}'})">+ Aula hoje</button></div>${timelineDia(hoje)}</div>`;
  }

  h += `<div class="cards-grid grid-4 mb-16">
    <div class="card kpi"><span class="kpi-icon">👥</span><div class="card-label">Mentorados ativos</div><div class="card-value">${ativos.length}</div>
      <div class="card-sub">${DB.alunos.filter(a => a.status === 'lead').length} negociando · ${DB.alunos.filter(a => a.status === 'concluido').length} concluídos</div></div>
    <div class="card kpi"><span class="kpi-icon">🎓</span><div class="card-label">Aulas nesta semana</div><div class="card-value">${semana.length}</div>
      <div class="card-sub">${semana.filter(aulaConsumida).length} realizadas · ${aulasHoje.length} hoje</div></div>
    <div class="card kpi"><span class="kpi-icon">💰</span><div class="card-label">Recebido no mês</div><div class="card-value pos">${fmtBRL(recMes)}</div>
      <div class="card-sub">${fmtBRL(abertoMes)} ainda a receber no mês</div></div>
    <div class="card kpi"><span class="kpi-icon">⚠️</span><div class="card-label">Em atraso</div><div class="card-value ${atrasados.length ? 'neg' : ''}">${fmtBRL(soma(atrasados, p => p.valor))}</div>
      <div class="card-sub">${plural(atrasados.length, 'parcela')} vencida${atrasados.length === 1 ? '' : 's'}</div></div>
  </div>`;

  h += `<div class="cards-grid grid-2 mb-16">
    <div class="card"><div class="card-head"><h3>📅 Próximas aulas</h3><button class="btn btn-ghost btn-xs" onclick="ir('agenda')">Ver agenda</button></div>
      ${proximas.length ? proximas.map(itemAulaLista).join('') : '<div class="empty-mini">Nenhuma aula agendada.</div>'}</div>
    <div class="card"><div class="card-head"><h3>💳 Pagamentos a receber</h3><button class="btn btn-ghost btn-xs" onclick="ir('financeiro')">Ver financeiro</button></div>
      ${vencendo.length ? vencendo.map(itemPagLista).join('') : '<div class="empty-mini">Nada vencido nem vencendo nos próximos 10 dias. 🎉</div>'}</div>
  </div>`;

  const emSuporte = DB.alunos.map(al => ({ al, sp: suporteAluno(al) }))
    .filter(x => x.sp && (x.sp.estado !== 'encerrado' || x.al.status === 'ativo'))
    .sort((a, b) => a.sp.fim.localeCompare(b.sp.fim));
  if (emSuporte.length) {
    h += `<div class="card mb-16"><div class="card-head"><h3>🛟 Suporte pós-mentoria</h3></div>${emSuporte.map(({ al, sp }) => {
      const ult = sp.atendimentos.slice().sort((a, b) => b.data.localeCompare(a.data))[0];
      return `<div class="lista-item" onclick="abrirDetalhe('${al.id}','suporte')">${avatar(al)}
        <div class="info"><div class="l1">${esc(al.nome)}</div><div class="l2">${fmtData(sp.inicio)} → ${fmtData(sp.fim)} · ${plural(sp.atendimentos.length, 'atendimento')}${ult ? ' · último ' + fmtDataCurta(ult.data) : ''}</div></div>
        <div class="dir">${sp.estado === 'ativo' ? badge(`faltam ${plural(sp.restam, 'dia')}`, sp.restam <= 5 ? 'warning' : 'success') : sp.estado === 'futuro' ? badge('começa ' + fmtDataCurta(sp.inicio), 'info')
          : `<button class="btn btn-success btn-xs" onclick="event.stopPropagation();concluirMentoria('${al.id}')">✓ Concluir</button><div class="muted" style="font-size:11px;margin-top:3px">suporte encerrado</div>`}</div></div>`;
    }).join('')}</div>`;
  }

  if (ativos.length) {
    h += `<div class="card mb-16"><div class="card-head"><h3>🚀 Andamento dos mentorados ativos</h3></div><div class="table-wrap"><table>
      <thead><tr><th>Mentorado</th><th>Programa</th><th style="width:180px">Progresso</th><th>Próxima aula</th><th>Pagamento</th></tr></thead><tbody>
      ${ativos.sort((a, b) => a.nome.localeCompare(b.nome)).map(al => {
        const pr = progressoAluno(al.id); const prog = getPrograma(al.programaId);
        return `<tr class="clicavel" onclick="abrirDetalhe('${al.id}')"><td>${pessoaHTML(al, esc([al.loja, al.plataforma].filter(Boolean).join(' · ')))}</td>
          <td class="text-sm">${esc(prog ? prog.nome : '—')}</td><td>${barraProgresso(pr.feitas, pr.total, corValida(al.cor), aulasDoAluno(al.id).filter(a => a.status === 'falta').length)}</td>
          <td class="text-sm">${pr.proxima ? `${fmtDataSemana(pr.proxima.data)} · ${pr.proxima.hora}<div class="muted" style="font-size:11px">${esc(pr.proxima.tema)}</div>` : '<span class="muted">—</span>'}</td>
          <td>${badgeFin(al.id)}</td></tr>`;
      }).join('')}</tbody></table></div></div>`;
  }

  h += cardGraficoReceita('graf-dash');
  $('page-dashboard').innerHTML = h;
  desenharGraficoReceita('graf-dash');
}

function itemAulaLista(a) {
  const d = parseISO(a.data); const rd = relDia(a.data);
  return `<div class="lista-item" onclick="editarAula('${a.id}')">
    <div class="data-box ${a.data === hojeISO() ? 'hoje' : ''}"><div class="d">${d.getDate()}</div><div class="m">${rd === 'Hoje' ? 'hoje' : MESES_CURTO[d.getMonth()]}</div></div>
    <div class="info"><div class="l1"><span class="dot" style="background:${corAula(a)};margin-right:6px"></span>${esc(nomesAula(a))}</div>
      <div class="l2">${a.numero ? 'Aula ' + esc(a.numero) + ' · ' : ''}${esc(a.tema)}</div></div>
    <div class="dir"><div class="td-mono font-bold">${esc(a.hora)}</div><div class="muted text-sm">${rd && rd !== 'Hoje' ? rd : DIAS_SEM[d.getDay()]}</div></div></div>`;
}
function itemPagLista(p) {
  const al = getAluno(p.alunoId);
  return `<div class="lista-item" onclick="editarPagamento('${p.id}')">
    ${avatar(al)}
    <div class="info"><div class="l1">${esc(al ? al.nome : '(removido)')}</div><div class="l2">${esc(p.descricao || 'Cobrança')} · vence ${fmtData(p.vencimento)}</div></div>
    <div class="dir"><div class="td-mono font-bold">${fmtBRL(p.valor)}</div><div style="margin-top:3px">${badgePag(p)}</div></div>
    <div onclick="event.stopPropagation()" class="flex gap-8">
      <button class="btn btn-success btn-xs" onclick="marcarPago('${p.id}')" title="Marcar como pago">✓</button>
      ${al && al.whatsapp ? `<button class="btn btn-whats btn-xs" onclick="cobrarWhats('${p.id}')" title="Cobrar no WhatsApp">💬</button>` : ''}
    </div></div>`;
}

// ============================================================
// GRÁFICOS (canvas puro)
// ============================================================
function niceStep(x) {
  if (x <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const f = x / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
function drawBars(cv, labels, series, opts = {}) {
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();
  const W = rect.width, H = rect.height;
  if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const tot = labels.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
  const step = niceStep(Math.max(...tot, 1) / 4);
  const max = Math.max(step * 4, Math.ceil(Math.max(...tot, 1) / step) * step);
  c.font = '11px "Segoe UI", sans-serif';
  // margem esquerda só do tamanho dos valores do eixo (sobra mais espaço para os meses no iPhone)
  let larguraEixo = 0;
  for (let v = 0; v <= max + 0.001; v += step) larguraEixo = Math.max(larguraEixo, c.measureText(opts.fmt ? opts.fmt(v) : String(v)).width);
  const L = Math.ceil(larguraEixo) + 12, R = 6, T = 12, B = 26, pw = W - L - R, ph = H - T - B, n = labels.length;
  for (let v = 0; v <= max + 0.001; v += step) {
    const y = T + ph - (v / max) * ph;
    c.strokeStyle = 'rgba(148,163,184,0.12)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, Math.round(y) + 0.5); c.lineTo(W - R, Math.round(y) + 0.5); c.stroke();
    c.fillStyle = '#64748B'; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText(opts.fmt ? opts.fmt(v) : String(v), L - 8, y);
  }
  const slot = pw / n, bw = Math.min(36, slot * 0.62);
  // Em tela estreita usa rótulo curto (só o mês) e fonte menor; se ainda não couber, pula alguns
  const rotulos = (opts.curtos && slot < 44) ? opts.curtos : labels;
  const fonteRot = slot < 30 ? 10 : 11;
  c.font = `bold ${fonteRot}px "Segoe UI", sans-serif`;
  const larguraRotulo = Math.max(...rotulos.map(l => c.measureText(l).width)) + 4;
  const passo = Math.max(1, Math.ceil(larguraRotulo / slot));
  const ref = opts.destaque || 0;
  labels.forEach((lb, i) => {
    const x = L + slot * i + (slot - bw) / 2;
    let y = T + ph;
    series.forEach(se => {
      const v = se.values[i] || 0;
      if (v <= 0) return;
      const h = Math.max(1, (v / max) * ph);
      c.fillStyle = typeof se.cor === 'function' ? se.cor(i) : se.cor;
      c.fillRect(x, y - h, bw, h - 1);
      y -= h;
    });
    if ((i - ref) % passo !== 0) return;
    c.fillStyle = i === opts.destaque ? '#F1F5F9' : '#64748B';
    c.font = (i === opts.destaque ? 'bold ' : '') + fonteRot + 'px "Segoe UI", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(rotulos[i], x + bw / 2, T + ph + 8);
  });
  cv.onmousemove = e => {
    const r = cv.getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left - L) / slot);
    if (i < 0 || i >= n) { cv.title = ''; return; }
    cv.title = labels[i] + '\n' + series.map(se => se.nome + ': ' + (opts.fmtFull ? opts.fmtFull(se.values[i] || 0) : se.values[i])).join('\n');
  };
}

function cardGraficoReceita(id) {
  return `<div class="card"><div class="card-head"><h3>📈 Receita das mentorias <span class="muted" style="font-weight:500;font-size:12px">· 6 meses atrás e 6 à frente</span></h3>
    <div class="legenda" style="margin:0"><span><span class="dot" style="background:#10B981"></span>Recebido</span><span><span class="dot" style="background:#6366F1"></span>A receber</span><span><span class="dot" style="background:#EF4444"></span>Em atraso</span></div></div>
    <div class="chart-wrap"><canvas id="${id}"></canvas></div></div>`;
}
function desenharGraficoReceita(id) {
  const base = hojeISO().slice(0, 7) + '-01';
  const meses = [];
  for (let i = -5; i <= 6; i++) meses.push(addMeses(base, i).slice(0, 7));
  const rec = meses.map(m => soma(DB.pagamentos.filter(p => p.pagoEm && p.pagoEm.slice(0, 7) === m), p => p.valor));
  const ab = meses.map(m => soma(DB.pagamentos.filter(p => !p.pagoEm && p.vencimento.slice(0, 7) === m), p => p.valor));
  const atual = hojeISO();
  const cores = meses.map(m => DB.pagamentos.some(p => !p.pagoEm && p.vencimento.slice(0, 7) === m && p.vencimento < atual) ? '#EF4444' : '#6366F1');
  requestAnimationFrame(() => drawBars($(id), meses.map(fmtMes), [
    { nome: 'Recebido', cor: '#10B981', values: rec },
    { nome: 'A receber / atrasado', cor: i => cores[i], values: ab }
  ], { fmt: fmtCurto, fmtFull: fmtBRL, destaque: 5, curtos: meses.map(m => MESES_CURTO[+m.slice(5) - 1]) }));
}

// ============================================================
// PÁGINA: AGENDA
// ============================================================
let agendaDia = hojeISO();
function moverAgenda(n) {
  if (n === 0) { agendaMes = hojeISO().slice(0, 7); agendaDia = hojeISO(); }
  else agendaMes = addMeses(agendaMes + '-01', n).slice(0, 7);
  renderTudo();
}
function selecionarDia(dia) {
  agendaDia = dia;
  if (dia.slice(0, 7) !== agendaMes) agendaMes = dia.slice(0, 7);
  renderTudo();
  const p = $('painel-dia');
  if (p && window.innerWidth <= 768) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function painelDia() {
  const d = parseISO(agendaDia);
  const l = DB.aulas.filter(a => a.data === agendaDia && aulaConta(a));
  const rd = relDia(agendaDia);
  const pags = DB.pagamentos.filter(p => !p.pagoEm && p.vencimento === agendaDia);
  return `<div class="card painel-dia" id="painel-dia"><div class="card-head">
      <div class="flex items-center gap-8">
        <button class="btn btn-ghost btn-sm" onclick="selecionarDia(addDias(agendaDia,-1))" title="Dia anterior">‹</button>
        <h3 style="font-size:16px">${rd ? rd + ' · ' + DIAS_SEM_LONGO[d.getDay()] : DIAS_SEM_LONGO[d.getDay()].replace(/^./, c => c.toUpperCase())}, ${d.getDate()} de ${MESES[d.getMonth()]}</h3>
        <button class="btn btn-ghost btn-sm" onclick="selecionarDia(addDias(agendaDia,1))" title="Próximo dia">›</button>
      </div>
      <div class="flex items-center gap-8"><span class="muted text-sm">${plural(l.length, 'aula')}${l.length ? ' · ' + (soma(l, a => a.duracao) / 60).toFixed(1).replace('.', ',').replace(',0', '') + 'h' : ''}</span>
        <button class="btn btn-primary btn-sm" onclick="novaAula({data:agendaDia})">+ Aula neste dia</button></div></div>
    ${timelineDia(agendaDia)}
    ${pags.length ? `<div class="card-label" style="margin-top:14px">💰 Vencimentos do dia</div>${pags.map(itemPagLista).join('')}` : ''}
  </div>`;
}
function renderAgenda() {
  const [y, m] = agendaMes.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const diasMes = new Date(y, m, 0).getDate();
  const nCel = Math.ceil((offset + diasMes) / 7) * 7;
  const inicio = toISO(new Date(y, m - 1, 1 - offset));
  const hoje = hojeISO();
  const porDia = {};
  DB.aulas.forEach(a => { (porDia[a.data] = porDia[a.data] || { aulas: [], pags: [] }).aulas.push(a); });
  if (agendaPags) DB.pagamentos.forEach(p => { if (!p.pagoEm) (porDia[p.vencimento] = porDia[p.vencimento] || { aulas: [], pags: [] }).pags.push(p); });

  const noMes = DB.aulas.filter(a => a.data.slice(0, 7) === agendaMes && aulaConta(a));
  let h = `<div class="cal-toolbar"><div class="flex items-center gap-8">
      <button class="btn btn-ghost btn-sm" onclick="moverAgenda(-1)">‹</button>
      <h3>${MESES[m - 1]} ${y}</h3>
      <button class="btn btn-ghost btn-sm" onclick="moverAgenda(1)">›</button>
      <button class="btn btn-ghost btn-sm" onclick="moverAgenda(0)">Hoje</button></div>
    <div class="flex items-center gap-8" style="gap:16px">
      <span class="muted text-sm">${plural(noMes.length, 'aula')} no mês · ${noMes.filter(aulaConsumida).length} realizadas</span>
      <label class="check-line"><input type="checkbox" ${agendaPags ? 'checked' : ''} onchange="agendaPags=this.checked;renderTudo()"> Mostrar vencimentos</label></div></div>
    <div class="cal-grid">${['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(d => `<div class="cal-head">${d}</div>`).join('')}`;
  for (let i = 0; i < nCel; i++) {
    const dia = addDias(inicio, i);
    const cel = porDia[dia] || { aulas: [], pags: [] };
    const aulas = cel.aulas.slice().sort(porDataHora);
    h += `<div class="cal-day ${dia.slice(0, 7) !== agendaMes ? 'outro' : ''} ${dia === hoje ? 'hoje' : ''} ${dia === agendaDia ? 'sel' : ''}" onclick="selecionarDia('${dia}')">
      <div class="cal-num"><span>${+dia.slice(8)}</span>${aulas.filter(aulaConta).length > 1 ? `<span class="cal-qtd">${aulas.filter(aulaConta).length}</span>` : ''}</div>
      ${aulas.map(a => { const cor = corAula(a); return `<div class="cal-ev ${aulaConta(a) ? '' : 'cancelada'}" style="--c:${cor};border-left-color:${cor};background:${cor}22" onclick="event.stopPropagation();editarAula('${a.id}')" title="${esc(a.hora + ' · ' + nomesAula(a) + '\n' + a.tema + ' — ' + (STATUS_AULA[a.status] || {}).l)}">${a.status === 'realizada' ? '✓ ' : ''}${esc(a.hora)} ${esc(primeiroNome(nomesAula(a)))}${a.alunoIds.length > 1 ? ' +' + (a.alunoIds.length - 1) : ''}</div>`; }).join('')}
      ${cel.pags.map(p => `<div class="cal-ev pag ${statusPag(p) === 'atrasado' ? 'atrasado' : ''}" onclick="event.stopPropagation();editarPagamento('${p.id}')" title="${esc(nomeAluno(p.alunoId) + ' — ' + (p.descricao || '') + ' ' + fmtBRL(p.valor))}">💰 ${esc(primeiroNome(nomeAluno(p.alunoId)))} ${fmtCurto(p.valor)}</div>`).join('')}
    </div>`;
  }
  h += `</div>`;
  const ativos = DB.alunos.filter(a => a.status === 'ativo');
  h += `<div class="legenda">${ativos.map(a => `<span><span class="dot" style="background:${corValida(a.cor)}"></span>${esc(a.nome)}</span>`).join('')}
    <span><span class="dot" style="background:${COR_GRUPO}"></span>Aula em grupo</span>${agendaPags ? `<span>💰 Vencimento em aberto</span>` : ''}</div>`;
  $('page-agenda').innerHTML = `<div class="agenda-layout"><div>${h}</div>${painelDia()}</div>`;
}

// ============================================================
// PÁGINA: AULAS
// ============================================================
function renderAulas() {
  const f = filtros.aulas;
  const nPend = DB.aulas.filter(aulaPendenteConfirmacao).length;
  const per = [['proximas', 'Próximas'], ['pendentes', 'A confirmar' + (nPend ? ` (${nPend})` : '')], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['passadas', 'Histórico'], ['todas', 'Todas']];
  $('page-aulas').innerHTML = `<div class="filtros">
      ${seg(per, f.periodo, v => `setFiltro('aulas','periodo','${v}')`)}
      <select onchange="setFiltro('aulas','aluno',this.value)">${optionsAlunos(f.aluno, 'Todos os mentorados')}</select>
      <select onchange="setFiltro('aulas','status',this.value)"><option value="">Todos os status</option>${options(STATUS_AULA, f.status)}</select>
      <input class="busca" placeholder="🔍 Buscar tema, pauta, anotação..." value="${esc(f.busca)}" oninput="filtros.aulas.busca=this.value;renderAulasTabela()">
    </div><div class="card" style="padding:6px" id="aulas-tabela"></div>`;
  renderAulasTabela();
}
function filtrarAulas() {
  const f = filtros.aulas, agora = new Date(), hoje = hojeISO();
  let l = DB.aulas.slice();
  if (f.periodo === 'proximas') l = l.filter(a => fimAula(a) >= agora && aulaConta(a));
  else if (f.periodo === 'pendentes') l = l.filter(aulaPendenteConfirmacao);
  else if (f.periodo === 'semana') { const [si, sf] = semanaAtual(); l = l.filter(a => a.data >= si && a.data <= sf); }
  else if (f.periodo === 'mes') l = l.filter(a => a.data.slice(0, 7) === hoje.slice(0, 7));
  else if (f.periodo === 'passadas') l = l.filter(a => fimAula(a) < agora);
  if (f.aluno) l = l.filter(a => a.alunoIds.includes(f.aluno));
  if (f.status) l = l.filter(a => a.status === f.status);
  if (f.busca) {
    const q = norm(f.busca);
    l = l.filter(a => norm([a.tema, a.pauta, a.tarefas, a.notas, a.alunoIds.map(nomeAluno).join(' ')].join(' ')).includes(q));
  }
  l.sort(porDataHora);
  if (f.periodo === 'passadas' || f.periodo === 'todas') l.reverse();
  return l;
}
function linhaAula(a, semAluno) {
  const hoje = hojeISO(), rd = relDia(a.data);
  const sub = a.tarefas ? '📋 ' + a.tarefas : (a.pauta || a.notas || '');
  const acoes = acoesAula(a);
  return `<tr class="clicavel ${a.data === hoje && a.status === 'agendada' ? 'linha-hoje' : ''} ${aulaConta(a) ? '' : 'linha-apagada'}" onclick="editarAula('${a.id}')">
    <td class="td-mono">${fmtDataSemana(a.data)} ${rd ? badge(rd, rd === 'Hoje' ? 'orange' : 'gray') : ''}</td>
    <td class="td-mono">${esc(a.hora)}–${horaFim(a.hora, a.duracao)}</td>
    ${semAluno ? '' : `<td>${pessoasAula(a)}</td>`}
    <td class="td-mono">${a.numero ? esc(a.numero) : '—'}</td>
    <td class="td-tema"><div class="t1">${esc(a.tema)}</div>${sub ? `<div class="t2">${esc(sub)}</div>` : ''}</td>
    <td>${badgeAula(a)}</td>
    <td class="td-acoes" onclick="event.stopPropagation()">${acoes}</td></tr>`;
}
// Lista das aulas de um dia, em ordem de horário (painel da agenda e "Hoje" da visão geral)
function timelineDia(dia) {
  const l = DB.aulas.filter(a => a.data === dia).sort(porDataHora);
  if (!l.length) return `<div class="empty-mini">Nenhuma aula neste dia.</div>`;
  return l.map(a => {
    const nomes = a.alunoIds.length > 1 ? 'Grupo: ' + a.alunoIds.map(nomeAluno).map(primeiroNome).join(', ') : nomeAluno(a.alunoIds[0]);
    return `<div class="tl-item ${aulaConta(a) ? '' : 'apagada'}" onclick="editarAula('${a.id}')">
      <div class="tl-hora"><b>${esc(a.hora)}</b><span>${horaFim(a.hora, a.duracao)}</span></div>
      <div class="tl-barra" style="background:${corAula(a)}"></div>
      <div class="tl-info"><div class="l1">${esc(nomes)}</div><div class="l2">${a.numero ? 'Aula ' + esc(a.numero) + ' · ' : ''}${esc(a.tema)}</div><div style="margin-top:4px">${badgeAula(a)}</div></div>
      <div class="tl-acoes" onclick="event.stopPropagation()">${acoesAula(a)}</div></div>`;
  }).join('');
}
function acoesAula(a) {
  const hoje = hojeISO(), pend = aulaPendenteConfirmacao(a);
  const futura = fimAula(a) >= new Date();
  let acoes = '';
  if (a.status === 'agendada' && (pend || a.data === hoje)) {
    acoes += `<button class="btn btn-success btn-xs" onclick="marcarAula('${a.id}','realizada')">✓ Realizada</button> <button class="btn btn-ghost btn-xs" onclick="marcarAula('${a.id}','falta')">Faltou</button> `;
  }
  if (a.status === 'agendada' && futura) {
    if (a.link) acoes += `<button class="btn btn-ghost btn-xs" onclick="abrirLinkAula('${a.id}','link')" title="Entrar na reunião">🎥</button> `;
    acoes += `<button class="btn btn-ghost btn-xs" onclick="lembreteAula('${a.id}')" title="Enviar lembrete no WhatsApp">💬</button> `;
  }
  if (a.gravacao) acoes += `<button class="btn btn-ghost btn-xs" onclick="abrirLinkAula('${a.id}','gravacao')" title="Abrir gravação">🎬</button> `;
  return acoes;
}
function renderAulasTabela() {
  const l = filtrarAulas();
  const el = $('aulas-tabela');
  if (!el) return;
  if (!l.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🎓</div><p>${DB.aulas.length ? 'Nenhuma aula encontrada com esses filtros.' : 'Nenhuma aula cadastrada ainda.'}</p><button class="btn btn-primary" onclick="novaAula()">+ Nova aula</button></div>`;
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Horário</th><th>Mentorado</th><th>Nº</th><th>Tema</th><th>Status</th><th></th></tr></thead>
    <tbody>${l.map(a => linhaAula(a)).join('')}</tbody></table></div>
    <div class="muted text-sm" style="padding:10px 14px">${plural(l.length, 'aula')} · ${l.filter(a => a.status === 'realizada').length} realizadas · ${l.filter(a => a.status === 'falta').length} faltas · ${soma(l.filter(aulaConsumida), a => a.duracao) / 60 | 0}h de mentoria dadas</div>`;
}
function marcarAula(id, status) {
  const a = DB.aulas.find(x => x.id === id);
  if (!a) return;
  a.status = status;
  if (status === 'realizada') a.alunoIds.forEach(al => { if (a.presencas[al] === undefined) a.presencas[al] = true; });
  ajustarCobrancasAula(a);
  if (status === 'realizada') verificarFimJornada(a.alunoIds);
  commit(status === 'realizada' ? 'Aula marcada como realizada ✓' : status === 'falta' ? 'Falta registrada — remarque pela Jornada' : 'Status da aula atualizado');
}
function abrirLinkAula(id, campo) {
  const a = DB.aulas.find(x => x.id === id);
  if (a && a[campo]) abrirURL(a[campo]);
}

// ============================================================
// PÁGINA: MENTORADOS
// ============================================================
function renderAlunos() {
  const f = filtros.alunos;
  const cont = s => DB.alunos.filter(a => a.status === s).length;
  const opts = [['ativo', `Ativos (${cont('ativo')})`], ['lead', `Negociando (${cont('lead')})`], ['pausado', `Pausados (${cont('pausado')})`], ['concluido', `Concluídos (${cont('concluido')})`], ['cancelado', `Cancelados (${cont('cancelado')})`], ['todos', `Todos (${DB.alunos.length})`]];
  $('page-alunos').innerHTML = `<div class="filtros">${seg(opts, f.status, v => `setFiltro('alunos','status','${v}')`)}
    <input class="busca" placeholder="🔍 Buscar nome, loja, nicho..." value="${esc(f.busca)}" oninput="filtros.alunos.busca=this.value;renderAlunosTabela()"></div>
    <div class="card" style="padding:6px" id="alunos-tabela"></div>`;
  renderAlunosTabela();
}
function renderAlunosTabela() {
  const f = filtros.alunos;
  let l = DB.alunos.slice();
  if (f.status !== 'todos') l = l.filter(a => a.status === f.status);
  if (f.busca) { const q = norm(f.busca); l = l.filter(a => norm([a.nome, a.loja, a.nicho, a.plataforma, a.email, a.instagram, a.cidade].join(' ')).includes(q)); }
  l.sort((a, b) => a.nome.localeCompare(b.nome));
  const el = $('alunos-tabela');
  if (!l.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">👥</div><p>${DB.alunos.length ? 'Nenhum mentorado encontrado.' : 'Nenhum mentorado cadastrado ainda.'}</p><button class="btn btn-primary" onclick="novoAluno()">+ Novo mentorado</button></div>`;
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Mentorado</th><th>Programa</th><th>Início</th><th style="width:170px">Progresso</th><th>Próxima aula</th><th>Pagamento</th><th>Status</th><th></th></tr></thead><tbody>
    ${l.map(al => {
      const pr = progressoAluno(al.id), fin = finAluno(al.id), prog = getPrograma(al.programaId), st = STATUS_ALUNO[al.status] || STATUS_ALUNO.ativo;
      return `<tr class="clicavel" onclick="abrirDetalhe('${al.id}')">
        <td>${pessoaHTML(al, esc([al.loja, al.plataforma, al.nicho].filter(Boolean).join(' · ')))}</td>
        <td class="text-sm">${esc(prog ? prog.nome : '—')}</td>
        <td class="td-mono">${fmtData(al.inicio)}</td>
        <td>${barraProgresso(pr.feitas, pr.total, corValida(al.cor), aulasDoAluno(al.id).filter(a => a.status === 'falta').length)}</td>
        <td class="text-sm">${pr.proxima ? `${fmtDataSemana(pr.proxima.data)} · ${esc(pr.proxima.hora)}` : '<span class="muted">—</span>'}</td>
        <td>${badgeFin(al.id)}<div class="prog-txt">${fmtBRL(fin.pago)} de ${fmtBRL(fin.cobrado || al.valor)}</div></td>
        <td>${badge(st.l, st.c)}</td>
        <td class="td-acoes" onclick="event.stopPropagation()">${al.whatsapp ? `<button class="btn btn-ghost btn-xs" onclick="abrirWhats('${al.id}')" title="Abrir conversa no WhatsApp">💬</button>` : ''}</td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}

// ============================================================
// PÁGINA: PROGRAMAS
// ============================================================
function renderProgramas() {
  if (!DB.programas.length) {
    $('page-programas').innerHTML = `<div class="card"><div class="empty-state"><div class="icon">📚</div><p>Crie um programa com a sequência de temas — o cronograma de cada mentorado sai pronto a partir dele.</p><button class="btn btn-primary" onclick="novoPrograma()">+ Novo programa</button></div></div>`;
    return;
  }
  $('page-programas').innerHTML = `<div class="cards-grid grid-2">${DB.programas.map(p => {
    const usando = DB.alunos.filter(a => a.programaId === p.id);
    return `<div class="card prog-card">
      <div class="flex justify-between items-center gap-8"><h3>${esc(p.nome)}</h3>
        <div class="flex gap-8"><button class="btn btn-ghost btn-xs" onclick="duplicarPrograma('${p.id}')">Duplicar</button><button class="btn btn-ghost btn-xs" onclick="editarPrograma('${p.id}')">✏️ Editar</button></div></div>
      <div class="desc">${esc(p.descricao || '')}</div>
      <div class="prog-meta">${p.plataforma ? badge('🛒 ' + p.plataforma, 'orange') : ''}${num(p.suporteDias) ? badge('🛟 ' + p.suporteDias + ' dias de suporte', 'success') : ''}${badge(plural(p.temas.length, 'aula'), 'accent')}${badge((FREQ[p.frequencia] || FREQ.semanal).l, 'info')}${badge((p.duracao || 60) + ' min', 'gray')}${p.hora ? badge('🕖 ' + p.hora, 'gray') : ''}${p.valor ? badge(fmtBRL(p.valor) + (p.parcelas > 1 ? ` em ${p.parcelas}x` : ''), 'success') : ''}${badge(plural(usando.filter(a => a.status === 'ativo').length, 'mentorado ativo', 'mentorados ativos'), 'orange')}</div>
      <ol class="temas-lista">${p.temas.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
    </div>`;
  }).join('')}</div>`;
}

// ============================================================
// PÁGINA: FINANCEIRO
// ============================================================
function renderFinanceiro() {
  const f = filtros.fin, hoje = hojeISO(), mes = hoje.slice(0, 7);
  const recMes = soma(DB.pagamentos.filter(p => p.pagoEm && p.pagoEm.slice(0, 7) === mes), p => p.valor);
  const abertoMes = soma(DB.pagamentos.filter(p => !p.pagoEm && p.vencimento.slice(0, 7) === mes && p.vencimento >= hoje), p => p.valor);
  const atr = DB.pagamentos.filter(p => statusPag(p) === 'atrasado');
  const futuro = soma(DB.pagamentos.filter(p => !p.pagoEm && p.vencimento >= hoje), p => p.valor);
  const recAno = soma(DB.pagamentos.filter(p => p.pagoEm && p.pagoEm.slice(0, 4) === hoje.slice(0, 4)), p => p.valor);
  const ops = [['abertos', 'Em aberto'], ['atrasado', `Atrasados (${atr.length})`], ['pago', 'Pagos'], ['todos', 'Todos']];

  let h = `<div class="cards-grid grid-4 mb-16">
    <div class="card kpi"><span class="kpi-icon">✅</span><div class="card-label">Recebido em ${MESES[+mes.slice(5) - 1]}</div><div class="card-value pos">${fmtBRL(recMes)}</div><div class="card-sub">${fmtBRL(recAno)} no ano</div></div>
    <div class="card kpi"><span class="kpi-icon">📆</span><div class="card-label">A receber no mês</div><div class="card-value">${fmtBRL(abertoMes)}</div><div class="card-sub">vencimentos até dia ${new Date(+mes.slice(0, 4), +mes.slice(5), 0).getDate()}</div></div>
    <div class="card kpi"><span class="kpi-icon">⚠️</span><div class="card-label">Em atraso</div><div class="card-value ${atr.length ? 'neg' : ''}">${fmtBRL(soma(atr, p => p.valor))}</div><div class="card-sub">${plural(atr.length, 'parcela')} · ${plural(new Set(atr.map(p => p.alunoId)).size, 'mentorado')}</div></div>
    <div class="card kpi"><span class="kpi-icon">🔮</span><div class="card-label">Total a receber</div><div class="card-value">${fmtBRL(futuro)}</div><div class="card-sub">todas as parcelas futuras</div></div>
  </div>`;
  h += `<div class="filtros">${seg(ops, f.status, v => `setFiltro('fin','status','${v}')`)}
    <select onchange="setFiltro('fin','aluno',this.value)">${optionsAlunos(f.aluno, 'Todos os mentorados')}</select>
    <input type="month" value="${esc(f.mes)}" onchange="setFiltro('fin','mes',this.value)" title="Filtrar por mês">
    ${f.mes ? `<button class="btn btn-ghost btn-sm" onclick="setFiltro('fin','mes','')">Limpar mês</button>` : ''}</div>`;
  const l = filtrarPags();
  if (!l.length) {
    h += `<div class="card mb-16"><div class="empty-state"><div class="icon">💰</div><p>${DB.pagamentos.length ? 'Nenhuma cobrança com esses filtros.' : 'Nenhuma cobrança cadastrada ainda.'}</p><button class="btn btn-primary" onclick="novaCobranca()">+ Nova cobrança</button></div></div>`;
  } else {
    h += `<div class="card mb-16" style="padding:6px"><div class="table-wrap"><table><thead><tr><th>Vencimento</th><th>Mentorado</th><th>Descrição</th><th>Valor</th><th>Forma</th><th>Situação</th><th></th></tr></thead>
      <tbody>${l.map(p => linhaPag(p)).join('')}</tbody></table></div>
      <div class="flex justify-between" style="padding:10px 14px;font-size:12.5px"><span class="muted">${plural(l.length, 'cobrança')}</span><span>Total: <b class="td-mono">${fmtBRL(soma(l, p => p.valor))}</b> · Pago: <b class="td-mono pos">${fmtBRL(soma(l.filter(p => p.pagoEm), p => p.valor))}</b></span></div></div>`;
  }
  h += cardResumoPorAluno();
  h += `<div class="mt-16">${cardGraficoReceita('graf-fin')}</div>`;
  $('page-financeiro').innerHTML = h;
  desenharGraficoReceita('graf-fin');
}
function filtrarPags() {
  const f = filtros.fin;
  let l = DB.pagamentos.slice();
  if (f.status === 'abertos') l = l.filter(p => !p.pagoEm);
  else if (f.status === 'atrasado') l = l.filter(p => statusPag(p) === 'atrasado');
  else if (f.status === 'pago') l = l.filter(p => p.pagoEm);
  if (f.aluno) l = l.filter(p => p.alunoId === f.aluno);
  if (f.mes) l = l.filter(p => ((f.status === 'pago' && p.pagoEm) ? p.pagoEm : p.vencimento).slice(0, 7) === f.mes);
  if (f.status === 'pago') l.sort((a, b) => b.pagoEm.localeCompare(a.pagoEm));
  else l.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  return l;
}
function linhaPag(p, semAluno) {
  const al = getAluno(p.alunoId), st = statusPag(p);
  return `<tr class="clicavel ${st === 'atrasado' ? 'linha-atrasada' : ''}" onclick="editarPagamento('${p.id}')">
    <td class="td-mono">${fmtData(p.vencimento)}</td>
    ${semAluno ? '' : `<td>${pessoaHTML(al)}</td>`}
    <td>${esc(p.descricao || '—')}${p.obs ? `<div class="muted" style="font-size:11px">${esc(p.obs)}</div>` : ''}</td>
    <td class="td-mono font-bold">${fmtBRL(p.valor)}</td>
    <td class="text-sm">${esc(p.forma || '—')}</td>
    <td>${badgePag(p)}</td>
    <td class="td-acoes" onclick="event.stopPropagation()">${p.pagoEm
      ? `<button class="btn btn-ghost btn-xs" onclick="desfazerPago('${p.id}')" title="Voltar para em aberto">↩ Desfazer</button>`
      : `<button class="btn btn-success btn-xs" onclick="marcarPago('${p.id}')">✓ Recebi</button>${al && al.whatsapp ? ` <button class="btn btn-whats btn-xs" onclick="cobrarWhats('${p.id}')" title="Cobrar no WhatsApp">💬 Cobrar</button>` : ''}`}</td></tr>`;
}
function cardResumoPorAluno() {
  const lista = DB.alunos.filter(a => pagsDoAluno(a.id).length || num(a.valor) > 0).sort((a, b) => finAluno(b.id).atrasado - finAluno(a.id).atrasado || a.nome.localeCompare(b.nome));
  if (!lista.length) return '';
  return `<div class="card" style="padding:6px"><div class="card-head" style="padding:12px 14px 0"><h3>👥 Situação por mentorado</h3></div><div class="table-wrap"><table>
    <thead><tr><th>Mentorado</th><th>Cobrança</th><th>Cobrado</th><th>Pago</th><th>Em aberto</th><th>Em atraso</th><th>Situação</th></tr></thead><tbody>
    ${lista.map(al => {
      const f = finAluno(al.id), falta = pacote(al) ? num(al.valor) - f.cobrado : 0;
      return `<tr class="clicavel" onclick="abrirDetalhe('${al.id}','pagamentos')"><td>${pessoaHTML(al)}</td>
        <td class="td-mono">${esc(textoModo(al))}${falta > 0.005 ? `<div style="font-size:11px" class="neg" title="Parte do valor contratado ainda não tem parcela lançada">${fmtBRL(falta)} sem parcela</div>` : ''}</td>
        <td class="td-mono">${fmtBRL(f.cobrado)}</td><td class="td-mono pos">${fmtBRL(f.pago)}</td><td class="td-mono">${fmtBRL(f.aberto)}</td>
        <td class="td-mono ${f.atrasado ? 'neg' : 'muted'}">${fmtBRL(f.atrasado)}</td><td>${badgeFin(al.id)}</td></tr>`;
    }).join('')}</tbody></table></div></div>`;
}
function marcarPago(id) {
  const p = DB.pagamentos.find(x => x.id === id);
  if (!p) return;
  p.pagoEm = hojeISO();
  commit(`Pagamento de ${fmtBRL(p.valor)} registrado ✓`);
}
function desfazerPago(id) {
  const p = DB.pagamentos.find(x => x.id === id);
  if (!p) return;
  p.pagoEm = '';
  commit('Pagamento voltou para em aberto');
}

// ============================================================
// PÁGINA: CONFIGURAÇÕES
// ============================================================
async function renderConfig() {
  const c = DB.config;
  $('page-config').innerHTML = `<div class="cards-grid grid-2">
    ${cardSync()}
    <div class="card"><div class="card-head"><h3>⚙️ Preferências</h3></div>
      <div class="form-group"><label>Seu nome (usado nas mensagens)</label><input id="cf-mentor" value="${esc(c.mentor)}"></div>
      <div class="form-row col3">
        <div class="form-group"><label>Horário padrão</label><input id="cf-hora" type="time" value="${esc(c.horaPadrao)}"></div>
        <div class="form-group"><label>Duração padrão (min)</label><input id="cf-duracao" type="number" min="5" step="5" value="${esc(c.duracaoPadrao)}"></div>
        <div class="form-group"><label>Frequência padrão</label><select id="cf-freq">${options(FREQ, c.frequenciaPadrao)}</select></div>
      </div>
      <div class="form-group"><label class="check-line"><input type="checkbox" id="cf-notif" ${c.notificar ? 'checked' : ''}> Notificações do Windows (aulas do dia, aula começando em 15 min, atrasos)</label></div>
      <button class="btn btn-primary" onclick="salvarConfig()">Salvar preferências</button>
    </div>
    <div class="card"><div class="card-head"><h3>💬 Mensagens de WhatsApp</h3></div>
      <div class="form-group"><label>Lembrete de aula</label><textarea id="cf-msg-lembrete" style="min-height:110px">${esc(c.msgLembrete)}</textarea>
        <div class="hint">Variáveis: {nome} {quando} {data} {hora} {tema} {numero} {link} {mentor}</div></div>
      <div class="form-group"><label>Cobrança</label><textarea id="cf-msg-cobranca" style="min-height:100px">${esc(c.msgCobranca)}</textarea>
        <div class="hint">Variáveis: {nome} {descricao} {valor} {vencimento} {mentor}</div></div>
      <button class="btn btn-primary" onclick="salvarConfig()">Salvar mensagens</button>
    </div>
    <div class="card"><div class="card-head"><h3>💾 Dados e backup</h3></div>
      <div class="card-sub mb-16">Os dados ficam no arquivo <b>dados.json</b> dentro da pasta do app (que já sincroniza com o OneDrive). Além disso, o app guarda automaticamente uma cópia por dia na pasta <b>backups</b> (últimos 60 dias).</div>
      <div class="bloco-texto mb-16" id="cf-caminho" style="font-size:12px">${window.api ? 'carregando...' : 'Modo navegador — dados no armazenamento local do navegador'}</div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="exportarJSON()">⬇ Exportar backup</button>
        <button class="btn btn-ghost" onclick="$('input-import').click()">⬆ Importar backup</button>
        ${window.api ? `<button class="btn btn-ghost" onclick="window.api.abrirBackups()">📂 Abrir pasta de backups</button>` : ''}
      </div>
      <div class="hint mt-16">Última gravação: ${DB._savedAt ? new Date(DB._savedAt).toLocaleString('pt-BR') : '—'}</div>
    </div>
    <div class="card"><div class="card-head"><h3>📊 Números gerais</h3></div>
      <div class="info-grid" style="grid-template-columns:1fr 1fr">
        <div><div class="k">Mentorados</div><div class="v">${DB.alunos.length} (${DB.alunos.filter(a => a.status === 'ativo').length} ativos)</div></div>
        <div><div class="k">Programas</div><div class="v">${DB.programas.length}</div></div>
        <div><div class="k">Aulas cadastradas</div><div class="v">${DB.aulas.length}</div></div>
        <div><div class="k">Aulas realizadas</div><div class="v">${DB.aulas.filter(a => a.status === 'realizada').length}</div></div>
        <div><div class="k">Horas de mentoria dadas</div><div class="v">${(soma(DB.aulas.filter(aulaConsumida), a => a.duracao) / 60).toFixed(1).replace('.', ',')} h</div></div>
        <div><div class="k">Receita total recebida</div><div class="v pos">${fmtBRL(soma(DB.pagamentos.filter(p => p.pagoEm), p => p.valor))}</div></div>
      </div>
    </div>
  </div>`;
  avisarLoginAntigo();
  if (window.api) { const cam = await window.api.caminhoArquivo(); if ($('cf-caminho')) $('cf-caminho').textContent = cam; }
}
function cardSync() {
  let h = `<div class="card" style="grid-column:1/-1"><div class="card-head"><h3>📱 iPhone e sincronização</h3><span id="cf-sync-status">${syncStatusHTML()}</span></div>`;
  if (SYNC.token) {
    h += `<div class="card-sub mb-16">Tudo o que você lança aqui aparece no ${window.api ? 'iPhone' : 'computador'} em poucos segundos (e vice-versa).<br>
      App do iPhone: <a class="link" onclick="abrirURL(URL_APP)">${URL_APP}</a> — abra no Safari → Compartilhar → <b>Adicionar à Tela de Início</b>.<br>
      🔒 Por segurança, depois de <b>4 horas sem uso</b> o app pede a senha de novo (no computador e no iPhone).</div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <button class="btn btn-primary" onclick="sincronizar(true)">🔄 Sincronizar agora</button>
        ${window.api ? `<button class="btn btn-ghost" onclick="$('cf-troca').style.display=''">🔑 Trocar usuário e senha</button>` : ''}
        <button class="btn btn-danger" onclick="desconectarSync()">${window.api ? 'Desligar sincronização neste computador' : 'Sair deste aparelho'}</button>
      </div>
      <div id="cf-troca" style="display:none" class="mt-16">
        <div class="alerta alerta-warn" id="cf-troca-aviso" style="display:none"><span>🔑</span><div class="grow">Defina o <b>usuário e a senha</b> de login do app — valem para o iPhone e para destravar o computador.</div></div>
        <div class="form-row col4" style="align-items:end">
        <div class="form-group"><label>Usuário</label><input id="cf-novo-usuario" autocomplete="username" autocapitalize="none"></div>
        <div class="form-group"><label>Nova senha</label><input id="cf-nova-senha" type="password" autocomplete="new-password"></div>
        <div class="form-group"><label>Repita a senha</label><input id="cf-nova-senha2" type="password" autocomplete="new-password"></div>
        <div class="form-group"><button class="btn btn-primary" onclick="trocarSenhaIphone()">Salvar login</button></div></div></div>`;
  } else {
    h += `<div class="cards-grid grid-2">
      <div><div class="card-label">Já configurei antes</div>
        <div class="card-sub mb-16">Se a sincronização já foi ativada em outro aparelho, é só entrar com o usuário e a senha do app.</div>
        <div class="form-row col2">
          <div class="form-group"><label>Usuário</label><input id="cf-login-usuario" autocomplete="username" autocapitalize="none"></div>
          <div class="form-group"><label>Senha</label><input id="cf-login-senha" type="password" onkeydown="if(event.key==='Enter')entrarSyncSenha()"></div></div>
        <button class="btn btn-primary" onclick="entrarSyncSenha()">Entrar e sincronizar</button></div>
      ${window.api ? `<div><div class="card-label">Primeira configuração</div>
        <div class="card-sub mb-16">Cole o token do GitHub (acesso só aos repositórios <b>${GH_REPO_DADOS}</b> e <b>${GH_REPO_APP}</b>) e crie a senha que você vai usar para entrar no iPhone. O token fica guardado só neste computador; o iPhone recebe uma cópia protegida pela senha.</div>
        <div class="form-group"><label>Token do GitHub</label><input id="cf-token" type="password" placeholder="github_pat_..." autocomplete="off"></div>
        <div class="form-row col3">
          <div class="form-group"><label>Usuário</label><input id="cf-usuario" autocomplete="username" autocapitalize="none"></div>
          <div class="form-group"><label>Senha (mín. 8)</label><input id="cf-senha" type="password" autocomplete="new-password"></div>
          <div class="form-group"><label>Repita a senha</label><input id="cf-senha2" type="password" autocomplete="new-password"></div></div>
        <button class="btn btn-success" onclick="ativarSync()">Ativar sincronização</button></div>` : ''}
    </div>`;
  }
  return h + `</div>`;
}
function validarSenhaNova(u, s1, s2) {
  if (!String(u || '').trim()) { toast('Informe o usuário', 'error'); return false; }
  if (s1.length < 8) { toast('A senha precisa ter pelo menos 8 caracteres', 'error'); return false; }
  if (s1 !== s2) { toast('As senhas não conferem', 'error'); return false; }
  return true;
}
async function ativarSync() {
  const token = $('cf-token').value.trim(), u = $('cf-usuario').value, s1 = $('cf-senha').value, s2 = $('cf-senha2').value;
  if (!token) { toast('Cole o token do GitHub', 'error'); return; }
  if (!validarSenhaNova(u, s1, s2)) return;
  toast('Configurando...', 'info');
  try {
    await configurarSync(token, u, s1);
    toast('Sincronização ativada ✓ — já pode entrar no iPhone');
    renderTudo();
    await sincronizar(true);
  } catch (e) { toast('Não deu certo: ' + e.message, 'error'); }
}
async function entrarSyncSenha() {
  const u = $('cf-login-usuario').value, s = $('cf-login-senha').value;
  if (!s) return;
  try {
    await entrarComSenha(u, s);
    renderTudo();
    await sincronizar(true);
  } catch (e) { toast(e.message, 'error'); }
}
async function trocarSenhaIphone() {
  const u = $('cf-novo-usuario').value, s1 = $('cf-nova-senha').value, s2 = $('cf-nova-senha2').value;
  if (!validarSenhaNova(u, s1, s2)) return;
  try { await configurarSync(SYNC.token, u, s1); toast('Login salvo ✓ — use o novo usuário e senha no iPhone'); renderTudo(); }
  catch (e) { toast('Não deu certo: ' + e.message, 'error'); }
}
// Se o acesso publicado ainda é do tipo antigo (só senha), já abre o formulário de login
async function avisarLoginAntigo() {
  if (!window.api || !SYNC.token) return;
  try {
    const a = await buscarAcesso();
    if (a && !(a.v >= 2) && $('cf-troca')) { $('cf-troca').style.display = ''; $('cf-troca-aviso').style.display = ''; }
  } catch (e) {}
}
// Botão "Sair": sincroniza o que falta e então fecha (computador) ou tranca com a senha (iPhone)
async function sair() {
  const msg = window.api ? 'Fechar o Mentorias E-commerce?' : 'Sair do app neste aparelho?\n\nPara entrar de novo vai pedir a senha.';
  if (!confirm(msg)) return;
  toggleMais(false);
  toast('Salvando e sincronizando...', 'info');
  clearTimeout(_syncTimer);
  try {
    await _filaSalvar;
    if (SYNC.token) {
      for (let i = 0; i < 20 && _sincronizando; i++) await new Promise(r => setTimeout(r, 250));
      await sincronizar();
      if (SYNC.estado === 'erro' && !confirm('Não foi possível sincronizar agora (' + SYNC.erro + ').\n\nSair mesmo assim? O que foi lançado ' + (window.api ? 'fica salvo neste computador e sincroniza quando abrir de novo.' : 'neste iPhone desde a última sincronização será perdido.'))) return;
    }
  } catch (e) {}
  if (window.api) { window.close(); return; }
  await guardarToken('');
  localStorage.removeItem('mentorias-db');
  location.reload();
}
async function desconectarSync() {
  if (!confirm(window.api ? 'Desligar a sincronização neste computador?\n\nOs dados continuam aqui e no iPhone; só param de se atualizar entre si.' : 'Sair deste aparelho?\n\nVocê vai precisar da senha para entrar de novo.')) return;
  await guardarToken('');
  SYNC.estado = 'off';
  if (!window.api) localStorage.removeItem('mentorias-db');
  if (EM_PAGES) { location.reload(); return; }
  renderTudo();
  renderSyncStatus();
}

function salvarConfig() {
  const c = DB.config;
  c.mentor = $('cf-mentor').value.trim();
  c.horaPadrao = $('cf-hora').value || '19:00';
  c.duracaoPadrao = num($('cf-duracao').value) || 60;
  c.frequenciaPadrao = $('cf-freq').value;
  c.notificar = $('cf-notif').checked;
  c.msgLembrete = $('cf-msg-lembrete').value;
  c.msgCobranca = $('cf-msg-cobranca').value;
  if (c.notificar && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  commit('Configurações salvas');
}

// ============================================================
// MODAIS — base
// ============================================================
let _zTop = 1000;
function abrirModal(id) {
  const el = $(id);
  el.style.zIndex = ++_zTop;
  garantirVoltar(id);
  el.classList.add('open');
  const corpo = el.querySelector('.modal-body');
  if (corpo) corpo.scrollTop = 0;
}
// No celular toda janela ganha um botão grande "‹ Voltar" no topo
function garantirVoltar(id) {
  const header = $(id).querySelector('.modal-header');
  if (!header || header.querySelector('.btn-voltar')) return;
  const b = document.createElement('button');
  b.className = 'btn-voltar';
  b.type = 'button';
  b.textContent = '‹ Voltar';
  b.onclick = () => fecharOverlay(id);
  header.prepend(b);
}
function fecharModal(id) {
  $(id).classList.remove('open');
  // chegou alteração do outro aparelho enquanto o formulário estava aberto
  if (_renderPendente && !algumModalAberto()) { _renderPendente = false; renderTudo(); }
}
function sumiu(obj, modal) {
  if (obj) return false;
  fecharModal(modal);
  toast('Esse item foi excluído em outro aparelho', 'error');
  renderTudo();
  return true;
}
const FECHAR_ESPECIAL = { 'modal-gerar-aulas': () => pularGerarAulas(), 'modal-gerar-parc': () => pularGerarParcelas() };
function fecharOverlay(id) { if (FECHAR_ESPECIAL[id]) FECHAR_ESPECIAL[id](); else fecharModal(id); }

// ============================================================
// MENTORADO — cadastro
// ============================================================
let editAlunoId = null;
function preencherSelectsAluno(sel) {
  $('al-plataforma').innerHTML = '<option value="">—</option>' + optionsLista(PLATAFORMAS, sel.plataforma);
  $('al-status').innerHTML = options(STATUS_ALUNO, sel.status);
  $('al-programa').innerHTML = '<option value="">— Sem programa —</option>' + DB.programas.map(p => `<option value="${p.id}" ${p.id === sel.programaId ? 'selected' : ''}>${esc(p.nome)}</option>`).join('');
  $('al-modo').innerHTML = options(MODOS, sel.modoCobranca || 'mensal');
  $('al-valorunit').value = sel.valorUnit ?? '';
  atualizarModoAluno();
}
function atualizarModoAluno() {
  const m = $('al-modo').value;
  const unit = m === 'semanal' || m === 'aula';
  $('al-valorunit-wrap').style.display = unit ? '' : 'none';
  $('al-valor-wrap').style.display = unit ? 'none' : '';
  $('al-valorunit-label').textContent = m === 'semanal' ? 'Valor por semana (R$)' : 'Valor por aula (R$)';
}
function onPlataformaAlunoChange() {
  const atual = $('al-programa').value;
  // troca o programa só se estiver vazio ou for um dos programas de plataforma
  if (atual && !atual.startsWith('prog-10-')) return;
  const alvo = getPrograma(idProgPlataforma(chavePlataforma($('al-plataforma').value)));
  if (!alvo) return;
  $('al-programa').value = alvo.id;
  onProgramaAlunoChange();
}
function novoAluno() {
  editAlunoId = null;
  const prog = getPrograma(idProgPlataforma('geral')) || DB.programas[0];
  const cor = CORES[DB.alunos.length % CORES.length];
  preencherSelectsAluno({ status: 'ativo', programaId: prog ? prog.id : '' });
  ['al-nome', 'al-whats', 'al-email', 'al-insta', 'al-cidade', 'al-loja', 'al-nicho', 'al-site', 'al-fat', 'al-objetivo', 'al-obs'].forEach(i => $(i).value = '');
  $('al-inicio').value = hojeISO();
  $('al-valor').value = prog && prog.valor ? prog.valor : '';
  $('al-fim').value = fimPrevisto(prog, hojeISO());
  $('al-cor').value = cor;
  $('al-wizard').checked = true;
  $('al-wizard-wrap').style.display = '';
  $('aluno-titulo').textContent = 'Novo mentorado';
  abrirModal('modal-aluno');
  setTimeout(() => $('al-nome').focus(), 50);
}
function editarAluno(id) {
  const a = getAluno(id);
  if (!a) return;
  editAlunoId = id;
  preencherSelectsAluno(a);
  const map = { 'al-nome': 'nome', 'al-whats': 'whatsapp', 'al-email': 'email', 'al-insta': 'instagram', 'al-cidade': 'cidade', 'al-loja': 'loja', 'al-nicho': 'nicho', 'al-site': 'site', 'al-fat': 'faturamentoInicial', 'al-objetivo': 'objetivo', 'al-obs': 'obs', 'al-inicio': 'inicio', 'al-fim': 'fim', 'al-valor': 'valor' };
  Object.entries(map).forEach(([i, k]) => $(i).value = a[k] ?? '');
  $('al-cor').value = corValida(a.cor);
  $('al-wizard-wrap').style.display = 'none';
  $('aluno-titulo').textContent = 'Editar mentorado';
  abrirModal('modal-aluno');
}
function onProgramaAlunoChange() {
  const prog = getPrograma($('al-programa').value);
  if (!prog) return;
  if (!editAlunoId || !$('al-valor').value) $('al-valor').value = prog.valor || '';
  if ($('al-inicio').value) $('al-fim').value = fimPrevisto(prog, $('al-inicio').value);
}
function onInicioAlunoChange() {
  const prog = getPrograma($('al-programa').value);
  if (prog && $('al-inicio').value) $('al-fim').value = fimPrevisto(prog, $('al-inicio').value);
}
function salvarAluno() {
  const nome = $('al-nome').value.trim();
  if (!nome) { toast('Informe o nome do mentorado', 'error'); $('al-nome').focus(); return; }
  if (!$('al-inicio').value) { toast('Informe a data de início', 'error'); return; }
  const dados = {
    nome, whatsapp: $('al-whats').value.trim(), email: $('al-email').value.trim(), instagram: $('al-insta').value.trim(),
    cidade: $('al-cidade').value.trim(), loja: $('al-loja').value.trim(), plataforma: $('al-plataforma').value, nicho: $('al-nicho').value.trim(),
    site: $('al-site').value.trim(), faturamentoInicial: $('al-fat').value === '' ? '' : num($('al-fat').value),
    objetivo: $('al-objetivo').value.trim(), programaId: $('al-programa').value, inicio: $('al-inicio').value, fim: $('al-fim').value,
    status: $('al-status').value, valor: $('al-valor').value === '' ? '' : num($('al-valor').value), cor: corValida($('al-cor').value), obs: $('al-obs').value.trim(),
    modoCobranca: $('al-modo').value, valorUnit: $('al-valorunit').value === '' ? '' : num($('al-valorunit').value)
  };
  if (dados.modoCobranca === 'semanal' || dados.modoCobranca === 'aula') dados.valor = '';
  if (editAlunoId) {
    const alvo = getAluno(editAlunoId);
    if (sumiu(alvo, 'modal-aluno')) return;
    const virouPorAula = dados.modoCobranca === 'aula' && alvo.modoCobranca !== 'aula';
    Object.assign(alvo, dados);
    // passou a cobrar por aula: as próximas aulas agendadas já ganham cobrança
    if (virouPorAula && num(dados.valorUnit)) aulasDoAluno(alvo.id).filter(a => a.status === 'agendada' && fimAula(a) >= new Date()).forEach(a => ajustarCobrancasAula(a));
    fecharModal('modal-aluno');
    commit('Mentorado atualizado');
    return;
  }
  const novo = { id: uid(), criadoEm: new Date().toISOString(), evolucao: [], notas: [], ...dados };
  DB.alunos.push(novo);
  fecharModal('modal-aluno');
  commit(`${primeiroNome(nome)} cadastrado(a) ✓`);
  if ($('al-wizard').checked) { wizard = { alunoId: novo.id }; abrirGerarAulas(novo.id); }
  else abrirDetalhe(novo.id);
}
function excluirAluno(id) {
  const a = getAluno(id);
  if (!a) return;
  const nAulas = aulasDoAluno(id).length, nPags = pagsDoAluno(id).length;
  if (!confirm(`Excluir ${a.nome}?\n\nIsso também remove ${plural(nAulas, 'aula')} e ${plural(nPags, 'cobrança')} desse mentorado.\n\nDica: se a mentoria só terminou, prefira mudar o status para "Concluído".`)) return;
  DB.pagamentos = DB.pagamentos.filter(p => p.alunoId !== id);
  DB.aulas = DB.aulas.filter(x => !(x.alunoIds.length === 1 && x.alunoIds[0] === id));
  DB.aulas.forEach(x => { x.alunoIds = x.alunoIds.filter(i => i !== id); delete x.presencas[id]; });
  DB.alunos = DB.alunos.filter(x => x.id !== id);
  fecharModal('modal-detalhe');
  commit('Mentorado excluído');
}

// ============================================================
// ASSISTENTE: cronograma e parcelas
// ============================================================
let wizard = null;
let gerarAlunoId = null;
function abrirGerarAulas(id) {
  const al = getAluno(id);
  if (!al) return;
  gerarAlunoId = id;
  const pr = getPrograma(al.programaId);
  const c = DB.config;
  const prox = proximoNumeroAula(id);
  $('ga-aluno-nome').value = al.nome;
  const existentes = aulasDoAluno(id).filter(aulaConta).sort(porDataHora);
  const ultima = existentes[existentes.length - 1];
  const freq = (pr && pr.frequencia) || c.frequenciaPadrao;
  $('ga-inicio').value = ultima ? datasCronograma(ultima.data, freq, 2)[1] : (al.inicio || hojeISO());
  $('ga-hora').value = (ultima && ultima.hora) || (pr && pr.hora) || c.horaPadrao;
  $('ga-duracao').value = (pr && pr.duracao) || c.duracaoPadrao;
  $('ga-freq').innerHTML = options(FREQ, freq);
  $('ga-numero').value = prox;
  $('ga-link').value = (ultima && ultima.link) || '';
  $('ga-temas').value = pr ? pr.temas.slice(prox - 1).join('\n') : '';
  $('ga-passo').textContent = wizard ? 'Passo 2 de 3' : '';
  $('ga-pular').textContent = wizard ? 'Pular esta etapa' : 'Cancelar';
  previewGerarAulas();
  abrirModal('modal-gerar-aulas');
}
function previewGerarAulas() {
  const temas = linhas($('ga-temas').value);
  const ini = $('ga-inicio').value;
  if (!temas.length || !ini) { $('ga-preview').innerHTML = '<span class="muted">Escreva pelo menos um tema (uma linha = uma aula) e a data da 1ª aula.</span>'; return; }
  const ds = datasCronograma(ini, $('ga-freq').value, temas.length);
  const n0 = num($('ga-numero').value) || 1;
  $('ga-preview').innerHTML = `<div style="margin-bottom:6px;color:var(--text)"><b>${plural(temas.length, 'aula')}</b> de ${fmtData(ds[0])} a ${fmtData(ds[ds.length - 1])}</div>` +
    temas.map((t, i) => `<div>Aula ${n0 + i} · ${fmtDataSemana(ds[i])} ${esc($('ga-hora').value)} — ${esc(t)}</div>`).join('');
}
function confirmarGerarAulas() {
  const temas = linhas($('ga-temas').value);
  const ini = $('ga-inicio').value, hora = $('ga-hora').value;
  if (!temas.length) { toast('Informe os temas das aulas', 'error'); return; }
  if (!ini || !hora) { toast('Informe a data e o horário da 1ª aula', 'error'); return; }
  const ds = datasCronograma(ini, $('ga-freq').value, temas.length);
  const n0 = num($('ga-numero').value) || 1;
  const dur = num($('ga-duracao').value) || 60;
  const link = $('ga-link').value.trim();
  temas.forEach((t, i) => {
    const a = {
      id: uid(), alunoIds: [gerarAlunoId], data: ds[i], hora, duracao: dur, numero: n0 + i, tema: t,
      status: 'agendada', link, gravacao: '', pauta: '', tarefas: '', notas: '', presencas: {}
    };
    DB.aulas.push(a);
    ajustarCobrancasAula(a);
  });
  fecharModal('modal-gerar-aulas');
  commit(`${plural(temas.length, 'aula criada', 'aulas criadas')} ✓`);
  if (wizard) abrirGerarParcelas(wizard.alunoId);
}
function pularGerarAulas() {
  fecharModal('modal-gerar-aulas');
  if (wizard) abrirGerarParcelas(wizard.alunoId);
}

function abrirGerarParcelas(id) {
  const al = getAluno(id);
  if (!al) return;
  gerarAlunoId = id;
  const pr = getPrograma(al.programaId);
  const f = finAluno(id);
  $('gp-aluno-nome').value = al.nome;
  $('gp-modo').innerHTML = options(MODOS, al.modoCobranca || 'mensal');
  $('gp-n').value = (pr && pr.parcelas) || 1;
  $('gp-venc').value = f.qtd ? addMeses(pagsDoAluno(id).map(p => p.vencimento).sort().pop(), 1) : (al.inicio || hojeISO());
  $('gp-forma').innerHTML = optionsLista(FORMAS, 'Pix');
  $('gp-desc').value = 'Mentoria';
  $('gp-entrada').checked = false;
  $('gp-passo').textContent = wizard ? 'Passo 3 de 3' : '';
  $('gp-pular').textContent = wizard ? 'Pular esta etapa' : 'Cancelar';
  trocarModoParcelas();
  abrirModal('modal-gerar-parc');
}
// Ajusta os campos da janela conforme a forma de cobrança escolhida
function trocarModoParcelas() {
  const modo = $('gp-modo').value, al = getAluno(gerarAlunoId);
  if (!al) return;
  const pr = getPrograma(al.programaId);
  const restante = Math.max(0, num(al.valor || (pr && pr.valor)) - finAluno(al.id).cobrado);
  const cfg = {
    mensal:  { total: 'Valor total (R$) *', n: 'Nº de parcelas *', venc: '1º vencimento *', entrada: 'A 1ª parcela já foi paga (entrada)', valor: restante },
    avista:  { total: 'Valor total (R$) *', n: null, venc: 'Vencimento *', entrada: 'Já foi pago', valor: restante },
    semanal: { total: 'Valor por semana (R$) *', n: 'Nº de semanas *', venc: '1º vencimento *', entrada: 'A 1ª semana já foi paga', valor: num(al.valorUnit) },
    aula:    { total: 'Valor por aula (R$) *', n: null, venc: null, entrada: null, valor: num(al.valorUnit) }
  }[modo];
  $('gp-total-label').textContent = cfg.total;
  $('gp-total').value = cfg.valor ? Math.round(cfg.valor * 100) / 100 : '';
  $('gp-n-wrap').style.display = cfg.n ? '' : 'none';
  if (cfg.n) $('gp-n-label').textContent = cfg.n;
  if (modo === 'semanal') $('gp-n').value = Math.max(1, aulasDoAluno(al.id).filter(a => aulaConta(a) && a.status === 'agendada').length) || 4;
  $('gp-venc-wrap').style.display = cfg.venc ? '' : 'none';
  if (cfg.venc) $('gp-venc-label').textContent = cfg.venc;
  $('gp-desc-wrap').style.display = modo === 'aula' ? 'none' : '';
  $('gp-entrada-wrap').style.display = cfg.entrada ? '' : 'none';
  if (cfg.entrada) $('gp-entrada-label').textContent = cfg.entrada;
  $('gp-hint').style.display = modo === 'aula' ? '' : 'none';
  $('gp-hint').innerHTML = `<span>💡</span><div class="grow">Cria uma cobrança para cada aula desse aluno que ainda não tem cobrança, vencendo no dia da aula. <b>Daqui pra frente, toda aula nova dele gera a cobrança sozinha</b> — e se a aula for cancelada ou remarcada, a cobrança em aberto sai junto.</div>`;
  previewGerarParcelas();
}
function calcParcelas(total, n, venc, desc) {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / n);
  const resto = centavos - base * n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ valor: (base + (i < resto ? 1 : 0)) / 100, vencimento: addMeses(venc, i), descricao: n > 1 ? `${desc} — parcela ${i + 1}/${n}` : desc });
  }
  return out;
}
// Monta a lista de cobranças conforme a forma escolhida (null = faltam dados)
function calcCobrancas() {
  const modo = $('gp-modo').value, valor = num($('gp-total').value);
  const n = Math.floor(num($('gp-n').value)), venc = $('gp-venc').value, desc = $('gp-desc').value.trim() || 'Mentoria';
  if (!valor) return null;
  if (modo === 'aula') return aulasSemCobranca(gerarAlunoId).map(a => cobrancaDaAula(a, gerarAlunoId, valor));
  if (!venc) return null;
  if (modo === 'avista') return [{ valor, vencimento: venc, descricao: desc + ' — à vista' }];
  if (n < 1) return null;
  if (modo === 'semanal') return Array.from({ length: n }, (_, i) => ({ valor, vencimento: addDias(venc, 7 * i), descricao: `${desc} — semana ${i + 1}/${n}` }));
  return calcParcelas(valor, n, venc, desc);
}
function previewGerarParcelas() {
  const l = calcCobrancas();
  if (!l) { $('gp-preview').innerHTML = '<span class="muted">Preencha os campos com * para ver as cobranças.</span>'; return; }
  if (!l.length) { $('gp-preview').innerHTML = '<span class="muted">Todas as aulas desse aluno já têm cobrança. As próximas aulas que você criar vão gerar a cobrança sozinhas.</span>'; return; }
  $('gp-preview').innerHTML = `<div style="margin-bottom:6px;color:var(--text)"><b>${plural(l.length, 'cobrança')}</b> · total ${fmtBRL(soma(l, p => p.valor))}</div>` +
    l.map(p => `<div>${fmtData(p.vencimento)} — <b>${fmtBRL(p.valor)}</b> · ${esc(p.descricao)}</div>`).join('');
}
function confirmarGerarParcelas() {
  const modo = $('gp-modo').value;
  const l = calcCobrancas();
  if (!l) { toast('Preencha os campos obrigatórios (*)', 'error'); return; }
  if (l.length > 60) { toast('Máximo de 60 cobranças de uma vez', 'error'); return; }
  const al = getAluno(gerarAlunoId);
  if (sumiu(al, 'modal-gerar-parc')) return;
  // guarda a forma de cobrança no cadastro do aluno
  const cobradoAntes = finAluno(al.id).cobrado;
  al.modoCobranca = modo;
  if (modo === 'semanal' || modo === 'aula') al.valorUnit = num($('gp-total').value);
  // o valor do pacote passa a ser o que foi de fato cobrado (evita "sem parcela" falso)
  if (modo === 'avista' || modo === 'mensal') al.valor = Math.round((cobradoAntes + soma(l, p => p.valor)) * 100) / 100;
  const forma = $('gp-forma').value, entrada = modo !== 'aula' && $('gp-entrada').checked;
  l.forEach((p, i) => DB.pagamentos.push({ id: uid(), alunoId: gerarAlunoId, ...p, forma, obs: '', pagoEm: (i === 0 && entrada) ? hojeISO() : '' }));
  fecharModal('modal-gerar-parc');
  commit(l.length ? `${plural(l.length, 'cobrança gerada', 'cobranças geradas')} ✓` : 'Forma de cobrança salva ✓');
  finalizarWizard();
}

// ── Cobrança por aula ──────────────────────────────────────────
function cobrancaDaAula(a, alunoId, valor) {
  return { valor, vencimento: a.data, descricao: `Aula ${a.numero ? a.numero + ' ' : ''}— ${a.tema}`, aulaId: a.id };
}
function aulasSemCobranca(alunoId) {
  return aulasDoAluno(alunoId).filter(a => aulaConta(a) && !DB.pagamentos.some(p => p.aulaId === a.id && p.alunoId === alunoId)).sort(porDataHora);
}
// Mantém as cobranças "por aula" coerentes com a aula: cria a que falta, acompanha a data
// e remove a que está em aberto se a aula for cancelada/remarcada/excluída ou o aluno sair dela
function ajustarCobrancasAula(a, excluida) {
  DB.pagamentos = DB.pagamentos.filter(p => !(p.aulaId === a.id && !p.pagoEm && (excluida || !aulaConta(a) || !a.alunoIds.includes(p.alunoId))));
  if (excluida) return;
  DB.pagamentos.forEach(p => { if (p.aulaId === a.id && !p.pagoEm) p.vencimento = a.data; });
  if (!aulaConta(a)) return;
  a.alunoIds.forEach(id => {
    const al = getAluno(id);
    if (!al || al.modoCobranca !== 'aula' || !num(al.valorUnit)) return;
    if (DB.pagamentos.some(p => p.aulaId === a.id && p.alunoId === id)) return;
    const ultima = pagsDoAluno(id).slice(-1)[0];
    DB.pagamentos.push({ id: uid(), alunoId: id, ...cobrancaDaAula(a, id, num(al.valorUnit)), forma: (ultima && ultima.forma) || 'Pix', obs: '', pagoEm: '' });
  });
}
function pularGerarParcelas() {
  fecharModal('modal-gerar-parc');
  finalizarWizard();
}
function finalizarWizard() {
  if (!wizard) return;
  const id = wizard.alunoId;
  wizard = null;
  abrirDetalhe(id);
}

// ============================================================
// AULA — cadastro
// ============================================================
let editAulaId = null;
let aulaSel = new Set();
let presencaTmp = {};
let _temaSugerido = '';

function novaAula(pre = {}) {
  editAulaId = null;
  aulaSel = new Set(pre.alunoIds || []);
  presencaTmp = {};
  _temaSugerido = '';
  $('au-busca-aluno').value = '';
  $('au-data').value = pre.data || hojeISO();
  $('au-hora').value = DB.config.horaPadrao;
  $('au-duracao').value = DB.config.duracaoPadrao;
  $('au-numero').value = '';
  $('au-tema').value = '';
  $('au-status').innerHTML = options(STATUS_AULA, 'agendada');
  ['au-link', 'au-gravacao', 'au-pauta', 'au-tarefas', 'au-notas'].forEach(i => $(i).value = '');
  $('aula-titulo').textContent = 'Nova aula';
  ['au-excluir', 'au-whats', 'au-gcal'].forEach(i => $(i).style.display = 'none');
  if (aulaSel.size === 1) sugerirDadosAula([...aulaSel][0]);
  // vindo da Jornada: já chega com o nº e o tema daquela aula
  if (pre.numero) { $('au-numero').value = pre.numero; }
  if (pre.tema) { $('au-tema').value = pre.tema; _temaSugerido = pre.tema; }
  if (pre.titulo) $('aula-titulo').textContent = pre.titulo;
  preencherDatalistTemas();
  renderChecksAula();
  renderPresencaAula();
  abrirModal('modal-aula');
}
function editarAula(id) {
  const a = DB.aulas.find(x => x.id === id);
  if (!a) return;
  editAulaId = id;
  aulaSel = new Set(a.alunoIds);
  presencaTmp = { ...a.presencas };
  _temaSugerido = '';
  $('au-busca-aluno').value = '';
  $('au-data').value = a.data;
  $('au-hora').value = a.hora;
  $('au-duracao').value = a.duracao || 60;
  $('au-numero').value = a.numero || '';
  $('au-tema').value = a.tema || '';
  $('au-status').innerHTML = options(STATUS_AULA, a.status);
  $('au-link').value = a.link || '';
  $('au-gravacao').value = a.gravacao || '';
  $('au-pauta').value = a.pauta || '';
  $('au-tarefas').value = a.tarefas || '';
  $('au-notas').value = a.notas || '';
  $('aula-titulo').textContent = `Aula ${a.numero ? a.numero + ' ' : ''}— ${nomesAula(a)}`;
  ['au-excluir', 'au-whats', 'au-gcal'].forEach(i => $(i).style.display = '');
  preencherDatalistTemas();
  renderChecksAula();
  renderPresencaAula();
  abrirModal('modal-aula');
}
function preencherDatalistTemas() {
  const temas = new Set();
  DB.programas.forEach(p => p.temas.forEach(t => temas.add(t)));
  DB.aulas.forEach(a => a.tema && temas.add(a.tema));
  $('lista-temas').innerHTML = [...temas].map(t => `<option value="${esc(t)}">`).join('');
}
function renderChecksAula() {
  const q = norm($('au-busca-aluno').value);
  let l = DB.alunos.filter(a => aulaSel.has(a.id) || ['ativo', 'lead', 'pausado'].includes(a.status));
  if (q) l = l.filter(a => aulaSel.has(a.id) || norm(a.nome).includes(q));
  l.sort((a, b) => (aulaSel.has(b.id) - aulaSel.has(a.id)) || a.nome.localeCompare(b.nome));
  $('au-alunos').innerHTML = l.length ? l.map(a => {
    const pr = getPrograma(a.programaId);
    return `<label class="check-line"><input type="checkbox" ${aulaSel.has(a.id) ? 'checked' : ''} onchange="toggleAlunoAula('${a.id}',this.checked)">
      <span class="dot" style="background:${corValida(a.cor)}"></span>${esc(a.nome)} <span class="muted text-sm">${esc(pr ? '· ' + pr.nome : '')}</span></label>`;
  }).join('') : `<div class="empty-mini">Nenhum mentorado ativo. <a class="link" onclick="fecharModal('modal-aula');novoAluno()">Cadastrar mentorado</a></div>`;
}
function toggleAlunoAula(id, on) {
  if (on) aulaSel.add(id); else aulaSel.delete(id);
  if (!editAulaId && on && aulaSel.size === 1) sugerirDadosAula(id);
  renderChecksAula();
  renderPresencaAula();
}
// Ao escolher o mentorado numa aula nova, já sugere nº, tema do programa, horário e link
function sugerirDadosAula(alunoId) {
  const al = getAluno(alunoId);
  if (!al) return;
  // com programa: a próxima aula da jornada que ainda não foi dada nem agendada
  const livre = jornadaAluno(alunoId).slots.find(s => !s.realizada && !s.agendada);
  const n = livre ? livre.n : proximoNumeroAula(alunoId);
  $('au-numero').value = n;
  const pr = getPrograma(al.programaId);
  const tema = pr && pr.temas[n - 1];
  if (tema && (!$('au-tema').value || $('au-tema').value === _temaSugerido)) { $('au-tema').value = tema; _temaSugerido = tema; }
  const ultima = aulasDoAluno(alunoId).filter(aulaConta).sort(porDataHora).pop();
  if (ultima) { $('au-hora').value = ultima.hora; $('au-duracao').value = ultima.duracao || 60; if (!$('au-link').value) $('au-link').value = ultima.link || ''; }
  else if (pr) { if (pr.hora) $('au-hora').value = pr.hora; $('au-duracao').value = pr.duracao || 60; }
}
function renderPresencaAula() {
  const mostrar = $('au-status').value === 'realizada' && aulaSel.size > 1;
  $('au-presenca-wrap').style.display = mostrar ? '' : 'none';
  if (!mostrar) return;
  $('au-presenca').innerHTML = [...aulaSel].map(id => {
    if (presencaTmp[id] === undefined) presencaTmp[id] = true;
    return `<label class="check-line"><input type="checkbox" ${presencaTmp[id] ? 'checked' : ''} onchange="presencaTmp['${id}']=this.checked"> ${esc(nomeAluno(id))}</label>`;
  }).join('');
}
function lerFormAula() {
  return {
    alunoIds: [...aulaSel], data: $('au-data').value, hora: $('au-hora').value, duracao: num($('au-duracao').value) || 60,
    numero: $('au-numero').value === '' ? '' : num($('au-numero').value), tema: $('au-tema').value.trim(), status: $('au-status').value,
    link: $('au-link').value.trim(), gravacao: $('au-gravacao').value.trim(), pauta: $('au-pauta').value.trim(),
    tarefas: $('au-tarefas').value.trim(), notas: $('au-notas').value.trim()
  };
}
function salvarAula() {
  const d = lerFormAula();
  if (!d.alunoIds.length) { toast('Selecione pelo menos um mentorado', 'error'); return; }
  if (!d.data || !d.hora) { toast('Informe data e horário', 'error'); return; }
  if (!d.tema) { toast('Informe o tema da aula', 'error'); $('au-tema').focus(); return; }
  if (aulaConta(d)) {
    const ini = minutos(d.hora), fim = ini + d.duracao;
    const conflitos = DB.aulas.filter(x => x.id !== editAulaId && x.data === d.data && aulaConta(x) && minutos(x.hora) < fim && minutos(x.hora) + num(x.duracao || 60) > ini);
    if (conflitos.length && !confirm(`⚠ Conflito de horário em ${fmtData(d.data)}:\n\n${conflitos.map(x => `${x.hora}–${horaFim(x.hora, x.duracao)} · ${nomesAula(x)}`).join('\n')}\n\nSalvar mesmo assim?`)) return;
  }
  d.presencas = {};
  if (d.status === 'realizada') d.alunoIds.forEach(id => d.presencas[id] = d.alunoIds.length > 1 ? presencaTmp[id] !== false : true);
  if (editAulaId) {
    const alvo = DB.aulas.find(x => x.id === editAulaId);
    if (sumiu(alvo, 'modal-aula')) return;
    Object.assign(alvo, d);
    ajustarCobrancasAula(alvo);
  } else {
    const nova = { id: uid(), ...d };
    DB.aulas.push(nova);
    ajustarCobrancasAula(nova);
  }
  fecharModal('modal-aula');
  if (d.status === 'realizada') verificarFimJornada(d.alunoIds);
  commit(editAulaId ? 'Aula atualizada' : 'Aula agendada ✓');
}
function excluirAula() {
  if (!editAulaId || !confirm('Excluir esta aula?\n\nSe ela só mudou de data, prefira alterar a data ou marcar como "Remarcada".')) return;
  const alvo = DB.aulas.find(x => x.id === editAulaId);
  if (alvo) ajustarCobrancasAula(alvo, true);
  DB.aulas = DB.aulas.filter(x => x.id !== editAulaId);
  fecharModal('modal-aula');
  commit('Aula excluída');
}

// ============================================================
// COBRANÇA — cadastro
// ============================================================
let editPagId = null;
function novaCobranca(pre = {}) {
  if (!DB.alunos.length) { toast('Cadastre um mentorado primeiro', 'error'); return; }
  editPagId = null;
  $('pg-aluno').innerHTML = optionsAlunos(pre.alunoId || filtros.fin.aluno || '', 'Selecione...');
  $('pg-desc').value = '';
  $('pg-valor').value = '';
  $('pg-venc').value = hojeISO();
  $('pg-forma').innerHTML = optionsLista(FORMAS, 'Pix');
  $('pg-pago').checked = false;
  $('pg-pagoem').value = '';
  $('pg-pagoem').disabled = true;
  $('pg-obs').value = '';
  $('pg-excluir').style.display = 'none';
  $('pag-titulo').textContent = 'Nova cobrança';
  abrirModal('modal-pag');
}
function editarPagamento(id) {
  const p = DB.pagamentos.find(x => x.id === id);
  if (!p) return;
  editPagId = id;
  $('pg-aluno').innerHTML = optionsAlunos(p.alunoId, 'Selecione...');
  $('pg-desc').value = p.descricao || '';
  $('pg-valor').value = p.valor;
  $('pg-venc').value = p.vencimento;
  $('pg-forma').innerHTML = optionsLista(FORMAS, p.forma);
  $('pg-pago').checked = !!p.pagoEm;
  $('pg-pagoem').value = p.pagoEm || '';
  $('pg-pagoem').disabled = !p.pagoEm;
  $('pg-obs').value = p.obs || '';
  $('pg-excluir').style.display = '';
  $('pag-titulo').textContent = 'Editar cobrança';
  abrirModal('modal-pag');
}
function salvarPagamento() {
  const d = {
    alunoId: $('pg-aluno').value, descricao: $('pg-desc').value.trim(), valor: num($('pg-valor').value),
    vencimento: $('pg-venc').value, forma: $('pg-forma').value, obs: $('pg-obs').value.trim(),
    pagoEm: $('pg-pago').checked ? ($('pg-pagoem').value || hojeISO()) : ''
  };
  if (!d.alunoId) { toast('Selecione o mentorado', 'error'); return; }
  if (!d.valor) { toast('Informe o valor', 'error'); return; }
  if (!d.vencimento) { toast('Informe o vencimento', 'error'); return; }
  if (editPagId) {
    const alvo = DB.pagamentos.find(x => x.id === editPagId);
    if (sumiu(alvo, 'modal-pag')) return;
    Object.assign(alvo, d);
  } else DB.pagamentos.push({ id: uid(), ...d });
  fecharModal('modal-pag');
  commit(editPagId ? 'Cobrança atualizada' : 'Cobrança lançada ✓');
}
function excluirPagamento() {
  if (!editPagId || !confirm('Excluir esta cobrança?')) return;
  DB.pagamentos = DB.pagamentos.filter(x => x.id !== editPagId);
  fecharModal('modal-pag');
  commit('Cobrança excluída');
}

// ============================================================
// PROGRAMA — cadastro
// ============================================================
let editProgId = null;
function novoPrograma() {
  editProgId = null;
  $('pr-nome').value = ''; $('pr-desc').value = '';
  $('pr-freq').innerHTML = options(FREQ, DB.config.frequenciaPadrao);
  $('pr-duracao').value = DB.config.duracaoPadrao;
  $('pr-hora').value = DB.config.horaPadrao;
  $('pr-valor').value = ''; $('pr-parcelas').value = 1; $('pr-suporte').value = 30;
  $('pr-temas').value = ''; $('pr-qtd').textContent = 0;
  $('pr-excluir').style.display = 'none';
  $('prog-titulo').textContent = 'Novo programa';
  abrirModal('modal-prog');
}
function editarPrograma(id) {
  const p = getPrograma(id);
  if (!p) return;
  editProgId = id;
  $('pr-nome').value = p.nome; $('pr-desc').value = p.descricao || '';
  $('pr-freq').innerHTML = options(FREQ, p.frequencia);
  $('pr-duracao').value = p.duracao || 60;
  $('pr-hora').value = p.hora || '';
  $('pr-valor').value = p.valor || ''; $('pr-parcelas').value = p.parcelas || 1; $('pr-suporte').value = num(p.suporteDias);
  $('pr-temas').value = p.temas.join('\n'); $('pr-qtd').textContent = p.temas.length;
  $('pr-excluir').style.display = '';
  $('prog-titulo').textContent = 'Editar programa';
  abrirModal('modal-prog');
}
function salvarPrograma() {
  const d = {
    nome: $('pr-nome').value.trim(), descricao: $('pr-desc').value.trim(), frequencia: $('pr-freq').value,
    duracao: num($('pr-duracao').value) || 60, hora: $('pr-hora').value, valor: num($('pr-valor').value),
    parcelas: Math.max(1, Math.floor(num($('pr-parcelas').value)) || 1), temas: linhas($('pr-temas').value), suporteDias: Math.max(0, Math.floor(num($('pr-suporte').value)))
  };
  if (!d.nome) { toast('Informe o nome do programa', 'error'); return; }
  if (!d.temas.length) { toast('Informe pelo menos um tema', 'error'); return; }
  if (editProgId) {
    if (sumiu(getPrograma(editProgId), 'modal-prog')) return;
    Object.assign(getPrograma(editProgId), d);
  } else DB.programas.push({ id: uid(), ...d });
  fecharModal('modal-prog');
  commit('Programa salvo');
}
function duplicarPrograma(id) {
  const p = getPrograma(id);
  if (!p) return;
  DB.programas.push({ ...JSON.parse(JSON.stringify(p)), id: uid(), nome: p.nome + ' (cópia)' });
  commit('Programa duplicado');
}
function excluirPrograma() {
  const usando = DB.alunos.filter(a => a.programaId === editProgId).length;
  if (!confirm(`Excluir este programa?${usando ? `\n\n${plural(usando, 'mentorado usa', 'mentorados usam')} ele — as aulas já criadas continuam, só o vínculo com o programa some.` : ''}`)) return;
  DB.programas = DB.programas.filter(p => p.id !== editProgId);
  DB.alunos.forEach(a => { if (a.programaId === editProgId) a.programaId = ''; });
  fecharModal('modal-prog');
  commit('Programa excluído');
}

// ============================================================
// DETALHE DO MENTORADO
// ============================================================
let detId = null, detTab = 'resumo';
function abrirDetalhe(id, tab) {
  if (!getAluno(id)) return;
  detId = id;
  detTab = tab || 'resumo';
  renderDetalhe();
  abrirModal('modal-detalhe');
}
function setDetTab(t) { detTab = t; renderDetalhe(); }
function renderDetalhe() {
  const al = getAluno(detId);
  if (!al) { fecharModal('modal-detalhe'); return; }
  const st = STATUS_ALUNO[al.status] || STATUS_ALUNO.ativo;
  const prog = getPrograma(al.programaId);
  $('det-header').innerHTML = `<div class="pessoa">${avatar(al, 'avatar-lg')}<div><h3 style="font-size:18px">${esc(al.nome)} ${badge(st.l, st.c)} ${badgeFin(al.id)}</h3>
      <div class="muted text-sm" style="margin-top:3px">${esc([al.loja, al.plataforma, al.nicho, prog && prog.nome].filter(Boolean).join(' · ') || 'Sem dados do negócio')}</div></div></div>
    <div class="flex gap-8 items-center">${al.whatsapp ? `<button class="btn btn-whats btn-sm" onclick="abrirWhats('${al.id}')">💬 WhatsApp</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="editarAluno('${al.id}')">✏️ Editar</button>
      <button class="modal-close" onclick="fecharModal('modal-detalhe')">×</button></div>`;
  garantirVoltar('modal-detalhe');
  const nA = aulasDoAluno(al.id).length, nP = pagsDoAluno(al.id).length;
  const jr = jornadaAluno(al.id), sp = suporteAluno(al);
  const tabs = [['resumo', 'Resumo'], ['jornada', `Jornada<span class="n">${jr.total ? jr.realizadas + '/' + jr.total : '—'}</span>`], ['aulas', `Aulas<span class="n">${nA}</span>`], ['pagamentos', `Pagamentos<span class="n">${nP}</span>`],
    ['suporte', `Suporte${sp ? `<span class="n">${sp.estado === 'ativo' ? sp.restam + 'd' : sp.estado === 'encerrado' ? 'fim' : 'em breve'}</span>` : ''}`],
    ['evolucao', `Resultados<span class="n">${al.evolucao.length}</span>`], ['notas', `Anotações<span class="n">${al.notas.length}</span>`]];
  let h = `<div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${detTab === k ? 'active' : ''}" onclick="setDetTab('${k}')">${l}</div>`).join('')}</div>`;
  if (detTab === 'resumo') h += detResumo(al, prog);
  else if (detTab === 'jornada') h += detJornada(al);
  else if (detTab === 'suporte') h += detSuporte(al);
  else if (detTab === 'aulas') h += detAulas(al);
  else if (detTab === 'pagamentos') h += detPagamentos(al);
  else if (detTab === 'evolucao') h += detEvolucao(al);
  else h += detNotas(al);
  $('det-body').innerHTML = h;
  if (detTab === 'evolucao') desenharEvolucao(al);
}
function detResumo(al, prog) {
  const pr = progressoAluno(al.id), f = finAluno(al.id);
  const ultEvo = al.evolucao.slice().sort((a, b) => a.mes.localeCompare(b.mes)).pop();
  const cresc = ultEvo && num(al.faturamentoInicial) > 0 ? (num(ultEvo.faturamento) / num(al.faturamentoInicial) - 1) * 100 : null;
  const ultTarefa = aulasDoAluno(al.id).filter(a => a.tarefas && aulaConsumida(a)).sort(porDataHora).pop();
  const info = [
    ['WhatsApp', al.whatsapp], ['E-mail', al.email], ['Instagram', al.instagram], ['Cidade', al.cidade],
    ['Loja', al.loja], ['Plataforma', al.plataforma], ['Nicho', al.nicho],
    ['Site', al.site ? `<a class="link" onclick="abrirURL(${esc(JSON.stringify(al.site))})">${esc(al.site)}</a>` : '', true],
    ['Faturamento inicial', al.faturamentoInicial !== '' && al.faturamentoInicial != null ? fmtBRL(al.faturamentoInicial) + '/mês' : ''],
    ['Programa', prog ? prog.nome : ''], ['Início', fmtData(al.inicio)], ['Término previsto', al.fim ? fmtData(al.fim) : ''],
    ['Cobrança', textoModo(al)], ['Cliente desde', al.criadoEm ? new Date(al.criadoEm).toLocaleDateString('pt-BR') : '']
  ];
  return `<div class="cards-grid grid-4 mb-16">
      <div class="card card-sm"><div class="card-label">Aulas</div><div class="card-value">${pr.feitas}<span class="muted" style="font-size:15px">/${pr.total}</span></div><div style="margin-top:8px">${barraProgresso(pr.feitas, pr.total, corValida(al.cor), aulasDoAluno(al.id).filter(a => a.status === 'falta').length)}</div></div>
      <div class="card card-sm"><div class="card-label">Próxima aula</div><div class="card-value" style="font-size:17px">${pr.proxima ? `${fmtDataSemana(pr.proxima.data)} · ${esc(pr.proxima.hora)}` : '—'}</div><div class="card-sub">${pr.proxima ? esc(pr.proxima.tema) : 'Nenhuma agendada'}</div></div>
      <div class="card card-sm"><div class="card-label">Pagamento</div><div class="card-value pos" style="font-size:19px">${fmtBRL(f.pago)}</div><div class="card-sub">de ${fmtBRL(f.cobrado)} cobrados${f.atrasado ? ` · <span class="neg">${fmtBRL(f.atrasado)} atrasado</span>` : ''}</div></div>
      <div class="card card-sm"><div class="card-label">Crescimento do faturamento</div><div class="card-value ${cresc == null ? '' : cresc >= 0 ? 'pos' : 'neg'}" style="font-size:19px">${cresc == null ? '—' : (cresc >= 0 ? '+' : '') + cresc.toFixed(0) + '%'}</div><div class="card-sub">${ultEvo ? `${fmtBRL(ultEvo.faturamento)} em ${fmtMes(ultEvo.mes)}` : 'Registre na aba Resultados'}</div></div>
    </div>
    ${!pr.total || !f.qtd ? `<div class="alerta alerta-warn"><span>💡</span><div class="grow">${!pr.total ? 'Este mentorado ainda não tem aulas.' : ''} ${!f.qtd ? 'Nenhuma cobrança lançada.' : ''}</div>
      ${!pr.total ? `<button class="btn btn-ghost btn-sm" onclick="abrirGerarAulas('${al.id}')">Gerar cronograma</button>` : ''}
      ${!f.qtd ? `<button class="btn btn-ghost btn-sm" onclick="abrirGerarParcelas('${al.id}')">Gerar cobranças</button>` : ''}</div>` : ''}
    <div class="card mb-16"><div class="info-grid">${info.map(([k, v, html]) => `<div><div class="k">${k}</div><div class="v">${v ? (html ? v : esc(v)) : '<span class="muted">—</span>'}</div></div>`).join('')}</div></div>
    ${al.objetivo ? `<div class="mb-16"><div class="section-title card-label">🎯 Objetivo da mentoria</div><div class="bloco-texto">${esc(al.objetivo)}</div></div>` : ''}
    ${ultTarefa ? `<div class="mb-16"><div class="card-label">📋 Última tarefa passada (aula ${esc(ultTarefa.numero || '')} · ${fmtData(ultTarefa.data)})</div><div class="bloco-texto">${esc(ultTarefa.tarefas)}</div></div>` : ''}
    ${al.obs ? `<div class="mb-16"><div class="card-label">Observações</div><div class="bloco-texto">${esc(al.obs)}</div></div>` : ''}
    <div class="flex justify-between mt-24"><button class="btn btn-danger btn-sm" onclick="excluirAluno('${al.id}')">Excluir mentorado</button></div>`;
}
// ── Aba JORNADA: as aulas do programa, uma a uma ──
function detJornada(al) {
  const j = jornadaAluno(al.id);
  if (!j.total) {
    const sug = getPrograma(idProgPlataforma(chavePlataforma(al.plataforma)));
    return `<div class="empty-state"><div class="icon">🧭</div><p>Este mentorado ainda não tem um programa de aulas.</p>
      ${sug ? `<button class="btn btn-primary" onclick="aplicarPrograma('${al.id}','${sug.id}')">Usar "${esc(sug.nome)}"</button> ` : ''}
      <button class="btn btn-ghost" onclick="editarAluno('${al.id}')">Escolher outro programa</button></div>`;
  }
  const sp = suporteAluno(al);
  let h = `<div class="cards-grid grid-4 mb-16">
    <div class="card card-sm"><div class="card-label">Aulas dadas</div><div class="card-value pos">${j.realizadas}<span class="muted" style="font-size:15px">/${j.total}</span></div>
      <div style="margin-top:8px"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(j.realizadas / j.total * 100)}%;background:var(--success)"></div></div></div></div>
    <div class="card card-sm"><div class="card-label">Faltas</div><div class="card-value ${j.faltas ? 'neg' : ''}">${j.faltas}</div><div class="card-sub">${j.faltas ? 'aulas a remarcar abaixo' : 'nenhuma falta 👏'}</div></div>
    <div class="card card-sm"><div class="card-label">Agendadas</div><div class="card-value">${j.agendadas}</div></div>
    <div class="card card-sm"><div class="card-label">Faltam dar</div><div class="card-value">${j.total - j.realizadas}</div></div>
  </div>
  <div class="flex justify-between items-center mb-16" style="flex-wrap:wrap;gap:8px"><div class="muted text-sm">📚 ${esc(j.pr.nome)}</div>
    <div class="flex gap-8"><button class="btn btn-ghost btn-sm" onclick="editarAluno('${al.id}')">Trocar programa</button><button class="btn btn-ghost btn-sm" onclick="abrirGerarAulas('${al.id}')">⚡ Agendar as próximas</button></div></div>`;
  if (j.concluida) {
    h += `<div class="alerta" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35)"><span style="font-size:20px">🎉</span><div class="grow"><b>Jornada concluída</b> em ${fmtData(j.dataFim)}.${sp ? ` Suporte ${sp.estado === 'ativo' ? 'ativo até ' + fmtData(sp.fim) : sp.estado === 'encerrado' ? 'encerrado em ' + fmtData(sp.fim) : 'a partir de ' + fmtData(sp.inicio)}.` : ''}</div>
      <button class="btn btn-ghost btn-sm" onclick="setDetTab('suporte')">🛟 Suporte</button></div>`;
  }
  return h + `<div class="jornada">${j.slots.map(s => slotJornada(al, s)).join('')}</div>`;
}
function slotJornada(al, s) {
  let estado, cls = '', info = '', acoes = '';
  if (s.realizada) {
    estado = badge('✓ Realizada', 'success'); cls = 'ok';
    info = `${fmtDataSemana(s.realizada.data)} · ${esc(s.realizada.hora)}`;
    acoes = `<button class="btn btn-ghost btn-xs" onclick="editarAula('${s.realizada.id}')">📝 Detalhes</button>`;
  } else if (s.agendada) {
    estado = aulaPendenteConfirmacao(s.agendada) ? badge('A confirmar', 'warning') : badge('📅 Agendada', 'info'); cls = 'ag';
    info = `${fmtDataSemana(s.agendada.data)} · ${esc(s.agendada.hora)}`;
    acoes = `<button class="btn btn-success btn-xs" onclick="marcarAula('${s.agendada.id}','realizada')">✓ Realizada</button>
      <button class="btn btn-ghost btn-xs" onclick="marcarAula('${s.agendada.id}','falta')">✗ Faltou</button>
      <button class="btn btn-ghost btn-xs" onclick="editarAula('${s.agendada.id}')">Editar</button>`;
  } else {
    estado = s.faltas.length ? badge('Remarcar', 'danger') : badge('A agendar', 'gray');
    cls = s.faltas.length ? 'falta' : '';
    acoes = `<button class="btn btn-primary btn-xs" onclick="agendarSlot('${al.id}',${s.n})">${s.faltas.length ? '↻ Remarcar' : '+ Agendar'}</button>`;
  }
  const faltas = s.faltas.length ? `<div class="js-faltas">✗ ${plural(s.faltas.length, 'falta')}: ${s.faltas.map(f => `<a class="link" onclick="editarAula('${f.id}')">${fmtDataCurta(f.data)}</a>`).join(', ')}</div>` : '';
  const r = s.realizada;
  const det = r && (r.notas || r.tarefas) ? `<div class="js-det">${r.notas ? '📝 ' + esc(r.notas) : ''}${r.notas && r.tarefas ? '<br>' : ''}${r.tarefas ? '📋 ' + esc(r.tarefas) : ''}</div>` : '';
  return `<div class="js-item ${cls}"><div class="js-num">${r ? '✓' : s.n}</div><div class="js-corpo">
    <div class="js-topo"><div class="js-tema">Aula ${s.n} · ${esc(s.tema)}</div>${estado}</div>
    ${info ? `<div class="js-info">${info}</div>` : ''}${faltas}${det}<div class="js-acoes">${acoes}</div></div></div>`;
}
function agendarSlot(alunoId, n) {
  const s = jornadaAluno(alunoId).slots[n - 1];
  if (!s) return;
  const ultima = aulasDoAluno(alunoId).filter(aulaConta).sort(porDataHora).pop();
  const hoje = hojeISO();
  const data = ultima && addDias(ultima.data, 7) > hoje ? addDias(ultima.data, 7) : hoje;
  novaAula({ alunoIds: [alunoId], data, numero: n, tema: s.tema, titulo: `Aula ${n} — ${nomeAluno(alunoId)}` });
}
function aplicarPrograma(alunoId, progId) {
  const al = getAluno(alunoId);
  if (!al) return;
  al.programaId = progId;
  commit('Programa aplicado ✓');
}

// ── Aba SUPORTE: 30 dias depois das aulas ──
const CANAIS = ['WhatsApp', 'Ligação', 'Chamada de vídeo', 'E-mail', 'Presencial', 'Outro'];
function detSuporte(al) {
  const j = jornadaAluno(al.id), sp = suporteAluno(al);
  if (!sp) {
    const texto = j.total ? (j.concluida ? `As ${j.total} aulas terminaram em ${fmtData(j.dataFim)}.` : `O suporte começa sozinho quando as ${j.total} aulas forem concluídas (${j.realizadas}/${j.total} até agora).`) : '';
    return `<div class="card"><div class="card-head"><h3>🛟 Suporte pós-mentoria</h3>${badge('Não iniciado', 'gray')}</div>
      <div class="card-sub mb-16">${texto} Se preferir, inicie manualmente:</div>
      <div class="form-row col3" style="align-items:end">
        <div class="form-group"><label>Início do suporte</label><input id="sp-inicio" type="date" value="${j.dataFim || hojeISO()}"></div>
        <div class="form-group"><label>Duração (dias)</label><input id="sp-dias" type="number" min="1" value="${num(j.pr && j.pr.suporteDias) || 30}"></div>
        <div class="form-group"><button class="btn btn-primary" onclick="salvarSuporte('${al.id}')">Iniciar suporte</button></div></div></div>`;
  }
  const pct = Math.round(sp.decorridos / sp.dias * 100);
  const st = sp.estado === 'ativo' ? badge(`Ativo · faltam ${plural(sp.restam, 'dia')}`, 'success')
    : sp.estado === 'futuro' ? badge('Começa em ' + fmtData(sp.inicio), 'info') : badge('Encerrado em ' + fmtData(sp.fim), 'gray');
  const lista = sp.atendimentos.slice().sort((a, b) => b.data.localeCompare(a.data));
  return `<div class="card mb-16"><div class="card-head"><h3>🛟 Suporte de ${sp.dias} dias</h3>${st}</div>
      <div class="cards-grid grid-3 mb-16" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div><div class="card-label">Início</div><div class="font-bold">${fmtData(sp.inicio)}</div></div>
        <div><div class="card-label">Fim</div><div class="font-bold">${fmtData(sp.fim)}</div></div>
        <div><div class="card-label">Atendimentos</div><div class="font-bold">${sp.atendimentos.length}</div></div></div>
      <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${pct}%;background:${sp.estado === 'encerrado' ? 'var(--text3)' : 'var(--success)'}"></div></div>
      <div class="prog-txt">${sp.decorridos} de ${sp.dias} dias</div>
      <div class="flex gap-8 mt-16" style="flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="$('sp-editar').style.display=''">✏️ Alterar datas</button>
        ${sp.estado === 'encerrado' && al.status === 'ativo' ? `<button class="btn btn-success btn-sm" onclick="concluirMentoria('${al.id}')">✓ Marcar mentoria como concluída</button>` : ''}
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="removerSuporte('${al.id}')">Remover suporte</button></div>
      <div id="sp-editar" style="display:none" class="mt-16"><div class="form-row col3" style="align-items:end">
        <div class="form-group"><label>Início</label><input id="sp-inicio" type="date" value="${sp.inicio}"></div>
        <div class="form-group"><label>Duração (dias)</label><input id="sp-dias" type="number" min="1" value="${sp.dias}"></div>
        <div class="form-group"><button class="btn btn-primary" onclick="salvarSuporte('${al.id}')">Salvar</button></div></div></div></div>
    <div class="card"><div class="card-head"><h3>📞 Atendimentos do suporte</h3></div>
      <div class="form-row col3">
        <div class="form-group"><label>Data</label><input id="at-data" type="date" value="${hojeISO()}"></div>
        <div class="form-group"><label>Canal</label><select id="at-canal">${optionsLista(CANAIS, 'WhatsApp')}</select></div>
        <div class="form-group"><label>Assunto</label><input id="at-assunto" placeholder="Ex.: dúvida sobre campanha"></div></div>
      <div class="form-group"><label>Detalhes</label><textarea id="at-detalhe" placeholder="O que foi tratado, próximos passos..."></textarea></div>
      <div class="flex mb-16" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" onclick="adicionarAtendimento('${al.id}')">+ Registrar atendimento</button></div>
      ${lista.length ? lista.map(a => `<div class="nota"><div class="cab"><span>📅 ${fmtDataSemana(a.data)} · ${esc(a.canal)}${a.data >= sp.inicio && a.data <= sp.fim ? ` · dia ${diasEntre(sp.inicio, a.data) + 1} do suporte` : ''}</span>
        <button class="btn-icon" style="font-size:12px" onclick="excluirAtendimento('${al.id}','${a.id}')" title="Excluir">🗑</button></div>
        <div class="txt">${a.assunto ? `<b>${esc(a.assunto)}</b>` : ''}${a.assunto && a.detalhe ? '\n' : ''}${esc(a.detalhe || '')}</div></div>`).join('') : '<div class="empty-mini">Nenhum atendimento registrado ainda.</div>'}
    </div>`;
}
function salvarSuporte(alunoId) {
  const al = getAluno(alunoId);
  if (sumiu(al, 'modal-detalhe')) return;
  const inicio = $('sp-inicio').value, dias = Math.floor(num($('sp-dias').value));
  if (!inicio || dias < 1) { toast('Informe a data de início e a duração', 'error'); return; }
  al.suporte = { ...(al.suporte || {}), inicio, dias, atendimentos: (al.suporte && al.suporte.atendimentos) || [] };
  commit(`Suporte até ${fmtData(addDias(inicio, dias))} ✓`);
}
function removerSuporte(alunoId) {
  const al = getAluno(alunoId);
  if (!al || !confirm('Remover o suporte deste mentorado?' + (al.suporte && al.suporte.atendimentos.length ? `\n\nOs ${al.suporte.atendimentos.length} atendimentos registrados também serão apagados.` : ''))) return;
  al.suporte = null;
  commit('Suporte removido');
}
function concluirMentoria(alunoId) {
  const al = getAluno(alunoId);
  if (!al) return;
  al.status = 'concluido';
  commit(`Mentoria de ${primeiroNome(al.nome)} concluída 🎓`);
}
function adicionarAtendimento(alunoId) {
  const al = getAluno(alunoId);
  if (sumiu(al, 'modal-detalhe') || !al.suporte) return;
  const at = { id: uid(), data: $('at-data').value || hojeISO(), canal: $('at-canal').value, assunto: $('at-assunto').value.trim(), detalhe: $('at-detalhe').value.trim() };
  if (!at.assunto && !at.detalhe) { toast('Escreva o assunto ou os detalhes do atendimento', 'error'); return; }
  al.suporte.atendimentos.push(at);
  commit('Atendimento registrado ✓');
}
function excluirAtendimento(alunoId, atId) {
  const al = getAluno(alunoId);
  if (!al || !al.suporte || !confirm('Excluir este atendimento?')) return;
  al.suporte.atendimentos = al.suporte.atendimentos.filter(a => a.id !== atId);
  commit();
}

function detAulas(al) {
  const l = aulasDoAluno(al.id).sort(porDataHora);
  const barra = `<div class="flex gap-8 mb-16"><button class="btn btn-primary btn-sm" onclick="novaAula({alunoIds:['${al.id}']})">+ Aula</button><button class="btn btn-ghost btn-sm" onclick="abrirGerarAulas('${al.id}')">⚡ Gerar cronograma</button>
    <span class="muted text-sm" style="margin-left:auto;align-self:center">${l.filter(a => a.status === 'realizada').length} realizadas · ${l.filter(a => a.status === 'falta').length} faltas · ${l.filter(a => a.status === 'agendada').length} agendadas</span></div>`;
  if (!l.length) return barra + `<div class="empty-mini">Nenhuma aula ainda.</div>`;
  return barra + `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Horário</th><th>Nº</th><th>Tema</th><th>Status</th><th></th></tr></thead><tbody>${l.map(a => linhaAula(a, true)).join('')}</tbody></table></div>`;
}
function detPagamentos(al) {
  const l = pagsDoAluno(al.id).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const f = finAluno(al.id);
  const falta = pacote(al) ? num(al.valor) - f.cobrado : 0;
  let h = `<div class="cards-grid grid-4 mb-16">
    <div class="card card-sm"><div class="card-label">Forma de cobrança</div><div class="card-value" style="font-size:16px">${esc(textoModo(al))}</div>
      <div class="card-sub"><a class="link" onclick="abrirGerarParcelas('${al.id}')">alterar / gerar cobranças</a></div></div>
    <div class="card card-sm"><div class="card-label">Pago</div><div class="card-value pos" style="font-size:18px">${fmtBRL(f.pago)}</div></div>
    <div class="card card-sm"><div class="card-label">Em aberto</div><div class="card-value" style="font-size:18px">${fmtBRL(f.aberto)}</div></div>
    <div class="card card-sm"><div class="card-label">Em atraso</div><div class="card-value ${f.atrasado ? 'neg' : ''}" style="font-size:18px">${fmtBRL(f.atrasado)}</div></div></div>
    ${falta > 0.005 ? `<div class="alerta alerta-warn"><span>💡</span><div class="grow">${fmtBRL(falta)} do valor contratado ainda não tem parcela lançada.</div><button class="btn btn-ghost btn-sm" onclick="abrirGerarParcelas('${al.id}')">Gerar parcelas</button></div>` : ''}
    <div class="flex gap-8 mb-16"><button class="btn btn-primary btn-sm" onclick="novaCobranca({alunoId:'${al.id}'})">+ Cobrança avulsa</button><button class="btn btn-ghost btn-sm" onclick="abrirGerarParcelas('${al.id}')">⚡ Gerar cobranças</button></div>`;
  if (!l.length) return h + `<div class="empty-mini">Nenhuma cobrança ainda.</div>`;
  return h + `<div class="table-wrap"><table><thead><tr><th>Vencimento</th><th>Descrição</th><th>Valor</th><th>Forma</th><th>Situação</th><th></th></tr></thead><tbody>${l.map(p => linhaPag(p, true)).join('')}</tbody></table></div>`;
}
function detEvolucao(al) {
  const l = al.evolucao.slice().sort((a, b) => a.mes.localeCompare(b.mes));
  let h = `<div class="flex gap-8 mb-16 items-center"><button class="btn btn-primary btn-sm" onclick="novaEvolucao()">+ Registrar mês</button>
    <span class="muted text-sm">Acompanhe o faturamento da loja do mentorado mês a mês${al.faturamentoInicial ? ` · início: <b>${fmtBRL(al.faturamentoInicial)}/mês</b>` : ''}</span></div>`;
  if (!l.length) return h + `<div class="empty-mini">Nenhum resultado registrado. Registre o faturamento mensal da loja para acompanhar a evolução.</div>`;
  h += `<div class="card mb-16"><div class="chart-wrap" style="height:200px"><canvas id="graf-evo"></canvas></div></div>`;
  h += `<div class="table-wrap"><table><thead><tr><th>Mês</th><th>Faturamento</th><th>Variação</th><th>Pedidos</th><th>Ticket médio</th><th>Anúncios</th><th>ROAS</th><th>Obs.</th></tr></thead><tbody>
    ${l.map((e, i) => {
      const ant = i ? num(l[i - 1].faturamento) : num(al.faturamentoInicial);
      const v = ant > 0 ? (num(e.faturamento) / ant - 1) * 100 : null;
      const ticket = num(e.pedidos) ? num(e.faturamento) / num(e.pedidos) : null;
      const roas = num(e.ads) ? num(e.faturamento) / num(e.ads) : null;
      return `<tr class="clicavel" onclick="editarEvolucao('${e.id}')"><td class="font-bold">${fmtMesLongo(e.mes)}</td><td class="td-mono font-bold">${fmtBRL(e.faturamento)}</td>
        <td class="td-mono ${v == null ? 'muted' : v >= 0 ? 'pos' : 'neg'}">${v == null ? '—' : (v >= 0 ? '▲ +' : '▼ ') + v.toFixed(1).replace('.', ',') + '%'}</td>
        <td class="td-mono">${e.pedidos || '—'}</td><td class="td-mono">${ticket ? fmtBRL(ticket) : '—'}</td><td class="td-mono">${e.ads ? fmtBRL(e.ads) : '—'}</td>
        <td class="td-mono">${roas ? roas.toFixed(2).replace('.', ',') + 'x' : '—'}</td><td class="text-sm muted">${esc(e.obs || '')}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  return h;
}
function desenharEvolucao(al) {
  const l = al.evolucao.slice().sort((a, b) => a.mes.localeCompare(b.mes));
  if (!l.length) return;
  requestAnimationFrame(() => drawBars($('graf-evo'), l.map(e => fmtMes(e.mes)), [{ nome: 'Faturamento', cor: corValida(al.cor), values: l.map(e => num(e.faturamento)) }], { fmt: fmtCurto, fmtFull: fmtBRL, curtos: l.map(e => MESES_CURTO[+e.mes.slice(5) - 1]) }));
}
function detNotas(al) {
  const l = al.notas.slice().sort((a, b) => b.data.localeCompare(a.data));
  return `<div class="form-group"><textarea id="nota-nova" placeholder="Escreva uma anotação sobre o mentorado (ideias, combinados, pontos de atenção)..."></textarea></div>
    <div class="flex mb-16" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" onclick="adicionarNota()">Adicionar anotação</button></div>
    ${l.length ? l.map(n => `<div class="nota"><div class="cab"><span>${new Date(n.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span><button class="btn-icon" style="font-size:12px" onclick="excluirNota('${n.id}')" title="Excluir">🗑</button></div><div class="txt">${esc(n.texto)}</div></div>`).join('') : '<div class="empty-mini">Nenhuma anotação ainda.</div>'}`;
}
function adicionarNota() {
  const t = $('nota-nova').value.trim();
  if (!t || sumiu(getAluno(detId), 'modal-detalhe')) return;
  getAluno(detId).notas.push({ id: uid(), data: new Date().toISOString(), texto: t });
  commit('Anotação adicionada');
}
function excluirNota(id) {
  if (!confirm('Excluir esta anotação?')) return;
  const al = getAluno(detId);
  al.notas = al.notas.filter(n => n.id !== id);
  commit();
}

// Evolução (resultados mensais da loja)
let editEvoId = null;
function novaEvolucao() {
  editEvoId = null;
  const al = getAluno(detId);
  const ult = al.evolucao.map(e => e.mes).sort().pop();
  $('ev-mes').value = ult ? addMeses(ult + '-01', 1).slice(0, 7) : addMeses(hojeISO().slice(0, 7) + '-01', -1).slice(0, 7);
  ['ev-fat', 'ev-pedidos', 'ev-ads', 'ev-obs'].forEach(i => $(i).value = '');
  $('ev-excluir').style.display = 'none';
  abrirModal('modal-evo');
}
function editarEvolucao(id) {
  const e = getAluno(detId).evolucao.find(x => x.id === id);
  if (!e) return;
  editEvoId = id;
  $('ev-mes').value = e.mes; $('ev-fat').value = e.faturamento; $('ev-pedidos').value = e.pedidos || '';
  $('ev-ads').value = e.ads || ''; $('ev-obs').value = e.obs || '';
  $('ev-excluir').style.display = '';
  abrirModal('modal-evo');
}
function salvarEvolucao() {
  const al = getAluno(detId);
  if (sumiu(al, 'modal-evo')) return;
  const d = { mes: $('ev-mes').value, faturamento: num($('ev-fat').value), pedidos: $('ev-pedidos').value === '' ? '' : num($('ev-pedidos').value), ads: $('ev-ads').value === '' ? '' : num($('ev-ads').value), obs: $('ev-obs').value.trim() };
  if (!d.mes) { toast('Informe o mês', 'error'); return; }
  if ($('ev-fat').value === '') { toast('Informe o faturamento', 'error'); return; }
  const dup = al.evolucao.find(e => e.mes === d.mes && e.id !== editEvoId);
  if (dup && !confirm(`Já existe registro para ${fmtMesLongo(d.mes)}. Substituir?`)) return;
  if (dup) al.evolucao = al.evolucao.filter(e => e.id !== dup.id);
  const alvoEvo = editEvoId && al.evolucao.find(e => e.id === editEvoId);
  if (alvoEvo) Object.assign(alvoEvo, d);
  else al.evolucao.push({ id: uid(), ...d });
  fecharModal('modal-evo');
  commit('Resultado registrado');
}
function excluirEvolucao() {
  if (!editEvoId || !confirm('Excluir este registro?')) return;
  const al = getAluno(detId);
  al.evolucao = al.evolucao.filter(e => e.id !== editEvoId);
  fecharModal('modal-evo');
  commit('Registro excluído');
}

// ============================================================
// WHATSAPP / GOOGLE AGENDA / LINKS
// ============================================================
function abrirURL(url) {
  let u = String(url || '').trim();
  if (!u) return;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  window.open(u, '_blank');
}
function linkWhats(numero, texto) {
  let d = String(numero || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length <= 11) d = '55' + d;
  return 'https://wa.me/' + d + (texto ? '?text=' + encodeURIComponent(texto) : '');
}
function abrirWhats(alunoId, texto) {
  const al = getAluno(alunoId);
  const l = al && linkWhats(al.whatsapp, texto);
  if (!l) { toast(`${al ? primeiroNome(al.nome) : 'Mentorado'} não tem WhatsApp cadastrado`, 'error'); return false; }
  window.open(l, '_blank');
  return true;
}
function preencher(tpl, vars) { return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m).replace(/\n{3,}/g, '\n\n').trim(); }
function textoLembrete(a, alunoId) {
  const rd = relDia(a.data);
  return preencher(DB.config.msgLembrete, {
    nome: primeiroNome(nomeAluno(alunoId)), quando: rd === 'Hoje' ? 'hoje' : rd === 'Amanhã' ? 'amanhã' : `${DIAS_SEM_LONGO[parseISO(a.data).getDay()]}, ${fmtDataCurta(a.data)}`,
    data: fmtData(a.data), hora: a.hora, tema: a.tema, numero: a.numero || '', link: a.link ? '🔗 ' + a.link : '', mentor: DB.config.mentor
  });
}
function enviarLembretes(a) {
  const com = a.alunoIds.filter(id => (getAluno(id) || {}).whatsapp);
  if (!com.length) { toast('Nenhum mentorado desta aula tem WhatsApp cadastrado', 'error'); return; }
  com.forEach(id => abrirWhats(id, textoLembrete(a, id)));
}
function lembreteAula(id) { const a = DB.aulas.find(x => x.id === id); if (a) enviarLembretes(a); }
function lembreteAulaWhats() { enviarLembretes(lerFormAula()); }
function cobrarWhats(pagId) {
  const p = DB.pagamentos.find(x => x.id === pagId);
  if (!p) return;
  abrirWhats(p.alunoId, preencher(DB.config.msgCobranca, {
    nome: primeiroNome(nomeAluno(p.alunoId)), valor: fmtBRL(p.valor), vencimento: fmtData(p.vencimento),
    descricao: p.descricao || 'mensalidade', mentor: DB.config.mentor
  }));
}
function aulaGoogleAgenda() {
  const a = lerFormAula();
  if (!a.data || !a.hora) return;
  const f = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Mentoria — ${nomesAula(a)}${a.numero ? ' (Aula ' + a.numero + ')' : ''}: ${a.tema}`,
    dates: f(dataHora(a)) + '/' + f(fimAula(a)),
    details: [a.pauta, a.link && 'Link: ' + a.link].filter(Boolean).join('\n\n'),
    ctz: 'America/Sao_Paulo'
  });
  if (a.link) p.set('location', a.link);
  window.open('https://calendar.google.com/calendar/render?' + p.toString(), '_blank');
}

// ============================================================
// EXPORTAR / IMPORTAR
// ============================================================
async function salvarArquivo(nome, conteudo, tipo) {
  if (window.api) {
    const r = await window.api.salvarArquivo(nome, conteudo);
    if (r.ok) toast('Arquivo salvo ✓');
    else if (!r.cancelado) toast('Erro ao salvar arquivo: ' + r.erro, 'error');
    return;
  }
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportarJSON() {
  salvarArquivo(`mentorias-backup-${hojeISO()}.json`, JSON.stringify(DB, null, 2), 'application/json');
}
function exportarCSV() {
  const l = filtrarPags();
  if (!l.length) { toast('Nenhuma cobrança para exportar com os filtros atuais', 'error'); return; }
  const cel = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const linhasCSV = [['Vencimento', 'Mentorado', 'Descrição', 'Valor', 'Forma', 'Situação', 'Pago em', 'Observação'].map(cel).join(';')];
  l.forEach(p => linhasCSV.push([fmtData(p.vencimento), nomeAluno(p.alunoId), p.descricao, num(p.valor).toFixed(2).replace('.', ','), p.forma,
    { pago: 'Pago', atrasado: 'Atrasado', pendente: 'A vencer' }[statusPag(p)], p.pagoEm ? fmtData(p.pagoEm) : '', p.obs].map(cel).join(';')));
  salvarArquivo(`financeiro-mentorias-${hojeISO()}.csv`, '﻿' + linhasCSV.join('\r\n'), 'text/csv');
}
function importarJSON(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let d;
    try { d = JSON.parse(r.result); } catch (e) { toast('Arquivo inválido', 'error'); return; }
    if (!d || !Array.isArray(d.alunos) || !Array.isArray(d.aulas)) { toast('Esse arquivo não é um backup do Mentorias', 'error'); return; }
    if (!confirm(`Importar backup com ${plural(d.alunos.length, 'mentorado')}, ${plural(d.aulas.length, 'aula')} e ${plural((d.pagamentos || []).length, 'cobrança')}?\n\nIsso SUBSTITUI todos os dados atuais (o backup diário de hoje continua na pasta backups).`)) return;
    DB = normalizar(d);
    commit('Backup importado ✓');
  };
  r.readAsText(file);
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================
function notificar(titulo, corpo) {
  if (!DB.config.notificar || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') new Notification(titulo, { body: corpo });
    else if (Notification.permission === 'default') Notification.requestPermission().then(p => { if (p === 'granted') new Notification(titulo, { body: corpo }); });
  } catch (e) {}
}
function avisosIniciais() {
  const hoje = hojeISO();
  const aulasHoje = DB.aulas.filter(a => a.data === hoje && a.status === 'agendada').sort(porDataHora);
  const atr = DB.pagamentos.filter(p => statusPag(p) === 'atrasado');
  if (aulasHoje.length) {
    notificar(`📅 ${plural(aulasHoje.length, 'aula')} hoje`, aulasHoje.map(a => `${a.hora} · ${nomesAula(a)} — ${a.tema}`).join('\n'));
    toast(`📅 Você tem ${plural(aulasHoje.length, 'aula')} hoje`, 'info');
  }
  if (atr.length) notificar('💸 Pagamentos em atraso', `${plural(atr.length, 'parcela')} somando ${fmtBRL(soma(atr, p => p.valor))}`);
}
const _avisadas = new Set();
function checarLembretes() {
  const agora = Date.now();
  DB.aulas.forEach(a => {
    if (a.status !== 'agendada' || _avisadas.has(a.id)) return;
    const diff = dataHora(a).getTime() - agora;
    if (diff > 0 && diff <= 15 * 60000) {
      _avisadas.add(a.id);
      const min = Math.ceil(diff / 60000);
      notificar(`⏰ Aula em ${min} min`, `${a.hora} · ${nomesAula(a)}\n${a.tema}`);
      toast(`⏰ Aula com ${nomesAula(a)} começa em ${min} min`, 'info');
    }
  });
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, tipo = 'success') {
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.textContent = msg;
  $('toastbox').appendChild(t);
  setTimeout(() => t.remove(), tipo === 'error' ? 5000 : 3000);
}

// ============================================================
// INIT
// ============================================================
function algumModalAberto() { return !!document.querySelector('.overlay.open'); }

// No celular as tabelas viram cartões: cada célula ganha o nome da coluna
function rotularTabelas() {
  document.querySelectorAll('table').forEach(t => {
    const hs = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
    t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
      if (hs[i] && td.getAttribute('data-label') !== hs[i]) td.setAttribute('data-label', hs[i]);
    }));
  });
}
function toggleMais(forcar) {
  const m = $('mais-menu');
  m.classList.toggle('open', forcar === undefined ? !m.classList.contains('open') : forcar);
}
async function registrarSW() {
  if (location.protocol !== 'https:' || !('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('sw.js'); } catch (e) {}
}

// ── Sessão: depois de 4 h sem usar, pede a senha de novo ──────────
const SESSAO_MS = 4 * 60 * 60 * 1000;
let _bloqueado = false, _ultimaMarca = 0;
function lerAtividade() { try { return +(localStorage.getItem('mentorias-atividade') || 0); } catch (e) { return 0; } }
function marcarAtividade(forcar) {
  if (_bloqueado || !SYNC.token) return;
  const agora = Date.now();
  if (!forcar && agora - _ultimaMarca < 60000) return;
  _ultimaMarca = agora;
  try { localStorage.setItem('mentorias-atividade', String(agora)); } catch (e) {}
}
function sessaoExpirada() { const t = lerAtividade(); return !!t && Date.now() - t > SESSAO_MS; }
async function verificarSessao() {
  if (_bloqueado || !SYNC.token || !sessaoExpirada()) return;
  await bloquear();
}
async function bloquear() {
  _bloqueado = true;
  document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
  if (!window.api) {
    // iPhone: esquece o token (os dados locais ficam e sincronizam no próximo login)
    await guardarToken('');
    try { sessionStorage.setItem('mentorias-expirou', '1'); } catch (e) {}
    location.reload();
    return;
  }
  mostrarLogin('Sessão expirada · digite a senha');
}
// Computador: confere a senha pelo acesso publicado; sem internet, usa a conferência guardada aqui
async function hashSenha(senha, saltB64) {
  const salt = saltB64 ? b64ParaBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, 256);
  return { salt: bytesParaB64(salt), hash: bytesParaB64(new Uint8Array(bits)) };
}
async function guardarVerificador(usuario, senha) { try { localStorage.setItem('mentorias-verif', JSON.stringify(await hashSenha(credencial(usuario, senha)))); } catch (e) {} }
async function conferirSenhaDesktop(usuario, senha) {
  let acesso = null;
  try { acesso = await buscarAcesso(); } catch (e) {}
  if (acesso) {
    try { await decifrarToken(acesso, usuario, senha); } catch (e) { return false; }
    await guardarVerificador(usuario, senha);
    return true;
  }
  const v = JSON.parse(localStorage.getItem('mentorias-verif') || 'null');
  if (!v) throw new Error('Sem internet para conferir o login — tente de novo em instantes');
  return (await hashSenha(credencial(usuario, senha), v.salt)).hash === v.hash;
}

function mostrarLogin(msg) {
  $('login-msg').textContent = msg || 'Acesso restrito';
  let ultimo = '';
  try { ultimo = localStorage.getItem('mentorias-usuario') || ''; } catch (e) {}
  $('login-usuario').value = ultimo;
  $('login-senha').value = '';
  $('login-erro').textContent = '';
  $('login-screen').style.display = 'flex';
  setTimeout(() => (ultimo ? $('login-senha') : $('login-usuario')).focus(), 300);
}
async function fazerLogin(ev) {
  if (ev) ev.preventDefault();
  const u = $('login-usuario').value.trim(), s = $('login-senha').value;
  if (!u) { $('login-erro').textContent = 'Informe o usuário'; return; }
  if (!s) return;
  const btn = $('login-btn');
  btn.disabled = true; btn.textContent = 'Entrando...';
  $('login-erro').textContent = '';
  try {
    if (window.api) {
      if (!(await conferirSenhaDesktop(u, s))) throw new Error('Usuário ou senha incorretos');
      try { localStorage.setItem('mentorias-usuario', u); } catch (e) {}
      _bloqueado = false;
      $('login-screen').style.display = 'none';
      marcarAtividade(true);
      sincronizar();
      return;
    }
    await entrarComSenha(u, s);
    try { localStorage.setItem('mentorias-usuario', u); } catch (e) {}
    _bloqueado = false;
    marcarAtividade(true);
    $('login-screen').style.display = 'none';
    await iniciarApp();
  } catch (e) {
    $('login-erro').textContent = e.message;
    const card = document.querySelector('.login-card');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  } finally {
    if ($('login-btn')) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
}

async function init() {
  registrarSW();
  document.querySelectorAll('[data-page]').forEach(n => n.addEventListener('click', () => { toggleMais(false); ir(n.dataset.page); }));
  new MutationObserver(() => rotularTabelas()).observe(document.body, { childList: true, subtree: true });
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => marcarAtividade(), { passive: true }));
  await carregarToken();
  let expirou = false;
  try { expirou = sessionStorage.getItem('mentorias-expirou') === '1'; sessionStorage.removeItem('mentorias-expirou'); } catch (e) {}
  if (EM_PAGES && SYNC.token && sessaoExpirada()) { await guardarToken(''); expirou = true; }
  if (EM_PAGES && !SYNC.token) { mostrarLogin(expirou ? 'Sessão expirada · digite a senha' : ''); return; }
  $('login-screen').style.display = 'none';
  const travar = window.api && SYNC.token && sessaoExpirada();
  await iniciarApp();
  if (travar) bloquear(); else marcarAtividade(true);
}

async function iniciarApp() {
  await carregar();
  document.querySelectorAll('.overlay').forEach(el => {
    let downNoFundo = false;
    el.addEventListener('mousedown', e => { downNoFundo = e.target === el; });
    el.addEventListener('click', e => { if (e.target === el && downNoFundo) fecharOverlay(el.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const abertos = [...document.querySelectorAll('.overlay.open')].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
    if (abertos.length) fecharOverlay(abertos[0].id);
  });
  $('al-programa').addEventListener('change', onProgramaAlunoChange);
  $('al-plataforma').addEventListener('change', onPlataformaAlunoChange);
  $('al-inicio').addEventListener('change', onInicioAlunoChange);
  $('ga-duracao').addEventListener('input', previewGerarAulas);
  ['gp-n', 'gp-total'].forEach(i => $(i).addEventListener('change', previewGerarParcelas));
  window.addEventListener('resize', () => { if (!algumModalAberto()) renderTudo(); });

  if (!DB._savedAt) { DB._savedAt = Date.now(); gravarLocal(); } // primeira execução: grava o arquivo com o programa modelo
  ir('dashboard');
  renderSyncStatus();
  if (SYNC.token) await sincronizar();
  setTimeout(avisosIniciais, 1500);
  checarLembretes();
  setInterval(() => {
    checarLembretes();
    renderSidebar();
    if (!algumModalAberto() && paginaAtual === 'dashboard') renderTudo();
  }, 60000);
  // Busca alterações do outro aparelho: a cada 15 s com o app aberto, e ao voltar para ele
  setInterval(() => { if (SYNC.token && document.visibilityState === 'visible') sincronizar(); }, 15000);
  setInterval(verificarSessao, 60000);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    await verificarSessao(); // voltou ao app depois de muito tempo → pede a senha antes de tudo
    if (SYNC.token) sincronizar();
  });
  window.addEventListener('online', () => { if (SYNC.token) sincronizar(); });
  window.addEventListener('focus', () => { if (SYNC.token && !_bloqueado) sincronizar(); }); // voltou para a janela do app
}

init();
