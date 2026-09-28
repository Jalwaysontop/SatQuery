# Change Detection

Bi-temporal change detection for Sentinel-2 optical, SAR (VV/VH), or fused
optical+SAR imagery, plus Gemini-based natural-language change-VQA.

## Files

| File | Purpose |
|---|---|
| `change_detection_module.py` | Rebuilds the `UnifiedChangeNet` architecture and loads `unified_changenet_best.pt`. Handles patch-based (256px, stride 128) inference, region extraction, and confidence maps. Exposes `load_change_detector()` / `ChangeDetector.predict()`. |
| `pipeline.py` | Framework-free pipeline. Takes uploaded band bytes, stacks the 13 Sentinel-2 bands (`load_optical_bands_from_uploads`), and runs `run_change_detection()`. |
| `imaging.py` | Rendering helpers: `optical_to_rgb`, overlays, confidence map → PIL/PNG. |
| `vqa.py` | Gemini change-VQA prompt (`ask_change_vqa`) and `create_region_summary`. Can also run as an interactive CLI. |
| `samples/t1`, `samples/t2` | Sample Sentinel-2 L1C tiles (tile 31U, 2016-03-15 and 2017-08-29), all 13 bands. Used by the backend's integration tests. |

## Usage

```python
from change_detection.change_detection_module import load_change_detector

detector = load_change_detector(
    "models/change-detection/unified_changenet_best.pt", device="cpu"
)
result = detector.predict(optical_t1=t1, optical_t2=t2, sar_t1=None, sar_t2=None, hw=(600, 600))
```

Inputs are normalized exactly as during training. Optical values are
clipped to `[0, 3000]` and scaled. SAR values are clipped to their
1st–99th percentile. Don't change these constants without retraining.

## Import note

`pipeline.py` imports `change_detection.imaging` (a qualified import), while
`vqa.py` imports `imaging` (a bare import). `backend/app/ml_paths.py` puts
both `ml/` and `ml/change_detection/` on `sys.path` so both styles work.

## Standalone requirements

```bash
pip install -r ml/change_detection/requirements.txt
```
