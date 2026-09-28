.DEFAULT_GOAL := help
.PHONY: help install install-backend install-frontend backend frontend test test-backend test-frontend lint build clean

VENV    ?= .venv
PYTHON  ?= $(VENV)/bin/python
PIP     ?= $(VENV)/bin/pip

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Create venv and install backend requirements
	test -d $(VENV) || python3 -m venv $(VENV)
	$(PIP) install -r backend/requirements.txt
	test -f backend/.env || cp backend/.env.example backend/.env

install-frontend: ## Install frontend dependencies
	cd frontend && npm ci

backend: ## Run the API with auto-reload on :8000
	cd backend && ../$(PYTHON) -m uvicorn app.main:app --reload --port 8000

frontend: ## Run the Vite dev server on :5173
	cd frontend && npm run dev

test: test-backend test-frontend ## Run all checks CI runs

test-backend: ## Run backend pytest suite
	cd backend && ../$(PYTHON) -m pytest -v

test-frontend: lint build ## Lint and build the frontend

lint: ## Lint the frontend
	cd frontend && npm run lint

build: ## Production build of the frontend
	cd frontend && npm run build

clean: ## Remove caches and build output
	find . -type d -name __pycache__ -not -path "./$(VENV)/*" -prune -exec rm -rf {} +
	rm -rf backend/.pytest_cache frontend/dist
