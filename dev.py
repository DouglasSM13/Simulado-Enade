"""Servidor local que imita a Vercel: API em /api/* e o site de /public na raiz.

Uso:
    pip install -r requirements-dev.txt
    python dev.py            # abre em http://localhost:8000
"""
from pathlib import Path

import uvicorn
from fastapi.staticfiles import StaticFiles

from api.index import app

PUBLIC = Path(__file__).parent / "public"
app.mount("/", StaticFiles(directory=PUBLIC, html=True), name="site")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
