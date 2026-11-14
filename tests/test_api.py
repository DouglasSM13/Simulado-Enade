import re
from pathlib import Path

from fastapi.testclient import TestClient

from api.index import app

cli = TestClient(app)
PUBLIC = Path(__file__).resolve().parents[1] / "public"


def test_saude():
    r = cli.get("/api/saude")
    assert r.status_code == 200
    assert r.json()["questoes"] > 0


def test_listagem_nao_expoe_gabarito():
    corpo = cli.get("/api/questoes").json()
    assert corpo["total"] == len(corpo["itens"])
    for q in corpo["itens"]:
        assert "gabarito" not in q and "comentario" not in q


def test_ordem_mais_recente_primeiro():
    itens = cli.get("/api/questoes", params={"oficial": True}).json()["itens"]
    anos = [q["ano"] for q in itens]
    assert anos == sorted(anos, reverse=True)


def test_filtros_combinados():
    itens = cli.get("/api/questoes", params=[("ano", 2021), ("prova", "SI")]).json()["itens"]
    assert itens and all(q["ano"] == 2021 and q["prova"] == "SI" for q in itens)


def test_correcao_certa_e_errada():
    ok = cli.post("/api/questoes/2021-CC-20/resposta", json={"alternativa": "A"}).json()
    assert ok["correta"] is True and ok["gabarito"] == "A" and ok["comentario"]
    errada = cli.post("/api/questoes/2021-CC-20/resposta", json={"alternativa": "B"}).json()
    assert errada["correta"] is False and errada["gabarito"] == "A"


def test_alternativa_invalida():
    assert cli.post("/api/questoes/2021-CC-20/resposta", json={"alternativa": "Z"}).status_code == 422


def test_discursiva_usa_rota_de_gabarito():
    assert cli.post("/api/questoes/2021-CC-D5/resposta", json={"alternativa": "A"}).status_code == 422
    g = cli.get("/api/questoes/2021-CC-D5/gabarito").json()
    assert g["gabarito"] is None and "34, 21, 8, 13, 2, 1, 3, 5" in g["comentario"]


def test_questao_inexistente():
    assert cli.get("/api/questoes/1999-CC-01").status_code == 404


def test_figuras_referenciadas_existem_em_public():
    for q in cli.get("/api/questoes").json()["itens"]:
        html = q["enunciado"] + "".join(a["texto"] for a in q["alternativas"])
        for nome in re.findall(r"\{API\}/figuras/([\w-]+\.webp)", html):
            assert (PUBLIC / "figuras" / nome).exists(), nome
