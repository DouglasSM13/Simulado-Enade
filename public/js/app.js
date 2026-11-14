import { api, API_URL, comFiguras } from "./api.js";
import { iniciarTema } from "./tema.js";

const LETRAS = "ABCDE";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- estado ---------- */
let QUESTOES = [];
// progresso do aluno (fica no navegador): resp[id] = {alt, gab, correta}
let estado = { resp: {}, cut: {}, notas: {} };
try {
  const s = JSON.parse(localStorage.getItem("enadeBancoV3") || "null");
  if (s) estado = Object.assign(estado, s);
} catch {}
const salvar = () => { try { localStorage.setItem("enadeBancoV3", JSON.stringify(estado)); } catch {} };

const sel = {};        // alternativa marcada e ainda não enviada
const abertos = {};    // aba aberta em cada questão
const comentarios = {}; // cache de gabarito/comentário vindo da API
const enviando = new Set();
let pagina = 1;
let ordemAleatoria = null;

/* ---------- filtros ---------- */
function montarFiltros(f) {
  $("#fAno").innerHTML = f.anos
    .map((a) => `<label class="chk"><input type="checkbox" value="${a.valor}" checked> ${esc(a.rotulo)}<span class="cnt">${a.total}</span></label>`)
    .join("");
  $("#fProva").innerHTML = f.provas
    .map((p) => `<label class="chk"><input type="checkbox" value="${p.valor}" ${p.valor !== "UDF" ? "checked" : ""}> ${esc(p.rotulo)}<span class="cnt">${p.total}</span></label>`)
    .join("");
  $("#fDisc").innerHTML = `<option value="">Todas as disciplinas</option>` + f.disciplinas.map((d) => `<option>${esc(d.valor)}</option>`).join("");
}

function filtrar() {
  const anos = [...document.querySelectorAll("#fAno input:checked")].map((i) => +i.value);
  const provas = [...document.querySelectorAll("#fProva input:checked")].map((i) => i.value);
  const disc = $("#fDisc").value, st = $("#fStatus").value;
  let l = QUESTOES.filter((q) => {
    if (!provas.includes(q.prova)) return false;
    if (q.oficial && !anos.includes(q.ano)) return false;
    if (disc && q.disciplina !== disc) return false;
    const r = estado.resp[q.id];
    if (st === "nao" && r) return false;
    if (st === "certas" && !(r && r.correta)) return false;
    if (st === "erradas" && !(r && !r.correta)) return false;
    return true;
  });
  if ($("#fOrdem").value === "aleatoria") {
    if (!ordemAleatoria) ordemAleatoria = new Map(QUESTOES.map((q) => [q.id, Math.random()]));
    l = l.slice().sort((a, b) => ordemAleatoria.get(a.id) - ordemAleatoria.get(b.id));
  }
  return l; // a API já entrega na ordem "mais recentes primeiro"
}

/* ---------- videoaula do assunto (só aceita links do YouTube) ---------- */
function video(q) {
  const v = q.video;
  if (!v || !/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.url)) return "";
  return `<a class="q-video" href="${v.url}" target="_blank" rel="noopener noreferrer" title="${esc(v.titulo)}">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>
      <span>Videoaula<span class="q-video-t">: ${esc(v.titulo)}</span></span></a>`;
}

