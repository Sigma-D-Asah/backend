from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import os

MODEL_PATH = os.getenv('CLASSIFICATION_MODEL_PATH', './model/{model_ml}.joblib')

app = FastAPI(title="Predictive Maintenance ML", description="Classification model service")

# load model once (classification only)
classification_model = None
try:
    classification_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
except Exception as e:
    print('Error loading classification model:', e)
    classification_model = None

@app.get('/')
async def root():
    return {"message": "Machine Learning inference service is running"}

@app.post('/classify')
async def classify(payload: BaseModel):
    # Expect a JSON array of numeric features under `values`
    data = payload.dict() if hasattr(payload, 'dict') else payload
    values = data.get('values')
    if classification_model is None:
        raise HTTPException(status_code=500, detail="Classification model not loaded - please train first")
    arr = np.array(values)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    preds = classification_model.predict(arr)
    probs = None
    if hasattr(classification_model, 'predict_proba'):
        probs = classification_model.predict_proba(arr)
    results = []
    for i, p in enumerate(preds):
        rec = {'label': str(p)}
        if probs is not None:
            rec['probabilities'] = probs[i].tolist()
        results.append(rec)
    return {'count': len(results), 'results': results}


@app.post('/retrain')
async def retrain(model: str = 'classification'):
    import subprocess
    if model == 'classification':
        cmd = ['python', 'train_classification.py']
    else:
        cmd = ['python', 'train.py']
    status = subprocess.run(cmd, capture_output=True, text=True)
    if status.returncode != 0:
        raise HTTPException(500, f"Training failed: {status.stderr}")
    return {'message': 'retrain completed'}
