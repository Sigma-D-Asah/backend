import { Router } from 'express';
import {
    getAllPredictions,
    getPredictionsByMachine,
    getPredictionById,
    getPredictionByReadingId,
    createPrediction,
    updatePrediction,
    deletePrediction,
    getFailurePredictions
} from '../controllers/predictions.controller';

/**
 * @openapi
 * components:
 *   schemas:
 *     AIPrediction:
 *       type: object
 *       properties:
 *         predictionId:
 *           type: string
 *           format: uuid
 *         readingId:
 *           type: string
 *           format: uuid
 *         machineId:
 *           type: string
 *           format: uuid
 *         isFailure:
 *           type: boolean
 *         failureType:
 *           type: string
 *         confidenceScore:
 *           type: number
 *         explanationData:
 *           type: object
 *         naturalLanguageReason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PredictionInput:
 *       type: object
 *       required:
 *         - readingId
 *         - machineId
 *         - isFailure
 *       properties:
 *         readingId:
 *           type: string
 *           format: uuid
 *         machineId:
 *           type: string
 *           format: uuid
 *         isFailure:
 *           type: boolean
 *         failureType:
 *           type: string
 *         confidenceScore:
 *           type: number
 *         explanationData:
 *           type: object
 *         naturalLanguageReason:
 *           type: string
 */

const router = Router();

/**
 * @openapi
 * /api/v1/predictions:
 *   get:
 *     tags:
 *       - AI Predictions
 *     summary: Ambil semua AI predictions
 *     description: Mengambil semua data AI predictions yang tersimpan
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 predictions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIPrediction'
 */
router.get('/predictions', getAllPredictions);

/**
 * @openapi
 * /api/v1/predictions/failures:
 *   get:
 *     tags:
 *       - AI Predictions
 *     summary: Ambil predictions yang memprediksi failure
 *     description: Mengambil data predictions dimana isFailure = true
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/predictions/failures', getFailurePredictions);

/**
 * @openapi
 * /api/v1/predictions/machine/{machineId}:
 *   get:
 *     tags:
 *       - AI Predictions
 *     summary: Ambil predictions berdasarkan mesin
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/predictions/machine/:machineId', getPredictionsByMachine);

/**
 * @openapi
 * /api/v1/predictions/reading/{readingId}:
 *   get:
 *     tags:
 *       - AI Predictions
 *     summary: Ambil prediction berdasarkan reading ID
 *     parameters:
 *       - in: path
 *         name: readingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/predictions/reading/:readingId', getPredictionByReadingId);

/**
 * @openapi
 * /api/v1/predictions/{predictionId}:
 *   get:
 *     tags:
 *       - AI Predictions
 *     summary: Ambil prediction berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/predictions/:predictionId', getPredictionById);

/**
 * @openapi
 * /api/v1/predictions:
 *   post:
 *     tags:
 *       - AI Predictions
 *     summary: Buat AI prediction baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PredictionInput'
 *     responses:
 *       201:
 *         description: Berhasil membuat AI prediction
 */
router.post('/predictions', createPrediction);

/**
 * @openapi
 * /api/v1/predictions/{predictionId}:
 *   put:
 *     tags:
 *       - AI Predictions
 *     summary: Update AI prediction
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PredictionInput'
 *     responses:
 *       200:
 *         description: Berhasil update AI prediction
 */
router.put('/predictions/:predictionId', updatePrediction);

/**
 * @openapi
 * /api/v1/predictions/{predictionId}:
 *   delete:
 *     tags:
 *       - AI Predictions
 *     summary: Hapus AI prediction
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil hapus AI prediction
 */
router.delete('/predictions/:predictionId', deletePrediction);

export const predictionsRouter = router;
