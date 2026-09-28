# Text-Guided Grounding (Qwen2.5-VL LoRA)

Returns pixel bounding boxes for objects named in a natural-language query
(for example, "Find all vehicles."). The base model is
`Qwen/Qwen2.5-VL-3B-Instruct` with a PEFT LoRA adapter.

## Files

| File | Purpose |
|---|---|
| `Grounding.ipynb` | LoRA fine-tuning and evaluation (Colab) |
| `satquery_grounding_inference.py` | Deployable inference. `GroundingPredictor(adapter_dir=...)` with `predict_*` methods that return JSON-serializable results. Also runs as a CLI. |
| `requirements.txt` | Standalone dependencies (includes `bitsandbytes`, `qwen-vl-utils`) |

## Requirements

- **A CUDA GPU is required.** There is no CPU path.
- Internet access on first run, or a local Hugging Face copy of the base model.
- The adapter at `models/grounding-lora/` (tracked with Git LFS).

## Usage

```python
from satquery_grounding_inference import GroundingPredictor

predictor = GroundingPredictor(adapter_dir="models/grounding-lora")
result = predictor.predict_file(image_path="scene.jpg", query="Find all vehicles.")
```

## Backend integration

`backend/app/tools/grounding_client.py` adds this directory to `sys.path` and
imports the module lazily. It passes `GROUNDING_ADAPTER_DIR` (default
`models/grounding-lora`) as the adapter path.