/* ---------- cartão de questão ---------- */
function cartao(q) {
  const r = estado.resp[q.id];
  const resolvida = !!r;
  const cut = estado.cut[q.id] || {};
  const ab = abertos[q.id] || "";
  const tagRes = q.discursiva || !resolvida ? "" : r.correta ? `<span class="tag ok">Acertou</span>` : `<span class="tag bad">Errou</span>`;
  const meta = q.oficial
    ? `<span>Ano: <b>${q.ano}</b></span><span>Banca: <b>INEP</b></span><span>Exame: <b>ENADE</b></span><span>Prova: <b>${esc(q.prova_nome)}</b></span><span>${q.discursiva ? "Questão discursiva" : "Questão"}: <b>${q.discursiva ? String(q.numero).slice(1) : q.numero}</b></span>`
    : `<span>Fonte: <b>Repositório ENADE-2026-Treinamento-UDF</b></span><span>Aula: <b>${q.aula}</b></span><span>Questão autoral de treino, não oficial</span>`;
  const base = q.texto_base
    ? `<div class="base"><div class="lbl">Texto-base (resumo)</div><p>${q.texto_base}</p><div class="fonte">${q.fonte_texto_base || ""}</div></div>`
    : "";
  let corpo = "", acoes = "", panes = "";
  const tabs = `<div class="q-tabs" role="tablist">
      <button type="button" data-tab="com" data-q="${q.id}" aria-expanded="${ab === "com" || ab === "rev"}">${q.discursiva ? "Resposta comentada" : "Gabarito comentado"}</button>
      <button type="button" data-tab="not" data-q="${q.id}" aria-expanded="${ab === "not"}">Minhas anotações</button>${video(q)}</div>`;

  if (q.discursiva) {
    acoes = `<div class="q-actions"><span class="result" style="background:var(--warn-soft);color:var(--warn)">Questão discursiva: responda no papel e depois confira.</span></div>`;
  } else {
    corpo = `<ul class="opts" role="radiogroup" aria-label="Alternativas da questão ${q.id}">` +
      q.alternativas.map(({ letra, texto }) => {
        const idI = `${q.id}-${letra}`;
        let cls = cut[letra] ? " cut" : "";
        if (resolvida && letra === r.gab) cls += " right";
        else if (resolvida && letra === r.alt) cls += " wrong";
        const marcada = resolvida ? r.alt === letra : sel[q.id] === letra;
        return `<li class="opt${cls}">
          <button type="button" class="scis" data-cut="${q.id}" data-l="${letra}" title="Riscar alternativa ${letra}" aria-label="Riscar alternativa ${letra}" ${resolvida ? "disabled" : ""}>✂</button>
          <input type="radio" name="r-${q.id}" id="${idI}" value="${letra}" ${marcada ? "checked" : ""} ${resolvida ? "disabled" : ""}>
          <label for="${idI}"><span class="bub">${letra}</span><span class="txt">${comFiguras(texto)}</span></label></li>`;
      }).join("") + `</ul>`;
    const res = resolvida
      ? r.correta ? `<span class="result ok">Parabéns! Você acertou.</span>` : `<span class="result bad">Você errou. Resposta: ${r.gab}</span>`
      : "";
    const ocupado = enviando.has(q.id);
    acoes = `<div class="q-actions">${resolvida
      ? `<button class="btn" type="button" data-refazer="${q.id}">Refazer</button>`
      : `<button class="btn btn-primary" type="button" data-responder="${q.id}" ${sel[q.id] && !ocupado ? "" : "disabled"}>${ocupado ? "Corrigindo…" : "Responder"}</button>`}${res}</div>`;
  }

  if (ab === "com" || ab === "rev") {
    const c = comentarios[q.id];
    if (!q.discursiva && !resolvida && ab === "com") {
      panes = `<div class="pane"><p>Responda a questão para ver o gabarito comentado.</p><p><button class="btn" type="button" data-revelar="${q.id}">Mostrar mesmo assim</button></p></div>`;
    } else if (!c) {
      panes = `<div class="pane"><p class="hint">Carregando gabarito…</p></div>`;
    } else if (c.erro) {
      panes = `<div class="pane"><p>Não foi possível carregar o gabarito: ${esc(c.erro)}</p></div>`;
    } else {
      const g = c.gabarito ? `<span class="gab">Gabarito${q.oficial ? " oficial (INEP)" : ""}: ${c.gabarito}</span>` : "";
      panes = `<div class="pane">${g}${comFiguras(c.comentario)}</div>`;
    }
  }
  if (ab === "not") {
    panes = `<div class="pane"><label for="n-${q.id}" class="hint">Anotações salvas neste navegador</label><textarea id="n-${q.id}" data-nota="${q.id}" placeholder="Ex.: confundi FIFO com LIFO; revisar escalonamento.">${esc(estado.notas[q.id] || "")}</textarea></div>`;
  }

  return `<article class="q" id="q-${q.id}">
    <div class="q-head"><span class="qid">${q.id}</span><span class="crumb"><b>${esc(q.disciplina)}</b> › ${esc(q.assunto)}</span>${tagRes}<span class="tag ${q.oficial ? "of" : "tr"}">${q.oficial ? "Oficial INEP" : "Treino"}</span></div>
    <div class="q-meta">${meta}</div>
    <div class="q-body">${base}<div class="enun">${comFiguras(q.enunciado)}</div>${corpo}</div>
    ${acoes}${tabs}${panes}</article>`;
}

