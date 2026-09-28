# Model Artifacts

Trained weights and adapter configs used by the backend. Code lives in
[`../ml/`](../ml). This directory holds artifacts only.

| Directory | Contents | Base model | In git |
|---|---|---|---|
| `change-detection/` | `unified_changenet_best.pt` (~40 MB) | Custom UnifiedChangeNet | ❌ not tracked |
| `vqa-lora/` | PEFT LoRA adapter (r=16, α=32), tokenizer, processor, training state | `Qwen/Qwen2.5-VL-3B-Instruct` | configs ✅, `adapter_model.safetensors` (~142 MB) ❌ |
| `grounding-lora/` | PEFT LoRA adapter (r=16, α=32), tokenizer, processor | `Qwen/Qwen2.5-VL-3B-Instruct` | ✅ all files; weights via **Git LFS** |

## Getting the weights

1. **Grounding adapter**: run `git lfs install` before cloning, or
   `git lfs pull` afterwards.
2. **Change-detection checkpoint**: get `unified_changenet_best.pt` from the
   team and place it at `models/change-detection/unified_changenet_best.pt`.
   It is required for every `change_vqa` request and for the backend's
   integration tests.
3. **VQA adapter weights**: needed only for `VQA_BACKEND=qwen`. Place
   `adapter_model.safetensors` in `models/vqa-lora/`.

The base model `Qwen/Qwen2.5-VL-3B-Instruct` downloads automatically from
the Hugging Face Hub the first time it's used.

## Overriding locations

The backend reads these paths from `backend/.env`:

```bash
CHANGE_CHECKPOINT_PATH=/abs/path/to/unified_changenet_best.pt
GROUNDING_ADAPTER_DIR=/abs/path/to/grounding-lora
```

The VQA adapter path is fixed in `ml/vqa/inference.py` (`MODEL_DIR`).

## Policy

- `*.pt`, `*.pth`, `*.safetensors`, `*.onnx` are gitignored by default.
- Weights that must be versioned go through **Git LFS** (see `.gitattributes`)
  and need an explicit `!path` exception in `.gitignore`.
