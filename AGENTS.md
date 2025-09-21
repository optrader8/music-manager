# Repository Guidelines

Follow these conventions to keep contributions aligned with the Music Manager architecture.

## Project Structure & Module Organization
- `backend/app` hosts FastAPI code: routers in `api`, shared config in `core`, models in `db`, business logic in `services`, and helpers in `utils`.
- `frontend/src` contains the client; place shared UI in `components`, route screens in `pages`, data hooks in `hooks`, API calls in `services`, and types in `types`.
- Commit docs to `docs/`, infrastructure to `docker-compose.yml`, and operational templates to `.optimal/`. Media stays mounted at `/mnt/nas-music` and out of Git.

## Build, Test, and Development Commands
- Inside `backend/`: `python -m venv venv && source venv/bin/activate` then `pip install -r requirements.txt`.
- Launch the API with `uvicorn main:app --reload --host 0.0.0.0 --port 8000` and inspect Swagger at `/docs`.
- In `frontend/`, run `npm install` once, then `npm run dev` to serve the Vite app on port 3000.
- Use `docker-compose up -d` for an end-to-end stack when validating integrations.

## Coding Style & Naming Conventions
- Python follows PEP 8 and Black; keep 4-space indentation, explicit imports, and typed signatures across service boundaries.
- TypeScript uses ESLint + Prettier; keep 2-space indentation, PascalCase components, camelCase utilities, and `use`-prefixed hooks.
- Organize routers under `backend/app/api` with filenames that mirror resource domains and align response models with schemas in `backend/app/db`.

## Testing Guidelines
- Run `pytest` within `backend/`, mirroring package paths under `backend/tests/` with names like `test_services_library.py`.
- Execute `npm test` in `frontend/`; colocate specs as `ComponentName.test.tsx` or `hookName.test.ts` alongside the source.
- Stub SSHFS and Dejavu integrations to avoid touching the live `/mnt/nas-music` mount in automated runs.

## Commit & Pull Request Guidelines
- Adopt Conventional Commits (`feat:`, `fix:`, etc.) and include a scope such as `backend`, `frontend`, or `infra`.
- Summarize the problem, solution, and linked issues in each PR; attach screenshots or API diffs when behavior changes.
- Verify `pytest`, `npm test`, and linting locally before requesting review, and note any intentional skips in the PR body.

## Environment & Access Notes
- Keep `.env` files local; document required keys (`MUSIC_LIBRARY_PATH`, `DATABASE_URL`, `SECRET_KEY`) in `docs/` instead of committing secrets.
- Mount the remote library via SSHFS to `/mnt/nas-music` before manual QA and scrub credentials from shared logs.
