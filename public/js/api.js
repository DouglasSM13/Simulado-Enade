// Cliente da API do banco de questões.
export const API_URL = (window.ENADE_CONFIG?.API_URL || "").replace(/\/$/, "");

async function pedir(caminho, opcoes = {}) {
  const r = await fetch(API_URL + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  if (!r.ok) {
    let msg = `Erro ${r.status}`;
    try { msg = (await r.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  filtros: () => pedir("/api/filtros"),
  questoes: () => pedir("/api/questoes?por_pagina=500").then((p) => p.itens),
  responder: (id, alternativa) =>
    pedir(`/api/questoes/${encodeURIComponent(id)}/resposta`, {
      method: "POST",
      body: JSON.stringify({ alternativa }),
    }),
  gabarito: (id) => pedir(`/api/questoes/${encodeURIComponent(id)}/gabarito`),
};

// As figuras vêm com o marcador {API} no HTML; troca pelo endereço real da API.
export const comFiguras = (html) => (html || "").replaceAll("{API}", API_URL);
