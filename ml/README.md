# SatQuery AI — ML

Research and model code behind SatQuery's specialist tools. The backend
imports from these modules directly (see `backend/app/ml_paths.py` and
`backend/app/tools/*_client.py`). Keep their public functions stable.

| Module | What it does | Used by backend tool | Weights |
|---|---|---|---|
| [`change_detection/`](change_detection/) | UnifiedChangeNet optical/SAR/fusion change detection, imaging helpers, Gemini change-VQA | `change_vqa` | `models/change-detection/` |
| [`vqa/`](vqa/) | Qwen2.5-VL-3B LoRA fine-tuning for remote-sensing VQA, plus inference | `single_image_vqa` (`VQA_BACKEND=qwen`) | `models/vqa-lora/` |
| [`grounding/`](grounding/) | Qwen2.5-VL-3B LoRA fine-tuning for bounding-box grounding, plus inference | `text_guided_grounding` | `models/grounding-lora/` |

Each module has its own `requirements.txt` for standalone or notebook use.
`backend/requirements.txt` is a superset of all three, so one install covers
everything when running the API.

## Conventions

- **Notebooks** (`*.ipynb`) hold training, validation, and exploration work.
  They were written for Colab or Kaggle GPUs and may reference those paths.
- **`.py` modules** are the deployable, framework-free inference code. They
  take in-memory inputs (bytes, arrays, PIL images) and never assume a web
  framework.
- **Weights never live here.** They go in [`../models/`](../models/).