/* ---------- renderização ---------- */
function render() {
  const lista = filtrar(), per = +$("#fPer").value, tot = Math.max(1, Math.ceil(lista.length / per));
  if (pagina > tot) pagina = tot;
  const parte = lista.slice((pagina - 1) * per, pagina * per);
  $("#rTitle").textContent = `${lista.length} ${lista.length === 1 ? "questão encontrada" : "questões encontradas"}`;
  $("#rMeta").textContent = lista.length ? `Página ${pagina} de ${tot}` : "";
  $("#lista").innerHTML = parte.length ? parte.map(cartao).join("")
    : `<div class="none">Nenhuma questão com esses filtros. Marque outra edição ou prova, ou troque a situação.</div>`;
  let pg = "";
  if (tot > 1) {
    pg += `<button type="button" data-pg="${pagina - 1}" ${pagina === 1 ? "disabled" : ""}>‹ Anterior</button>`;
    for (let i = 1; i <= tot; i++) pg += `<button type="button" data-pg="${i}" ${i === pagina ? 'aria-current="page"' : ""}>${i}</button>`;
    pg += `<button type="button" data-pg="${pagina + 1}" ${pagina === tot ? "disabled" : ""}>Próxima ›</button>`;
  }
  $("#pager").innerHTML = pg;
  desempenho();
}

function desempenho() {
  const ids = new Set(QUESTOES.filter((q) => !q.discursiva).map((q) => q.id));
  const resp = Object.entries(estado.resp).filter(([id]) => ids.has(id));
  const ac = resp.filter(([, r]) => r.correta).length, er = resp.length - ac;
  const pct = resp.length ? Math.round((ac / resp.length) * 100) : 0;
  $("#topStats").innerHTML = `<span><b>${QUESTOES.filter((q) => q.oficial).length}</b>oficiais</span><span><b>${resp.length}</b>resolvidas</span><span><b>${pct}%</b>de acerto</span>`;
  if (!resp.length) { $("#perf").innerHTML = `<p class="empty-perf">Responda algumas questões para ver acertos e erros por disciplina.</p>`; return; }
  const disc = Object.fromEntries(QUESTOES.map((q) => [q.id, q.disciplina]));
  const porD = {};
  resp.forEach(([id, r]) => { const d = (porD[disc[id]] ||= { a: 0, e: 0 }); r.correta ? d.a++ : d.e++; });
  const linhas = Object.entries(porD).sort((x, y) => y[1].a + y[1].e - (x[1].a + x[1].e)).map(([d, v]) => {
    const t = v.a + v.e;
    return `<div class="perf-row"><span>${esc(d)}</span><span>${v.a}/${t}</span><div class="bar" role="img" aria-label="${v.a} acertos e ${v.e} erros"><i class="g" style="width:${(v.a / t) * 100}%"></i><i class="r" style="width:${(v.e / t) * 100}%"></i></div></div>`;
  }).join("");
  $("#perf").innerHTML = `<div class="perf-total"><span><b>${ac}</b> acertos</span><span><b>${er}</b> erros</span><span><b>${pct}%</b></span></div>${linhas}`;
}

