import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from "../utils/customError";
import {
    getAllSensorReadingsService,
    getSensorReadingsByMachineService,
    getSensorReadingByIdService,
    createSensorReadingService,
    updateSensorReadingService,
    deleteSensorReadingService,
    getUnprocessedReadingsService,
    generateRandomSensorDataService
} from '../services/sensors.service';

export async function getAllSensorReadings(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const cursor = req.query.cursor as string | undefined;
        
        const result = await getAllSensorReadingsService({ limit, cursor });
        
        res.status(200).json({
            success: true,
            readings: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(new CustomError("Gagal mengambil data sensor readings", 500));
    }
}

export async function getSensorReadingsByMachine(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { machineId } = req.params;
        if (!machineId) {
            return next(new CustomError("Parameter 'machineId' tidak valid", 400));
        }
        
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const cursor = req.query.cursor as string | undefined;
        
        const response = await getSensorReadingsByMachineService(machineId, { limit, cursor });
        
        res.status(200).json({
            success: true,
            readings: response.data,
            pagination: response.pagination
        });
    } catch (error) {
        next(new CustomError("Gagal mengambil data sensor readings berdasarkan mesin", 500));
    }
}

export async function getSensorReadingById(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { readingId } = req.params;
        if (!readingId) {
            return next(new CustomError("Parameter 'readingId' tidak valid", 400));
        }
        const reading = await getSensorReadingByIdService(readingId);
        
        if (reading.length === 0) {
            return next(new CustomError("Sensor reading tidak ditemukan", 404));
        }
        
        res.status(200).json({ reading: reading[0] });
    } catch (error) {
        next(new CustomError("Gagal mengambil data sensor reading", 500));
    }
}

export async function createSensorReading(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const reading = await createSensorReadingService(req.body);
        res.status(201).json({ reading });
    } catch (error) {
        next(new CustomError("Gagal membuat sensor reading baru", 500));
    }
}

export async function updateSensorReading(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { readingId } = req.params;
        if (!readingId) {
            return next(new CustomError("Parameter 'readingId' tidak valid", 400));
        }
        const updatedReading = await updateSensorReadingService(readingId, req.body);
        
        if (updatedReading.length === 0) {
            return next(new CustomError("Sensor reading tidak ditemukan", 404));
        }
        
        res.status(200).json({ reading: updatedReading[0] });
    } catch (error) {
        next(new CustomError("Gagal memperbarui sensor reading", 500));
    }
}

export async function deleteSensorReading(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { readingId } = req.params;
        if (!readingId) {
            return next(new CustomError("Parameter 'readingId' tidak valid", 400));
        }
        const deletedReading = await deleteSensorReadingService(readingId);
        
        if (deletedReading.length === 0) {
            return next(new CustomError("Sensor reading tidak ditemukan", 404));
        }
        
        res.status(200).json({ message: "Sensor reading berhasil dihapus", reading: deletedReading[0] });
    } catch (error) {
        next(new CustomError("Gagal menghapus sensor reading", 500));
    }
}

export async function getUnprocessedReadings(req: Request, res: Response, next: NextFunction) {
    try {
        const readings = await getUnprocessedReadingsService();
        res.status(200).json({ readings, count: readings.length });
    } catch (error) {
        next(new CustomError("Gagal mengambil data sensor readings yang belum diproses", 500));
    }
}

export async function generateRandomSensorData(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { machineId } = req.params;
        if (!machineId) {
            return next(new CustomError("Parameter 'machineId' tidak valid", 400));
        }
        const reading = await generateRandomSensorDataService(machineId);
        res.status(201).json({ reading });
    } catch (error: any) {
        next(new CustomError(error.message || "Gagal generate sensor data random", 500));
    }
}
