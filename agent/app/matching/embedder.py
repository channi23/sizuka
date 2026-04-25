import asyncio
import numpy as np
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


async def embed(texts: list[str]) -> np.ndarray:
    return await asyncio.to_thread(_encode, texts)


def _encode(texts: list[str]) -> np.ndarray:
    return _get_model().encode(texts, normalize_embeddings=True)
