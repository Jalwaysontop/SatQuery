# Security Policy

## Supported versions

Only the latest commit on `main` receives security fixes.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report privately through
[GitHub Security Advisories](https://github.com/Jalwaysontop/SatQuery/security/advisories/new).
Include:

- a description of the issue and its impact
- steps to reproduce, or a proof of concept
- affected files, endpoints, or configuration

We aim to acknowledge reports within **3 business days** and to send a fix
or mitigation plan within **14 days**.

## Security model (summary)

| Control | Implementation |
|---|---|
| Authentication | Shared-secret `X-API-Key`, compared in constant time (`hmac.compare_digest`). Mandatory when `ENVIRONMENT=production`. |
| Key storage | Keys are never persisted. Reports are scoped by SHA-256 hash of the key. |
| Rate limiting | Per-key sliding window (in-process or Redis). The Redis limiter fails open if Redis is unreachable. |
| Upload validation | Per-file size, file count, extension allow-list, band completeness, co-registration |
| Path safety | Report image route rejects `..`, `/`, `\` and re-checks the resolved path |
| Error handling | Unhandled exceptions return a generic 500. Tracebacks are logged server-side only. |
| CORS | Explicit origin allow-list (`CORS_ALLOW_ORIGINS`) |

## Operator checklist

- [ ] `ENVIRONMENT=production` and a strong `BACKEND_API_KEY` (`python backend/scripts/create_api_key.py`)
- [ ] `ALLOW_NO_AUTH_IN_DEV=false`
- [ ] `CORS_ALLOW_ORIGINS` limited to your real frontend origin(s)
- [ ] `REDIS_URL` set when running more than one worker
- [ ] TLS terminated in front of the API
- [ ] `.env` files and `backend/data/` never committed or publicly served
- [ ] Don't ship `VITE_API_KEY` in a public frontend build. It is visible in the bundle.
