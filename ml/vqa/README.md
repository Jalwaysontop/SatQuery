# Single-Image VQA (Qwen2.5-VL LoRA)

Fine-tuning and inference for remote-sensing visual question answering on
RGB imagery. The base model is `Qwen/Qwen2.5-VL-3B-Instruct` with a PEFT LoRA
adapter.

## Files

| File | Purpose |
|---|---|
| `Qwen_RGB_Training.ipynb` | LoRA fine-tuning |
| `Validation.ipynb` | Validation-set evaluation |
| `Testing.ipynb` | Test-set evaluation and qualitative checks |
| `inference.py` | Deployable inference. Loads the base model and the adapter from `models/vqa-lora/` on first call. Auto-detects CUDA, MPS, or CPU. |

## Training summary

Taken from `models/vqa-lora/final_training_state.json` and `adapter_config.json`:

| Setting | Value |
|---|---|
| LoRA rank / alpha | 16 / 32 |
| Training records | 86,164 |
| Steps | 500 (effective batch 8, grad accumulation 8) |
| Learning rate / weight decay | 1e-4 / 0.01 |
| Warmup steps | 25 |

## Backend integration

The backend uses this module when `VQA_BACKEND=qwen`, through
`backend/app/tools/qwen_client.py`. That client adds this directory to
`sys.path` and imports `inference` lazily, the first time it's needed.

## Standalone requirements

```bash
pip install -r ml/vqa/requirements.txt
```
