"""
Text-guided region grounding — locates objects named in the query and
returns pixel bounding boxes, via `satquery_grounding_inference.py`
(Qwen2.5-VL-3B-Instruct + the SatQuery grounding LoRA adapter, trained in
Grounding.ipynb, weights at latest_adapter/ in the repo root).

Previously out of scope (see caption_tool.py's original rationale): a
general-purpose VLM cannot reliably produce pixel-accurate boxes for
remote-sensing imagery without adaptation. The grounding-trained adapter is
that adaptation, so this is now a dedicated specialist rather than folded
into captioning.
"""
from __future__ import annotations

import base64

from PIL import Image

from app.config import get_settings
from app.exceptions import ValidationFailed
from app.tools.base import Tool, ToolResult
from app.tools.grounding_client import run_grounding
from app.types import InputBundle


def _decode_data_uri(data_uri: str) -> bytes:
    _, _, encoded = data_uri.partition(",")
    return base64.b64decode(encoded)


class TextGuidedGroundingTool(Tool):
    name = "text_guided_grounding"
    description = "Locates objects named in the query and returns pixel bounding boxes on one optical or SAR image."
    requires = ["exactly one single-timestep image (optical_t1 or sar_t1)"]
    domain_adapted = True  # Qwen2.5-VL-3B + LoRA fine-tuned for remote-sensing bounding-box localization

    def run(self, bundle: InputBundle) -> ToolResult:
        image = bundle.single_image
        if image is None:
            raise ValidationFailed("text_guided_grounding requires exactly one single-timestep image.")

        settings = get_settings()
        result = run_grounding(Image.fromarray(image.rgb_preview), bundle.query)

        boxes = result["boxes"]  # xyxy, original-image pixel coordinates
        regions = [
            {
                "region_id": i,
                "bbox_px": [x1, y1, x2 - x1, y2 - y1],
                "centroid_px": [(x1 + x2) / 2, (y1 + y2) / 2],
            }
            for i, (x1, y1, x2, y2) in enumerate(boxes)
        ]

        images = {}
        annotated = result.get("annotated_image_base64")
        if annotated:
            images["grounding_overlay.jpg"] = _decode_data_uri(annotated)

        warnings = []
        if not boxes:
            warnings.append("No objects matching the query were localized in this image.")

        return ToolResult(
            answer=f"Found {len(boxes)} region(s) matching: {bundle.query}",
            regions=regions,
            images=images,
            parameters={
                "backend": "qwen-grounding-lora",
                "model": settings.grounding_model_id,
                "modality": image.modality.value,
                "num_boxes": len(boxes),
                "inference_time_seconds": result["latency_ms"] / 1000.0,
            },
            warnings=warnings,
        )
