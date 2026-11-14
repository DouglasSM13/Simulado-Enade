"""Leitura do banco de questões (arquivo JSON) e consultas em memória."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Iterable, Optional

from .schemas import Contagem, Filtros, QuestaoPublica

DIR_DADOS = Path(__file__).parent / "dados"
DIR_FIGURAS = DIR_DADOS / "figuras"
ARQ_QUESTOES = DIR_DADOS / "questoes.json"

ORDEM_PROVA = {"CC": 0, "SI": 1, "UDF": 2}
NOME_PROVA = {
    "CC": "Ciência da Computação – Bacharelado",
    "SI": "Sistemas de Informação – Bacharelado",
    "UDF": "Treino UDF (não oficial)",
}
CAMPOS_PRIVADOS = {"gabarito", "comentario"}


def _chave_ordem(q: dict) -> tuple:
    n = q.get("numero")
    num = (0, n) if isinstance(n, int) else (1, str(n or ""))
    return (-(q.get("ano") or 0), ORDEM_PROVA.get(q["prova"], 9), num)


class Repositorio:
    def __init__(self, arquivo: Path = ARQ_QUESTOES) -> None:
        bruto = json.loads(arquivo.read_text(encoding="utf-8"))
        self.versao: str = bruto.get("versao", "")
        self._questoes: list[dict] = sorted(bruto["questoes"], key=_chave_ordem)
        self._por_id = {q["id"]: q for q in self._questoes}

    @property
    def total(self) -> int:
        return len(self._questoes)

    def por_id(self, qid: str) -> Optional[dict]:
        return self._por_id.get(qid)

    def buscar(
        self,
        anos: Iterable[int] = (),
        provas: Iterable[str] = (),
        disciplina: Optional[str] = None,
        oficial: Optional[bool] = None,
    ) -> list[dict]:
        anos, provas = set(anos), set(provas)
        res = []
        for q in self._questoes:
            if provas and q["prova"] not in provas:
                continue
            # o filtro de ano só se aplica às questões oficiais (treino não tem edição)
            if anos and q["oficial"] and q["ano"] not in anos:
                continue
            if disciplina and q["disciplina"] != disciplina:
                continue
            if oficial is not None and q["oficial"] != oficial:
                continue
            res.append(q)
        return res

    @staticmethod
    def publica(q: dict) -> QuestaoPublica:
        return QuestaoPublica(**{k: v for k, v in q.items() if k not in CAMPOS_PRIVADOS})

    def filtros(self) -> Filtros:
        anos = Counter(q["ano"] for q in self._questoes if q["oficial"])
        provas = Counter(q["prova"] for q in self._questoes)
        discs = Counter(q["disciplina"] for q in self._questoes)
        return Filtros(
            anos=[Contagem(valor=str(a), rotulo=f"ENADE {a}", total=n) for a, n in sorted(anos.items(), reverse=True)],
            provas=[
                Contagem(valor=p, rotulo=NOME_PROVA[p], total=provas[p])
                for p in sorted(provas, key=lambda p: ORDEM_PROVA[p])
            ],
            disciplinas=[Contagem(valor=d, rotulo=d, total=n) for d, n in sorted(discs.items(), key=lambda x: x[0].casefold())],
            total_oficiais=sum(1 for q in self._questoes if q["oficial"]),
        )
