import { isDrizzleConfigured } from '../db/index.js';
import { getPredictionById } from '../db/queries/select.js';
import { explainPrediction } from '../../agent/agent.js';

export async function explainPredictionById(req, res) {
  try {
    const id = req.params.id;
    let pred = null;
    if (isDrizzleConfigured()) {
      pred = await getPredictionById(id);
    } else {
      // fallback to previously persisted file from ML or no DB
      pred = await getPredictionById(id);
    }
    if (!pred) return res.status(404).json({ error: 'Not found' });
    const explanation = await explainPrediction(pred.prediction || pred, pred.metadata || {});
    res.json({ explanation });
  } catch (err) {
    console.error('explainPredictionById', err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
}
