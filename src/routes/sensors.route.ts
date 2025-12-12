import { Router } from 'express';
import {
    getAllSensorReadings,
    getSensorReadingsByMachine,
    getSensorReadingById,
    createSensorReading,
    updateSensorReading,
    deleteSensorReading,
    getUnprocessedReadings,
    generateRandomSensorData
} from '../controllers/sensors.controller';

/**
 * @openapi
 * components:
 *   schemas:
 *     SensorReading:
 *       type: object
 *       properties:
 *         readingId:
 *           type: string
 *           format: uuid
 *         machineId:
 *           type: string
 *           format: uuid
 *         airTemperatureK:
 *           type: number
 *         processTemperatureK:
 *           type: number
 *         rotationalSpeedRpm:
 *           type: integer
 *         torqueNm:
 *           type: number
 *         toolWearMin:
 *           type: integer
 *         isProcessed:
 *           type: boolean
 *         processedAt:
 *           type: string
 *           format: date-time
 *         timestamp:
 *           type: string
 *           format: date-time
 *     SensorReadingInput:
 *       type: object
 *       required:
 *         - machineId
 *         - airTemperatureK
 *         - processTemperatureK
 *         - rotationalSpeedRpm
 *         - torqueNm
 *         - toolWearMin
 *       properties:
 *         machineId:
 *           type: string
 *           format: uuid
 *         airTemperatureK:
 *           type: number
 *         processTemperatureK:
 *           type: number
 *         rotationalSpeedRpm:
 *           type: integer
 *         torqueNm:
 *           type: number
 *         toolWearMin:
 *           type: integer
 */

const router = Router();

/**
 * @openapi
 * /api/v1/sensors:
 *   get:
 *     tags:
 *       - Sensor Readings
 *     summary: Ambil semua sensor readings
 *     description: Mengambil semua data sensor readings yang tersimpan
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 readings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorReading'
 */
router.get('/sensors', getAllSensorReadings);

/**
 * @openapi
 * /api/v1/sensors/unprocessed:
 *   get:
 *     tags:
 *       - Sensor Readings
 *     summary: Ambil sensor readings yang belum diproses
 *     description: Mengambil data sensor readings yang belum diprediksi oleh ML
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 readings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorReading'
 *                 count:
 *                   type: integer
 */
router.get('/sensors/unprocessed', getUnprocessedReadings);

/**
 * @openapi
 * /api/v1/sensors/machine/{machineId}:
 *   get:
 *     tags:
 *       - Sensor Readings
 *     summary: Ambil sensor readings berdasarkan mesin
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
router.get('/sensors/machine/:machineId', getSensorReadingsByMachine);

/**
 * @openapi
 * /api/v1/sensors/{readingId}:
 *   get:
 *     tags:
 *       - Sensor Readings
 *     summary: Ambil sensor reading berdasarkan ID
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
router.get('/sensors/:readingId', getSensorReadingById);

/**
 * @openapi
 * /api/v1/sensors:
 *   post:
 *     tags:
 *       - Sensor Readings
 *     summary: Buat sensor reading baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorReadingInput'
 *     responses:
 *       201:
 *         description: Berhasil membuat sensor reading
 */
router.post('/sensors', createSensorReading);

/**
 * @openapi
 * /api/v1/sensors/generate/{machineId}:
 *   post:
 *     tags:
 *       - Sensor Readings
 *     summary: Generate sensor data random untuk testing
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Berhasil generate sensor data
 */
router.post('/sensors/generate/:machineId', generateRandomSensorData);

/**
 * @openapi
 * /api/v1/sensors/{readingId}:
 *   put:
 *     tags:
 *       - Sensor Readings
 *     summary: Update sensor reading
 *     parameters:
 *       - in: path
 *         name: readingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorReadingInput'
 *     responses:
 *       200:
 *         description: Berhasil update sensor reading
 */
router.put('/sensors/:readingId', updateSensorReading);

/**
 * @openapi
 * /api/v1/sensors/{readingId}:
 *   delete:
 *     tags:
 *       - Sensor Readings
 *     summary: Hapus sensor reading
 *     parameters:
 *       - in: path
 *         name: readingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil hapus sensor reading
 */
router.delete('/sensors/:readingId', deleteSensorReading);

export const sensorsRouter = router;
