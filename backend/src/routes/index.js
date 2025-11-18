import express from 'express';
import predictionsRoutes from './predictions.js';
import ticketsRoutes from './tickets.js';
import healthRoutes from './health.js';

const router = express.Router();
router.use('/predictions', predictionsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/health', healthRoutes);

export default router;
