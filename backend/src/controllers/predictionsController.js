import axios from 'axios';
import { explainPrediction } from '../../agent/agent.js';
import { isDrizzleConfigured } from '../db/index.js';
import * as drizzleInsert from '../db/queries/insert.js';
import * as drizzleSelect from '../db/queries/select.js';
import * as drizzleUpdate from '../db/queries/update.js';
import * as drizzleDelete from '../db/queries/delete.js';

export async function listPredictions(req, res) {
  try {
    // prefer Drizzle when DATABASE_URL configured
    if (isDrizzleConfigured()) {
      const rows = await drizzleSelect.getPredictions();
      return res.json(rows);
    }
    // fallback to ML service proxy
    const mlUrl = process.env.ML_URL || 'http://127.0.0.1:8000/predictions';
    const response = await axios.get(mlUrl);
    return res.json(response.data);
  } catch (err) {
    console.error('listPredictions error', err);
    res.status(500).json({ error: 'Failed to list predictions' });
  }
}

export async function createPrediction(req, res) {
  try {
    const mlUrl = process.env.ML_URL || 'http://127.0.0.1:8000/classify';
    const resp = await axios.post(mlUrl, req.body);
    const mlData = resp.data;
    if (isDrizzleConfigured()) {
      const recs = [];
      for (const r of mlData.results) {
        const explanation = await explainPrediction(r, req.body.metadata || {});
        const record = { label: r.label || r, probabilities: JSON.stringify(r.probabilities || []), metadata: JSON.stringify(req.body.metadata || {}), explanation: JSON.stringify(explanation || {}), timestamp: new Date().toISOString() };
        const created = await drizzleInsert.createPrediction(record);
        recs.push(created || record);
      }
      return res.status(201).json({ records: recs });
    }
    return res.status(201).json(mlData);
  } catch (err) {
    console.error('createPrediction error', err);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
}

export async function getPrediction(req, res) {
  try {
    const id = req.params.id;
    if (isDrizzleConfigured()) {
      const found = await drizzleSelect.getPredictionById(id);
      return res.json(found || null);
    }
    const mlUrl = process.env.ML_URL || 'http://127.0.0.1:8000/predictions';
    const response = await axios.get(mlUrl);
    const found = response.data.find(r => r.id === id);
    return res.json(found || null);
  } catch (err) {
    console.error('getPrediction error', err);
    res.status(500).json({ error: 'Failed to get prediction' });
  }
}

export async function updatePrediction(req, res) {
  try {
    const id = req.params.id;
    if (isDrizzleConfigured()) {
      const updated = await drizzleUpdate.updatePrediction(id, req.body);
      return res.json(updated);
    }
    if (isDrizzleConfigured()) {
      const updated = await drizzleUpdate.updatePrediction(id, req.body);
      return res.json(updated);
    }
    const mlUrl = process.env.ML_URL || `http://127.0.0.1:8000/predictions/${id}`;
    const response = await axios.patch(mlUrl, req.body);
    return res.json(response.data);
  } catch (err) {
    console.error('updatePrediction error', err);
    res.status(500).json({ error: 'Failed to update prediction' });
  }
}

export async function deletePrediction(req, res) {
  try {
    const id = req.params.id;
    if (isDrizzleConfigured()) {
      await drizzleDelete.deletePrediction(id);
      return res.json({ ok: true });
    }
    if (isDrizzleConfigured()) {
      await drizzleDelete.deletePrediction(id);
      return res.json({ ok: true });
    }
    const mlUrl = process.env.ML_URL || `http://127.0.0.1:8000/predictions/${id}`;
    const response = await axios.delete(mlUrl);
    return res.json(response.data);
  } catch (err) {
    console.error('deletePrediction error', err);
    res.status(500).json({ error: 'Failed to delete prediction' });
  }
}
