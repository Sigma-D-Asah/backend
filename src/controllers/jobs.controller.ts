import { Request, Response, NextFunction } from 'express';
import { CustomError } from "../utils/customError";
import { triggerManualProcessing } from '../services/processor.service';
import { triggerManualDataGeneration } from '../jobs/sensor-cron';

/**
 * Manually trigger background processor
 * Useful for testing or forcing immediate processing
 */
export async function triggerProcessor(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await triggerManualProcessing();
        res.status(200).json({
            message: 'Background processor executed',
            result
        });
    } catch (error) {
        next(new CustomError("Gagal menjalankan background processor", 500));
    }
}

/**
 * Manually trigger sensor data generation
 * Useful for testing or forcing immediate data generation
 */
export async function triggerDataGeneration(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await triggerManualDataGeneration();
        res.status(200).json({
            message: 'Sensor data generation executed',
            result
        });
    } catch (error) {
        next(new CustomError("Gagal generate sensor data", 500));
    }
}
