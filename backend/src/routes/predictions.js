import express from 'express';
import { listPredictions, createPrediction, getPrediction, updatePrediction, deletePrediction } from '../controllers/predictionsController.js';

const router = express.Router();
router.get('/', listPredictions);
router.post('/', createPrediction);
router.get('/:id', getPrediction);
router.patch('/:id', updatePrediction);
router.delete('/:id', deletePrediction);

export default router;
