"""Ponto de entrada da função Python na Vercel (atende /api/*).

A Vercel procura uma variável `app` (ASGI) neste arquivo.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _app.main import app  # noqa: E402

__all__ = ["app"]
