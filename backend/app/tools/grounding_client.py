"""Bridge to satquery_grounding_inference.py (Qwen2.5-VL-3B + the grounding
LoRA adapter at latest_adapter/ in the repo root), mirroring qwen_client.py's
role for the VQA backend.

The import of `satquery_grounding_inference` (and the model load it
triggers) is deferred into a function so a server that never calls
text_guided_grounding never pays the cost of loading a second ~3B-parameter
model — and so importing this module on a machine without a CUDA GPU doesn't
crash: GroundingPredictor itself requires CUDA (no CPU path, unlike the VQA
adapter), and that check only runs when grounding is actually invoked.
"""
from __future__ import annotations

import sys
from functools import lru_cache

from PIL.Image import Image

from app.config import REPO_ROOT, get_settings
from app.exceptions import UpstreamModelError


@lru_cache
def _inference_module():
    path = str(REPO_ROOT)
    if path not in sys.path:
        sys.path.insert(0, path)
    import satquery_grounding_inference as grounding_inference  # noqa: PLC0415 - deferred: loads a 3B model on first call

    return grounding_inference


@lru_cache
def _predictor():
    module = _inference_module()
    settings = get_settings()
    try:
        return module.GroundingPredictor(adapter_dir=settings.grounding_adapter_dir)
    except (OSError, FileNotFoundError, RuntimeError) as exc:
        raise UpstreamModelError(f"Grounding LoRA adapter could not be loaded: {exc}") from exc


def run_grounding(image: Image, query: str) -> dict:
    try:
        predictor = _predictor()
        return predictor.predict_pil(image, query, include_annotated_image=True)
    except (OSError, FileNotFoundError, RuntimeError) as exc:
        raise UpstreamModelError(f"Grounding inference failed: {exc}") from exc
