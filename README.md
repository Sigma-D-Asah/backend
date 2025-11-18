# Asah Predictive Maintenance Copilot

This repository contains two parts:

- `backend/` — Express-based REST backend that proxies to the machine-learning inference service and contains agent stubs for explainability and ticket automation.
- `machine-learning/` — FastAPI service with a simple IsolationForest anomaly detector and a training script for synthetic data.

## Quick start

1. Start the machine-learning service

```bash
cd machine-learning
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. Start the backend

```bash
cd backend
npm install
npm run start
```

3. Call the backend predict endpoint (it will proxy to the ML service):

```bash
curl -X POST 'http://127.0.0.1:3000/api/predict' -H 'Content-Type: application/json' -d '{"values": [0.1, 0.2, 0.3, 0.4, 0.5]}'
curl -X POST 'http://127.0.0.1:3000/api/v1/predictions' -H 'Content-Type: application/json' -d '{"values": [0.1, 0.2, 0.3, 0.4]}'
```

### Notes and next steps
- The ML model in `machine-learning` is a proof-of-concept using synthetic data and `IsolationForest`.
- The backend contains a placeholder agent integration in `backend/agent/agent.js`. You can implement LLM calls there using Mastra AI or OpenAI.
For production usage, replace the dummy ticket system with a persistent database (Postgres; Supabase can be used as a host) and add authentication. When you want a lightweight ORM and migrations, use Drizzle (`DATABASE_URL` + drizzle-kit).
