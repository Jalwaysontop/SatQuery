# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Reorganized the repository into a production layout:
  - `vqa_and_change_using_gemini/` → `ml/change_detection/` (Python package renamed to `change_detection`)
  - `VQA/` → `ml/vqa/`
  - `Bounding_Box/` → `ml/grounding/`
  - `imgs_1/`, `imgs_2/` → `ml/change_detection/samples/t1`, `samples/t2`
  - `final_qwen_lora/` → `models/vqa-lora/`
  - `latest_adapter/` → `models/grounding-lora/`
  - `unified_changenet_best.pt` → `models/change-detection/`
  - `backend/docs/ARCHITECTURE.md` → `docs/ARCHITECTURE.md`
- Updated default model paths in `backend/app/config.py` and module bridges to match the new layout. Application behaviour is unchanged.

### Removed
- Duplicate copies of the grounding notebook and inference script at the repo root.
- Stale `change_detection/` duplicate of the change-detection module.
- Unused `backend/models/latest_adapter/` duplicate (same LFS object, now at `models/grounding-lora/`).

### Added
- Root `README.md` and READMEs for `backend/`, `frontend/`, `ml/` (and each module), and `models/`.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`.
- GitHub Actions CI (backend tests, frontend lint + build), issue/PR templates, Dependabot.
- `Makefile`, `.editorconfig`, `frontend/.env.example`.
- `backend/.env.example` is now tracked (it was previously caught by the `.env.*` ignore rule).
