"""Contenu pédagogique des pages."""

from __future__ import annotations

from fastapi import APIRouter

from mlops.content.pages import PHASES, serialize_pages

router = APIRouter(tags=["content"])


@router.get("/content/pages")
def get_pages():
    return {"pages": serialize_pages(), "phases": PHASES}