async function carregarComentario(id) {
  if (comentarios[id] && !comentarios[id].erro) return;
  try { comentarios[id] = await api.gabarito(id); }
  catch (e) { comentarios[id] = { erro: e.message }; }
  render();
}

/* ---------- eventos ---------- */
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches(".opt input[type=radio]")) {
    const id = t.name.slice(2); sel[id] = t.value;
    const b = document.querySelector(`[data-responder="${CSS.escape(id)}"]`); if (b) b.disabled = false;
    return;
  }
  if (t.closest("#fAno,#fProva") || ["fDisc", "fStatus", "fOrdem", "fPer"].includes(t.id)) {
    if (t.id === "fOrdem") ordemAleatoria = null;
    pagina = 1; render();
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.nota) { estado.notas[t.dataset.nota] = t.value; salvar(); }
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const d = b.dataset;
  if (d.responder) {
    const id = d.responder, alt = sel[id]; if (!alt || enviando.has(id)) return;
    enviando.add(id); render();
    try {
      const c = await api.responder(id, alt);
      estado.resp[id] = { alt, gab: c.gabarito, correta: c.correta };
      comentarios[id] = c; delete sel[id]; abertos[id] = "com"; salvar();
    } catch (err) {
      alert(`Não foi possível corrigir agora: ${err.message}`);
    } finally { enviando.delete(id); render(); }
    return;
  }
  if (d.refazer) { delete estado.resp[d.refazer]; delete estado.cut[d.refazer]; abertos[d.refazer] = ""; salvar(); render(); return; }
  if (d.cut) { const c = (estado.cut[d.cut] ||= {}); c[d.l] = !c[d.l]; salvar(); render(); return; }
  if (d.tab) {
    abertos[d.q] = abertos[d.q] === d.tab || (d.tab === "com" && abertos[d.q] === "rev") ? "" : d.tab;
    const q = QUESTOES.find((x) => x.id === d.q);
    render();
    if (abertos[d.q] === "com" && (q.discursiva || estado.resp[d.q])) carregarComentario(d.q);
    return;
  }
  if (d.revelar) { abertos[d.revelar] = "rev"; render(); carregarComentario(d.revelar); return; }
  if (d.pg) { pagina = +d.pg; render(); document.querySelector("main").scrollIntoView({ block: "start" }); return; }
  if (b.id === "bLimpar") {
    document.querySelectorAll("#fAno input").forEach((i) => (i.checked = true));
    document.querySelectorAll("#fProva input").forEach((i) => (i.checked = i.value !== "UDF"));
    $("#fDisc").value = ""; $("#fStatus").value = "todas"; $("#fOrdem").value = "recente"; pagina = 1; render(); return;
  }
  if (b.id === "bZerar") { estado = { resp: {}, cut: {}, notas: estado.notas }; salvar(); pagina = 1; render(); }
});

/* ---------- início ---------- */
async function iniciar() {
  iniciarTema();
  $("#lista").innerHTML = `<div class="status">Carregando questões…</div>`;
  try {
    const [f, qs] = await Promise.all([api.filtros(), api.questoes()]);
    QUESTOES = qs;
    montarFiltros(f);
    render();
  } catch (e) {
    $("#rTitle").textContent = "Não foi possível carregar o banco de questões";
    $("#lista").innerHTML = `<div class="status erro"><p><b>A API não respondeu</b> em <code>${esc(API_URL || location.origin)}/api</code> (${esc(e.message)}).</p>
      <p>Localmente, rode <code>python dev.py</code> na raiz do projeto e abra <code>http://localhost:8000</code>. Na Vercel, confira os logs da função <code>api/index.py</code>.</p></div>`;
  }
}
iniciar();
