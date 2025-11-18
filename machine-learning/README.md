# Machine Learning

This folder contains a small FastAPI service (`app/main.py`) that loads a pre-trained classification model and exposes a `/classify` endpoint.

Quick start

1. Create a virtual environment and install deps:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Train the sample model (classification) using the Kaggle dataset or fallback to synthetic:

```bash
# If you have the Kaggle dataset downloaded to data/predictive_maintenance.csv
DATA_PATH=data/predictive_maintenance.csv python train_classification.py

# Otherwise fallback to original isolation forest
python train.py
```

3. Run the FastAPI inference server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. Example API call:

```bash
curl -X POST 'http://127.0.0.1:8000/predict' -H 'Content-Type: application/json' -d '{"values": [0.1, 0.2, 0.3, 0.4, 0.5]}'

# For classification endpoint, call /classify
MODEL_PATH can be configured via the `CLASSIFICATION_MODEL_PATH` environment variable;
by default it looks for `./model/{model_ml}.joblib`.

```bash
curl -X POST 'http://127.0.0.1:8000/classify' -H 'Content-Type: application/json' -d '{"values": [45, 12, 3, 66, 7, 12]}'
```
```

This returns JSON with anomaly detection information and a small explanation per sample.
