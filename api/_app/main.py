"""API do Banco de Questões ENADE (Ciência da Computação / Sistemas de Informação).

Na Vercel, este app roda como função Python em /api/*; o site estático fica em /public.
O gabarito e o comentário ficam apenas no servidor: a listagem devolve as questões
sem a resposta, e a correção é feita pela rota POST /api/questoes/{id}/resposta.
"""
from __future__ import annotations

import os
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .repositorio import Repositorio
from .schemas import Correcao, Filtros, Gabarito, PaginaQuestoes, QuestaoPublica, RespostaEnviada

repo = Repositorio()

app = FastAPI(
    title="Banco de Questões ENADE — API",
    version="1.0.0",
    description="Questões oficiais do ENADE (INEP) de Computação, com correção e gabarito comentado.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

# Front e API ficam no mesmo domínio na Vercel, então CORS não é necessário.
# Só é ativado se você definir CORS_ORIGINS (ex.: front hospedado em outro lugar).
_origens = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if _origens:
    app.add_middleware(CORSMiddleware, allow_origins=_origens, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.get("/api/saude", tags=["sistema"])
def saude() -> dict:
    return {"status": "ok", "questoes": repo.total, "versao_dados": repo.versao}


@app.get("/api/filtros", response_model=Filtros, tags=["questões"])
def filtros() -> Filtros:
    """Valores disponíveis para os filtros, com a contagem de questões de cada um."""
    return repo.filtros()


@app.get("/api/questoes", response_model=PaginaQuestoes, tags=["questões"])
def listar(
    ano: list[int] = Query(default=[], description="Uma ou mais edições, ex.: ano=2021&ano=2017"),
    prova: list[Literal["CC", "SI", "UDF"]] = Query(default=[], description="CC, SI ou UDF"),
    disciplina: Optional[str] = None,
    oficial: Optional[bool] = None,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=200, ge=1, le=500),
) -> PaginaQuestoes:
    """Lista questões **sem gabarito**, das mais recentes para as mais antigas."""
    itens = repo.buscar(anos=ano, provas=prova, disciplina=disciplina, oficial=oficial)
    inicio = (pagina - 1) * por_pagina
    return PaginaQuestoes(
        total=len(itens),
        pagina=pagina,
        por_pagina=por_pagina,
        itens=[repo.publica(q) for q in itens[inicio : inicio + por_pagina]],
    )


@app.get("/api/questoes/{qid}", response_model=QuestaoPublica, tags=["questões"])
def obter(qid: str) -> QuestaoPublica:
    return repo.publica(_ou_404(qid))


@app.post("/api/questoes/{qid}/resposta", response_model=Correcao, tags=["correção"])
def responder(qid: str, corpo: RespostaEnviada) -> Correcao:
    """Corrige a alternativa enviada e devolve o gabarito com o comentário."""
    q = _ou_404(qid)
    if q["discursiva"]:
        raise HTTPException(422, "Questão discursiva: consulte GET /api/questoes/{id}/gabarito.")
    letras = {a["letra"] for a in q["alternativas"]}
    if corpo.alternativa not in letras:
        raise HTTPException(422, f"Alternativa inválida. Use uma de: {', '.join(sorted(letras))}.")
    return Correcao(
        id=qid,
        alternativa=corpo.alternativa,
        correta=corpo.alternativa == q["gabarito"],
        gabarito=q["gabarito"],
        oficial=q["oficial"],
        comentario=q["comentario"],
    )


@app.get("/api/questoes/{qid}/gabarito", response_model=Gabarito, tags=["correção"])
def gabarito(qid: str) -> Gabarito:
    """Gabarito e comentário sem registrar resposta (discursivas e 'mostrar mesmo assim')."""
    q = _ou_404(qid)
    return Gabarito(id=qid, gabarito=q["gabarito"], oficial=q["oficial"], comentario=q["comentario"])


def _ou_404(qid: str) -> dict:
    q = repo.por_id(qid)
    if q is None:
        raise HTTPException(404, f"Questão {qid} não encontrada.")
    return q
