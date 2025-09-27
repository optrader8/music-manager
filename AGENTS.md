# Repository Guidelines

## Project Structure & Module Organization
- `backend/app` encapsulates the FastAPI service: place routers under `api/routes/`, configuration in `core/`, database models in `db/`, business logic in `services/`, and shared helpers in `utils/`.
- `frontend/src` hosts the Vite client: share UI via `components/`, route-level screens in `pages/`, data hooks in `hooks/`, API clients in `services/`, and types in `types/`.
- **File Browser Module**: Backend routes in `api/routes/files.py`, frontend page at `pages/FileBrowserPage.tsx`, file management service in `services/file_service.py`.
- Tests live beside their targets (`frontend/src/components/Button.test.tsx`) or under `backend/tests/` mirroring the package path (`backend/tests/test_services_library.py`).
- Keep docs in `docs/`, feature specs in `.kiro/specs/`, infra assets in `docker-compose.yml`, and operational templates in `.optimal/`; never commit media from `/mnt/nas-music`.

## Build, Test, and Development Commands
- Backend: `python -m venv venv && source venv/bin/activate` then `pip install -r requirements.txt` to bootstrap dependencies.
- Run the API with `uvicorn main:app --reload --host 0.0.0.0 --port 32000`; inspect Swagger UI at `/docs`.
- Frontend: `npm install` once per clone, then `npm run dev` for the hot-reload server on port 32001.
- Full-stack validation: `docker-compose up -d` provisions API, frontend, and dependencies.
- **File Browser**: Access at `http://localhost:32001/files` for music file management features.

## Coding Style & Naming Conventions
- Python adheres to PEP 8 and Black formatting with 4-space indents, typed service signatures, and explicit imports.
- TypeScript uses ESLint + Prettier with 2-space indents, PascalCase for components, camelCase utilities, and `use`-prefixed hooks.
- Align router filenames with resource domains and pair responses with schemas in `backend/app/db`.

## Testing Guidelines
- Backend tests run via `pytest`; stub SSHFS/Dejavu integrations to keep `/mnt/nas-music` untouched.
- Frontend specs execute with `npm test`; colocate files as `ComponentName.test.tsx` or `hookName.test.ts`.
- Target thorough coverage of new paths and document intentional skips in PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits with scope, e.g., `feat(backend): add playlist search`.
- Describe the problem, solution, and linked issues; attach screenshots or API diffs when behavior changes.
- Verify `pytest`, `npm test`, and linting locally before requesting review and call out any deliberate omissions.

## Security & Configuration Tips
- Do not commit `.env` files; document required keys (`MUSIC_LIBRARY_PATH`, `DATABASE_URL`, `SECRET_KEY`) in `docs/`.
- Mount `/mnt/nas-music` via SSHFS for manual QA and scrub credentials from shared logs or tickets.
- **File Browser Security**: All file operations are restricted to `/mnt/nas-music` subdirectories; path traversal attacks are prevented through proper validation.
- Admin authentication required for all file management operations; MP3 tag editing uses Mutagen library for safe metadata handling.
