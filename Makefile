.PHONY: help install backend-install backend-dev backend-test \
	frontend-install frontend-dev frontend-build frontend-test frontend-lint frontend-format \
	test docker-build docker-run

DOCKER_IMAGE := neuro-balance-sprint

help:
	@echo "Targets:"
	@echo "  install           - install backend + frontend dependencies"
	@echo "  backend-install   - uv sync (backend)"
	@echo "  backend-dev       - run FastAPI backend with reload"
	@echo "  backend-test      - run backend pytest suite"
	@echo "  frontend-install  - bun install (frontend)"
	@echo "  frontend-dev      - run Vite dev server"
	@echo "  frontend-build    - build frontend for production"
	@echo "  frontend-test     - run frontend vitest suite"
	@echo "  frontend-lint     - run eslint"
	@echo "  frontend-format   - run prettier --write"
	@echo "  test              - run backend + frontend test suites"
	@echo "  docker-build      - build the combined backend+frontend image"
	@echo "  docker-run        - run that image (http://localhost:8000, SQLite persisted to a named volume)"

install: backend-install frontend-install

backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload

backend-test:
	cd backend && uv run pytest

frontend-install:
	cd frontend && bun install

frontend-dev:
	cd frontend && bun run dev

frontend-build:
	cd frontend && bun run build

frontend-test:
	cd frontend && bun run test

frontend-lint:
	cd frontend && bun run lint

frontend-format:
	cd frontend && bun run format

test: backend-test frontend-test

docker-build:
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	docker run --rm -p 8000:8000 -v neurosprint-data:/data $(DOCKER_IMAGE)
