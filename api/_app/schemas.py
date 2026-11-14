from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Alternativa(BaseModel):
    letra: str
    texto: str


class QuestaoPublica(BaseModel):
    """Questão como o aluno a vê: sem gabarito nem comentário."""

    id: str
    prova: str
    prova_nome: str
    oficial: bool
    ano: Optional[int] = None
    numero: Optional[int | str] = None
    aula: Optional[int] = None
    discursiva: bool
    disciplina: str
    assunto: str
    texto_base: Optional[str] = None
    fonte_texto_base: Optional[str] = None
    enunciado: str
    alternativas: list[Alternativa]


class PaginaQuestoes(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    itens: list[QuestaoPublica]


class Contagem(BaseModel):
    valor: str
    rotulo: str
    total: int


class Filtros(BaseModel):
    anos: list[Contagem]
    provas: list[Contagem]
    disciplinas: list[Contagem]
    total_oficiais: int


class RespostaEnviada(BaseModel):
    alternativa: str = Field(pattern="^[A-E]$", description="Letra marcada, de A a E")


class Correcao(BaseModel):
    id: str
    alternativa: str
    correta: bool
    gabarito: str
    oficial: bool
    comentario: str


class Gabarito(BaseModel):
    id: str
    gabarito: Optional[str]
    oficial: bool
    comentario: str
