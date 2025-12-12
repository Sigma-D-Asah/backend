# Backend Service - Machine Learning Integration

Dokumentasi integrasi Backend dengan Machine Learning

## Fitur
- CRUD untuk Machines, Sensor Readings, AI Predictions, Maintenance Tickets
- Integrasi ML otomatis: kirim sensor ke ML API, simpan hasil (binary + failure type), simpan penjelasan alami
- Background jobs: sensor data generator (cron) dan ML prediction processor

## Ringkasan Alur
1. Cron job generate sensor data (default setiap 8 jam) → simpan ke sensor_readings (isProcessed=false)
2. Background processor (default setiap 5 menit) → ambil unprocessed → panggil ML API → simpan ke ai_predictions → update sensor_readings (isProcessed=true, processedAt)

## Setup

1. Install
```bash
npm install
```

2. Salin env
```bash
cp .env.example .env
# lalu edit nilai-nilai:
# PORT, HOST, DATABASE_URL, OPENAI_API_KEY, ML_API_URL
```

3. Migrasi DB
```bash
npx drizzle-kit push
```

4. Jalankan ML API (FastAPI)
```bash
cd ../machine-learning
uvicorn src.server:app --reload --host 0.0.0.0 --port 8000
```

5. Jalankan backend
```bash
npm run dev
```

## Endpoints (ringkas)

Machines
- GET /api/v1/machines
- GET /api/v1/machines/:id
- POST /api/v1/machines
- PUT /api/v1/machines/:id

Sensor Readings
- GET /api/v1/sensors
- GET /api/v1/sensors/unprocessed
- GET /api/v1/sensors/machine/:machineId
- GET /api/v1/sensors/:readingId
- POST /api/v1/sensors
- POST /api/v1/sensors/generate/:machineId
- PUT /api/v1/sensors/:readingId
- DELETE /api/v1/sensors/:readingId

AI Predictions
- GET /api/v1/predictions
- GET /api/v1/predictions/failures
- GET /api/v1/predictions/machine/:machineId
- GET /api/v1/predictions/reading/:readingId
- GET /api/v1/predictions/:predictionId
- POST /api/v1/predictions
- PUT /api/v1/predictions/:predictionId
- DELETE /api/v1/predictions/:predictionId

Jobs
- POST /api/v1/jobs/generate
- POST /api/v1/jobs/process

Maintenance Tickets
- GET /api/v1/tickets
- GET /api/v1/tickets/:id
- POST /api/v1/tickets
- PUT /api/v1/tickets/:id

## Cron / Background Intervals
- Sensor generator default: 8 jam (ubah di src/app.ts)
- ML processor default: 5 menit (ubah di src/app.ts)

## ML API Format

Binary prediction
```json
{
  "status_code": 200,
  "message": "Binary prediction successful",
  "data": {
    "prediction": 1,
    "prediction_label": "failed",
    "confidence": 0.8523
  }
}
```

Failure type prediction
```json
{
  "status_code": 200,
  "message": "Failure type prediction successful",
  "data": {
    "prediction": "Tool Wear Failure",
    "probabilities": {
      "Tool Wear Failure": 0.878,
      "No Failure": 0.045,
      ...
    },
    "confidence": 0.878,
    "ambiguous": false
  }
}
```

## Database (ringkas)

machines
- machineId (UUID, PK), code (unique), name, type, location, status, metadata, createdAt

sensor_readings
- readingId (UUID, PK), machineId (FK), airTemperatureK, processTemperatureK, rotationalSpeedRpm, torqueNm, toolWearMin, isProcessed (BOOLEAN), processedAt, timestamp

ai_predictions
- predictionId (UUID, PK), readingId (UUID, unique), machineId, isFailure (BOOLEAN), failureType, confidenceScore, explanationData (JSONB), naturalLanguageReason, createdAt

maintenance_tickets
- ticketId (UUID, PK), machineId, predictionId, ticketNumber, title, description, priority, status, aiRecommendation, createdAt, updatedAt

## Testing singkat

1. Buat mesin
```bash
curl -X POST http://localhost:3000/api/v1/machines \
  -H "Content-Type: application/json" \
  -d '{"code":"M001","name":"Machine Alpha","type":"M","location":"Factory Floor 1","status":"ACTIVE"}'
```

2. Generate sensor data manual
```bash
curl -X POST http://localhost:3000/api/v1/jobs/generate
# atau
curl -X POST http://localhost:3000/api/v1/sensors/generate/{machineId}
```

3. Cek unprocessed
```bash
curl http://localhost:3000/api/v1/sensors/unprocessed
```

4. Trigger processing
```bash
curl -X POST http://localhost:3000/api/v1/jobs/process
```

5. Cek predictions
```bash
curl http://localhost:3000/api/v1/predictions
curl http://localhost:3000/api/v1/predictions/failures
curl http://localhost:3000/api/v1/predictions/machine/{machineId}
```

## Dokumentasi & Tech Stack
- API docs: http://localhost:3000/docs
- Framework: Express.js + TypeScript
- DB: PostgreSQL + Drizzle ORM
- Background Jobs: Node.js timers
- ML Integration: FastAPI + fetch
- License: MIT
