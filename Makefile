.PHONY: backend-install frontend-install backend-test frontend-test lint

backend-install:
	python -m venv backend/.venv
	backend/.venv/bin/pip install -r backend/requirements.txt -r backend/requirements-dev.txt

frontend-install:
	cd frontend && npm install

backend-test:
	cd backend && pytest

frontend-test:
	cd frontend && npm test

lint:
	cd backend && backend/.venv/bin/ruff check .
	cd frontend && npm run lint
