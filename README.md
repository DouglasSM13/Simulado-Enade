# Banco de Questões ENADE — Computação

Banco de questões para preparação para o ENADE, com questões oficiais do INEP (Ciência da Computação – Bacharelado 2014, 2017 e 2021; Sistemas de Informação – Bacharelado 2021) e questões de treino do repositório *ENADE-2026-Treinamento-UDF*.

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

## 🎯 Para que serve

Treinar para o ENADE de Computação com questões reais de provas anteriores, do jeito que elas caíram, e acompanhar o próprio desempenho enquanto estuda.

## 📚 O que tem no banco

- **110 questões** de **19 disciplinas**, como algoritmos, banco de dados, redes, sistemas operacionais, engenharia de software e inteligência artificial.
- **87 questões oficiais do INEP**:
  - Ciência da Computação 2021: 27 questões
  - Ciência da Computação 2017: 27 questões
  - Ciência da Computação 2014: 20 questões
  - Sistemas de Informação 2021: 13 questões
- **23 questões de treino** do repositório da Profª Kadidja Valéria (UDF).

## ✨ Como funciona

- ✅ **Responda e veja na hora** se acertou ou errou.
- 💡 **Gabarito comentado** em cada questão, explicando o porquê da resposta.
- ▶️ **Videoaula** gratuita em português sobre o assunto de cada questão.
- 🔎 **Filtros** por ano, prova, disciplina e situação (não resolvidas, certas ou erradas).
- ✂️ **Riscar alternativas** que você já descartou, como na prova em papel.
- 📝 **Anotações** pessoais em cada questão.
- 📊 **Percentual de acerto** atualizado conforme você responde.
- 🌙 **Tema claro e escuro.**

Seu progresso fica salvo no seu próprio navegador. Não é preciso criar conta, e cada pessoa tem o próprio histórico.

## 📝 Sobre o conteúdo

- Os enunciados e as alternativas das questões oficiais seguem os cadernos do INEP, e os gabaritos foram conferidos com os gabaritos definitivos.
- Textos de apoio retirados de livros e artigos aparecem resumidos, com a referência.
- Questões anuladas pelo INEP ou com gabarito controverso não foram incluídas.
- Os comentários dos gabaritos são explicações próprias, não do INEP.
- As videoaulas são de canais de terceiros no YouTube.

## 🙏 Créditos e Fonte

- Provas e gabaritos: **INEP**, Exame Nacional de Desempenho dos Estudantes (ENADE).
- Fonte: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enade/provas-e-gabaritos
- Questões de treino: repositório [ENADE-2026-Treinamento-UDF](https://github.com/Kadidjah/ENADE-2026-Treinamento-UDF), da **Profª Kadidja Valéria (UDF)**.

Bons estudos e boa prova! 🍀
