# backend

To install dependencies:

```bash
bun install
# or
npm install
```

To run:

```bash
bun run start
# or
npm run start
```

This project was created using `bun init` but the backend is implemented with Express. It proxies to a FastAPI machine-learning service (run in `../machine-learning`).

Endpoints (v1):

- `GET /` - basic health check
- `GET /api/v1/health` - API health endpoint
- `POST /api/predict` - backward-compatible alias to `POST /api/v1/predictions` — calls the ML `/classify` endpoint and optionally persists records to the database via Drizzle
- `POST /api/v1/predictions` - call ML `/classify` and persist prediction(s) using Drizzle (when `DATABASE_URL` set)
- `GET /api/v1/predictions` - list saved predictions (uses Drizzle if `DATABASE_URL` set, otherwise proxied ML service results)
- `GET /api/v1/predictions/:id` - get saved prediction by id
 - `PATCH /api/v1/predictions/:id` - update saved prediction (available when Drizzle is enabled via `DATABASE_URL`)
- `DELETE /api/v1/predictions/:id` - delete saved prediction
- `POST /api/v1/tickets` - create maintenance ticket (persisted via Drizzle when `DATABASE_URL` set)
- `GET /api/v1/tickets` - list tickets

Run the backend:

```bash
npm install
npm run start
```

Run the ML inference service from `machine-learning` first, then call `/api/predict` with `curl` or HTTP client.

Agentic Copilot (placeholder):

The `backend/agent` folder contains a stubbed `agent.js` which is a placeholder where you can integrate a LLM (OpenAI / Mastra). It returns a simple explanation if no API key is present.

To integrate with OpenAI or another provider, set the `OPENAI_API_KEY` environment variable and implement the API call in `agent/agent.js`.
Mastra & LLM agent:

- A Mastra agent scaffold is created at `backend/agent/mastraAgent.js` and integrated with `backend/agent/agent.js` as a simple way to call explainability functions for predictions.
- Once you add Mastra SDK credentials, implement the `runExplainabilityAgent` function and it will be used when creating predictions.

Drizzle (Postgres)

Use Drizzle with a Postgres connection string in `DATABASE_URL` to persist predictions and tickets. This project originally used Supabase for Postgres hosting; the client was removed and Drizzle / Postgres is used as the recommended path.

- Set `DATABASE_URL` in `.env` (see `.env.example`) to enable Drizzle ORM against any Postgres database.
- Run `bun add drizzle-orm postgres dotenv` (or `npm install drizzle-orm postgres dotenv`) to add packages.
- Generate migrations with `npx drizzle-kit generate` and apply with `npx drizzle-kit migrate`.

Note about lockfiles:
- If `bun.lock` still lists Supabase packages even after removing the dependency from `package.json`, regenerate the lockfile with `bun install` or remove the lockfile and re-run `bun install` / `npm install` depending on your package manager.

## Proses Pengembangan

Yang sudah dikerjakan:
- Backend Express dirancang ke struktur `src/controllers`, `src/routes`, `src/services`, `src/db` agar mirip arsitektur modular seperti NestJS.
- ML service hanya menangani klasifikasi (pre-trained model). Semua CRUD dan storage dipindahkan ke backend.
 - Drizzle ORM scaffold in `src/db` enables queries and migrations when `DATABASE_URL` is set.
- Tambahan Drizzle ORM scaffold di `src/db` (index.js, schema.js) beserta `drizzle.config.ts` untuk migrasi.
 - Endpoint CRUD sekarang menggunakan Drizzle jika `DATABASE_URL` ada. Supabase client removed.

Langkah selanjutnya:
- Tambah features agentic LLM (Mastra) di `backend/agent` supaya menjawab "why" predictions.
- Integrasi dashboard endpoints / analytics (kebutuhan time-series) untuk men-support views pada UI frontend.
