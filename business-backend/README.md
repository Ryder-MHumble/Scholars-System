# Talent Portrait Business Backend

This service is the PostgreSQL-backed business layer for V1.2 talent portrait analysis. DeanAgent remains the canonical source for scholars, students, publications, projects, and activities. This service stores confirmed classifications, immutable analysis inputs and outputs, evidence provenance, recommendations, and audit metadata.

## Requirements

- Node.js 20 or newer
- PostgreSQL 16 (the repository compose file exposes it on `127.0.0.1:5433`)
- Read access to the configured DeanAgent API
- An OpenAI-compatible Chat Completions model

## Local setup

```bash
docker compose up -d postgres
npm --prefix business-backend install
cp business-backend/.env.example business-backend/.env
set -a; source business-backend/.env; set +a
npm run business:migrate
npm run business:dev
```

The API binds to `http://127.0.0.1:8002` by default. Set `LLM_MODEL` and inject `LLM_API_KEY` at runtime before enqueueing assessments. Credentials must not be committed. The default `LLM_BASE_URL` is the company OpenAI-compatible endpoint, but provider, URL, and model are configurable.

## API workflow

Confirm traits before requesting an assessment:

```bash
curl -X PUT http://127.0.0.1:8002/api/subjects/student/student-123/traits \
  -H 'content-type: application/json' \
  -d '{
    "entity_type": "student",
    "affiliation_scope": "external",
    "student_stage": "potential",
    "relationship_traits": [],
    "human_judgments": [],
    "confirmed_by": "reviewer-id",
    "confirmed_at": "2026-09-05T00:00:00.000Z"
  }'

curl -X POST http://127.0.0.1:8002/api/portrait-assessments \
  -H 'content-type: application/json' \
  -H 'Idempotency-Key: portrait-student-123-v1' \
  -d '{
    "source_record_type": "student",
    "source_record_id": "student-123",
    "requested_by": "reviewer-id"
  }'
```

The enqueue call returns `202`. Poll `GET /api/portrait-assessments/:id` for the run status. `GET /api/subjects/:recordType/:recordId/portraits/latest` returns only the newest terminal result, so a queued replacement never masks or impersonates the last completed portrait.

## 8001 gateway integration

The browser continues to use `VITE_API_BASE_URL` (normally port 8001). The 8001 gateway must proxy the portrait routes below to the business backend (normally `http://127.0.0.1:8002`) while preserving JSON bodies and the `Idempotency-Key` header:

- `PUT /api/subjects/:recordType/:recordId/traits`
- `GET /api/subjects/:recordType/:recordId/traits`
- `POST /api/portrait-assessments`
- `GET /api/portrait-assessments/:id`
- `GET /api/subjects/:recordType/:recordId/portraits/latest`

The included `local-backend/server.mjs` implements this proxy. Set `BUSINESS_BACKEND_URL` when the business service is not on the local default. Keep `LLM_API_KEY` (or `INTERNAL_LLM_API_KEY`) in the 8002 process environment only; it must never be sent to the browser.

Supported routing is deliberately narrow:

- confirmed `student + potential` -> `potential_student`
- confirmed `expert + external` -> `external_expert`

Scholar records must be experts; student and academic-student records must be students. Academy relationships add cooperation evidence but never change an external expert's affiliation.

## Commands

```bash
npm run business:build
npm run business:test
npm run business:migrate
TEST_DATABASE_URL=postgresql://... npm --prefix business-backend run test:db
```

The normal test suite skips the PostgreSQL integration case unless `TEST_DATABASE_URL` is set. Production should bind behind the internal gateway; clients must use the HTTP API and must never connect to PostgreSQL directly.
