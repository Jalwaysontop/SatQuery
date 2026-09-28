# SatQuery AI — Backend

FastAPI service that exposes SatQuery's remote-sensing models behind one
agentic HTTP API. It wraps the model code in [`../ml/`](../ml) with:

- a rule-based **agentic task controller** (classify → select → execute → summarize)
- **upload validation** (size, count, extension, band completeness, co-registration)
- **API-key auth** and **rate limiting** (in-process or Redis)
- **auditable execution reports** persisted to SQLite, isolated per API key

For module-level internals see [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Layout

```
backend/
├── app/
│   ├── main.py            # App factory, CORS, lifespan, exception handlers
│   ├── config.py          # All settings (env / .env) — single source of truth
│   ├── security.py        # X-API-Key auth + rate-limit dependency
│   ├── rate_limiter.py    # In-process & Redis sliding-window limiters
│   ├── ingest.py          # Multipart uploads → validated InputBundle
│   ├── sar_ingest.py      # SAR VV/VH GeoTIFF loading
│   ├── services.py        # Orchestration: ingest → agent → response → persist
│   ├── db.py              # SQLite execution records
│   ├── schemas.py         # Public response models (API contract)
│   ├── types.py           # Internal dataclasses
│   ├── exceptions.py      # Error hierarchy → HTTP status mapping
│   ├── ml_paths.py        # Makes ../ml/change_detection importable
│   ├── agent/             # classifier.py · registry.py · controller.py
│   ├── tools/             # vqa · caption · change · fusion · grounding (+ model clients)
│   └── routers/           # analyze · reports · capabilities · health
├── scripts/
│   └── create_api_key.py  # Generates a strong BACKEND_API_KEY
├── tests/                 # pytest suite
├── .env.example           # Configuration template
├── requirements.txt
├── pytest.ini
└── setup.cfg              # flake8 config
```

Runtime data (SQLite DB, rendered report images) is written to
`backend/data/` by default, which is gitignored.

## Setup

From the repository root:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# edit backend/.env: set GEMINI_API_KEY at minimum
```

The change-detection checkpoint must exist at
`models/change-detection/unified_changenet_best.pt` (or wherever
`CHANGE_CHECKPOINT_PATH` points). See [`../models/README.md`](../models/README.md).

## Run

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>
- Health: <http://127.0.0.1:8000/health>

In development (`ENVIRONMENT=development`, the default), requests without an
`X-API-Key` header are allowed. Set `BACKEND_API_KEY` to require auth. You
can generate one with `python scripts/create_api_key.py`. The key is
required outright once `ENVIRONMENT=production`.

## Configuration

Every setting is documented inline in [`.env.example`](.env.example) and
defined in [`app/config.py`](app/config.py). The most important:

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | For Gemini tools | Without it, caption/fusion/VQA-gemini return 502; change-VQA degrades to quantitative-only |
| `BACKEND_API_KEY` | In production | Shared secret for `X-API-Key` |
| `VQA_BACKEND` | No | `gemini` (default) or `qwen` (local fine-tuned model) |
| `CHANGE_DEVICE` | No | `cpu` (default) or `cuda` |
| `REDIS_URL` | No | Enables multi-worker-safe rate limiting |

## API

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness only, not rate-limited |
| `POST` | `/api/v1/analyze` | ✅ | Agentic analysis entry point |
| `GET` | `/api/v1/reports?limit=&offset=` | ✅ | Execution history for the caller's key |
| `GET` | `/api/v1/reports/{id}` | ✅ | Single execution report |
| `GET` | `/api/v1/reports/{id}/images/{name}` | ✅ | Report image (path-traversal hardened) |
| `GET` | `/api/v1/tools` | ✅ | Tool list with live readiness status |

### Task routing

Field names determine which task the controller selects (see
[`app/agent/classifier.py`](app/agent/classifier.py)):

| Uploaded groups | Query | Task |
|---|---|---|
| Any T1 + T2 pair | — | `change_vqa` (fusion mode if both optical & SAR pairs) |
| `optical_t1_files` + `sar_t1_files` | — | `cross_modal_fusion` |
| One T1 image | "find / locate / detect…" (no `?`) | `text_guided_grounding` |
| One T1 image | "describe / caption / summarize…" (no `?`) | `single_image_captioning` |
| One T1 image | anything else | `single_image_vqa` |

### Example request

```bash
S=../ml/change_detection/samples
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H "X-API-Key: $BACKEND_API_KEY" \
  -F "query=What changed between these two dates, and where?" \
  $(for f in $S/t1/*.tif; do printf -- '-F optical_t1_files=@%s ' "$f"; done) \
  $(for f in $S/t2/*.tif; do printf -- '-F optical_t2_files=@%s ' "$f"; done)
```

Optical GeoTIFF uploads must include all 13 Sentinel-2 bands
(B01–B12 + B8A) for each timestep.

### Error format

All handled errors return:

```json
{ "error": "ValidationFailed", "message": "...", "details": { }, "request_id": "..." }
```

Unhandled exceptions return a generic 500. The traceback is logged
server-side and never sent to the client.

## Test

```bash
cd backend
pytest -v
```

- No network access or `GEMINI_API_KEY` needed. Gemini calls are mocked.
- `test_analyze_change_integration.py` and `test_report_isolation.py` run the
  real checkpoint against `ml/change_detection/samples/`. They need
  `models/change-detection/unified_changenet_best.pt` to be present.
- Lint: `pip install flake8 && flake8 app tests` (config in `setup.cfg`).

## Known limitations

- **Grounding requires CUDA.** `ml/grounding/satquery_grounding_inference.py` has no CPU path.
- **First `VQA_BACKEND=qwen` call downloads Qwen2.5-VL-3B** (several GB). If
  the Hugging Face download stalls, set `HF_HUB_DISABLE_XET=1`.
- **The default rate limit (20 req/min)** is easy to hit while browsing saved
  reports in the UI. Raise it in `.env` for local development.
- **The in-process rate limiter** is per worker. Set `REDIS_URL` when running
  multiple workers.
