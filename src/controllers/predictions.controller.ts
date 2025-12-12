import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from "../utils/customError";
import {
    getAllPredictionsService,
    getPredictionsByMachineService,
    getPredictionByIdService,
    getPredictionByReadingIdService,
    createPredictionService,
    updatePredictionService,
    deletePredictionService,
    getFailurePredictionsService
} from '../services/predictions.service';

export async function getAllPredictions(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const cursor = req.query.cursor as string | undefined;
        
        const result = await getAllPredictionsService({ limit, cursor });
        
        res.status(200).json({
            success: true,
            predictions: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(new CustomError("Gagal mengambil data AI predictions", 500));
    }
}

export async function getPredictionsByMachine(req: Request, res: Response, next: NextFunction) {
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
        
        const response = await getPredictionsByMachineService(machineId, { limit, cursor });
        
        res.status(200).json({
            success: true,
            predictions: response.data,
            pagination: response.pagination
        });
    } catch (error) {
        next(new CustomError("Gagal mengambil data predictions berdasarkan mesin", 500));
    }
}

export async function getPredictionById(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { predictionId } = req.params;
        if (!predictionId) {
            return next(new CustomError("Parameter 'predictionId' tidak valid", 400));
        }
        const prediction = await getPredictionByIdService(predictionId);
        
        if (prediction.length === 0) {
            return next(new CustomError("AI prediction tidak ditemukan", 404));
        }
        
        res.status(200).json({ prediction: prediction[0] });
    } catch (error) {
        next(new CustomError("Gagal mengambil data AI prediction", 500));
    }
}

export async function getPredictionByReadingId(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { readingId } = req.params;
        if (!readingId) {
            return next(new CustomError("Parameter 'readingId' tidak valid", 400));
        }
        const prediction = await getPredictionByReadingIdService(readingId);
        
        if (prediction.length === 0) {
            return next(new CustomError("AI prediction untuk reading ini tidak ditemukan", 404));
        }
        
        res.status(200).json({ prediction: prediction[0] });
    } catch (error) {
        next(new CustomError("Gagal mengambil data AI prediction", 500));
    }
}

export async function createPrediction(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const prediction = await createPredictionService(req.body);
        res.status(201).json({ prediction });
    } catch (error) {
        next(new CustomError("Gagal membuat AI prediction baru", 500));
    }
}

export async function updatePrediction(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { predictionId } = req.params;
        if (!predictionId) {
            return next(new CustomError("Parameter 'predictionId' tidak valid", 400));
        }
        const updatedPrediction = await updatePredictionService(predictionId, req.body);
        
        if (updatedPrediction.length === 0) {
            return next(new CustomError("AI prediction tidak ditemukan", 404));
        }
        
        res.status(200).json({ prediction: updatedPrediction[0] });
    } catch (error) {
        next(new CustomError("Gagal memperbarui AI prediction", 500));
    }
}

export async function deletePrediction(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }
    
    try {
        const { predictionId } = req.params;
        if (!predictionId) {
            return next(new CustomError("Parameter 'predictionId' tidak valid", 400));
        }
        const deletedPrediction = await deletePredictionService(predictionId);
        
        if (deletedPrediction.length === 0) {
            return next(new CustomError("AI prediction tidak ditemukan", 404));
        }
        
        res.status(200).json({ message: "AI prediction berhasil dihapus", prediction: deletedPrediction[0] });
    } catch (error) {
        next(new CustomError("Gagal menghapus AI prediction", 500));
    }
}

export async function getFailurePredictions(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const cursor = req.query.cursor as string | undefined;
        
        const result = await getFailurePredictionsService({ limit, cursor });
        
        res.status(200).json({
            success: true,
            predictions: result.data,
            pagination: result.pagination,
            count: result.data.length
        });
    } catch (error) {
        next(new CustomError("Gagal mengambil data failure predictions", 500));
    }
}
