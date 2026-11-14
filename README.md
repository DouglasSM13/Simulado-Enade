# Banco de Questões ENADE — Computação

Banco de questões para preparação para o ENADE, com questões oficiais do INEP (Ciência da Computação – Bacharelado 2014, 2017 e 2021; Sistemas de Informação – Bacharelado 2021) e questões de treino do repositório *ENADE-2026-Treinamento-UDF*.

Pronto para subir no GitHub e publicar na Vercel: o site estático fica em `public/` e a API em FastAPI roda como função Python em `api/`, no mesmo domínio.

```
enade-banco/
├── api/
│   ├── index.py              entrada da função Python na Vercel (atende /api/*)
│   └── _app/
│       ├── main.py           rotas da API (FastAPI)
│       ├── repositorio.py    leitura do JSON e filtros
│       ├── schemas.py        modelos Pydantic
│       └── dados/questoes.json
├── public/                   site estático (servido pela CDN da Vercel)
│   ├── index.html
│   ├── css/styles.css
│   ├── js/ (config.js, api.js, tema.js, app.js)
│   └── figuras/              figuras recortadas dos cadernos oficiais
├── tests/test_api.py
├── dev.py                    servidor local que imita a Vercel
├── vercel.json
├── requirements.txt          dependências usadas na Vercel
└── requirements-dev.txt      dependências para rodar e testar localmente
```

## Publicar (GitHub + Vercel)

### 1. Subir para o GitHub

Crie um repositório vazio no GitHub (sem README, sem .gitignore) e, dentro desta pasta:

```bash
git init
git add .
git commit -m "Banco de questões ENADE"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/enade-banco.git
git push -u origin main
```

### 2. Importar na Vercel

1. Entre em <https://vercel.com> com a sua conta do GitHub.
2. **Add New… → Project** e escolha o repositório `enade-banco`.
3. Nas configurações do projeto, deixe:
   - **Framework Preset:** `Other` (se a Vercel sugerir *FastAPI*, também funciona);
   - **Root Directory:** `./`;
   - **Build Command** e **Install Command:** vazios (padrão);
   - **Output Directory:** vazio (a Vercel usa `public/` automaticamente).
4. Clique em **Deploy**.

Em cerca de um minuto o site fica disponível em `https://enade-banco-xxxx.vercel.app`. É esse endereço que você manda para os amigos. Cada novo `git push` na branch `main` publica de novo automaticamente.

### 3. Conferir

- `https://SEU-PROJETO.vercel.app/` → o banco de questões
- `https://SEU-PROJETO.vercel.app/api/saude` → deve responder `{"status":"ok", ...}`
- `https://SEU-PROJETO.vercel.app/api/docs` → documentação da API

Se a página abrir mas mostrar "A API não respondeu", veja na Vercel: **Project → Deployments → (último deploy) → Functions / Logs** da função `api/index.py`.

## Rodar no computador

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
python dev.py                      # http://localhost:8000
pytest -q                          # testes da API
```

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/saude` | status e total de questões |
| GET | `/api/filtros` | edições, provas e disciplinas, com contagens |
| GET | `/api/questoes` | lista **sem gabarito**; filtros: `ano` (repetível), `prova` (`CC`, `SI`, `UDF`), `disciplina`, `oficial`, `pagina`, `por_pagina` |
| GET | `/api/questoes/{id}` | uma questão, sem gabarito |
| POST | `/api/questoes/{id}/resposta` | corpo `{"alternativa": "A"}` → `{correta, gabarito, comentario}` |
| GET | `/api/questoes/{id}/gabarito` | gabarito e comentário (discursivas e "mostrar mesmo assim") |

IDs: `ANO-PROVA-NÚMERO` (ex.: `2021-CC-20`, `2021-SI-09`, `2021-CC-D5` para discursivas) e `UDF-NNN` para as questões de treino.

O gabarito fica só no servidor. O progresso de cada pessoa (respostas, alternativas riscadas e anotações) fica salvo no navegador dela (`localStorage`), então a API não precisa de banco de dados e cada amigo tem o próprio histórico.

## Sobre o conteúdo

- Comandos, afirmativas e alternativas seguem os cadernos oficiais do INEP; os gabaritos foram conferidos com os gabaritos definitivos.
- Textos-base retirados de livros e artigos de terceiros aparecem **resumidos**, com a referência.
- Figuras criadas para a prova aparecem recortadas do caderno; figuras e imagens reproduzidas de livros ou sites de terceiros aparecem **descritas em texto**.
- Questões anuladas pelo INEP, com gabarito controverso ou que dependem de fotografias de terceiros não foram incluídas.
- Os comentários dos gabaritos são explicações próprias, não do INEP.

Fontes: cadernos de prova e gabaritos definitivos do ENADE (INEP), obtidos em <https://github.com/geacc/enade>; questões de treino de <https://github.com/Kadidjah/ENADE-2026-Treinamento-UDF> (Profª Kadidja Valéria, UDF).
