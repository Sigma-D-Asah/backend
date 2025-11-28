# Asah — Predictive Maintenance API (Backend)

## Struktur Proyek
```
backend/
├─ src/
│  ├─ app.ts                      # Entry-point aplikasi utama
│  ├─ config/
│  │  ├─ index.ts                 # Konfigurasi umum untuk environment variables
│  │  └─ swagger.ts               # Konfigurasi untuk Swagger/OpenAPI
│  ├─ controllers/
│  │  └─ machines.controller.ts   # Request dan response handlers
│  ├─ routes/
│  │  └─ machines.route.ts        # Definisi route dan penulisan JsDoc untuk dokumentasi
│  ├─ services/
│  │  └─ machines.service.ts      # Business logic utama (DB queries)
│  ├─ models/
│  │  ├─ db.ts
│  │  ├─ schema.ts                # Schema database (dengan Drizzle ORM)
│  │  └─ relations.ts
│  ├─ middleware/                 # Custom middleware
│  │  ├─ notFound.ts
│  │  └─ error.ts
│  ├─ utils/                      # Utility tambahan
│  │  └─ customError.ts
│  ├─ mastra/
│  │  ├─ agents/
│  │  │  └─ maintenance-agent.ts
│  │  └─ tools/
│  │     └─ maintenance-ticket.ts
│  └─ tests/                      # Tests (optional)
├─ package.json
├─ tsconfig.json
└─ README.md
```

Keterangan singkat:
- File `app.ts` adalah entry point; definisi route, middleware, dan swagger ada di sini.
- `controllers` menangani Http request/response, `services` berisi logic database untuk operasional.
- `config` memuat konfigurasi & Swagger/OpenAPI config.
- `models` termasuk Drizzle schema & relasi.


## Instalasi & Reproduksi
Gunakan `npm` dengan `node` atau (`bun` sebagai package manager sekaligus runtime).
Rekomendasi: Install [Bun](https://bun.sh/) dulu.

1. Clone repository
	```bash
	git clone git@github.com:Sigma-D-Asah/backend.git
	cd backend
	```
2. Install dependencies
	```bash
	npm install
    # atau
	bun install
	```
3. Buat file environment (jika belum ada)
	```bash
	cp .env.example .env
	# isi nilai-nilai: HOST, PORT, DATABASE_URL, OPENAI_API_KEY, dll
	```

4. Untuk Development
	```bash
	npm run dev
	# atau
    bun run dev
	```

5. Start (production)
	```bash
	npm run start
	```

6. Jika menggunakan Bun:
	```bash
    bun run bun:build
    # lalu jalankan
	bun run bun:start
	```

## Endpoints utama (docs & API)
- Base URL: `http://<HOST>:<PORT>/api/v1` — default: `http://127.0.0.1:3000/api/v1`
- OpenAPI Dokumentasi: `http://127.0.0.1:3000/docs`