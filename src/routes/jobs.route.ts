import { Router } from 'express';
import { triggerProcessor, triggerDataGeneration } from '../controllers/jobs.controller';

/**
 * @openapi
 * components:
 *   schemas:
 *     JobResult:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         result:
 *           type: object
 */

const router = Router();

/**
 * @openapi
 * /api/v1/jobs/process:
 *   post:
 *     tags:
 *       - Background Jobs
 *     summary: Trigger manual processing of unprocessed sensor readings
 *     description: Manually trigger the background processor to process all unprocessed sensor readings
 *     responses:
 *       200:
 *         description: Processing completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResult'
 */
router.post('/jobs/process', triggerProcessor);

/**
 * @openapi
 * /api/v1/jobs/generate:
 *   post:
 *     tags:
 *       - Background Jobs
 *     summary: Trigger manual sensor data generation
 *     description: Manually trigger sensor data generation for all active machines
 *     responses:
 *       200:
 *         description: Data generation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResult'
 */
router.post('/jobs/generate', triggerDataGeneration);

export const jobsRouter = router;
