import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CustomError } from "../utils/customError";
import {
	getAllMachinesService,
	createMachineService,
	getMachineByIdService,
	updateMachineDataService
} from '../services/machines.service.js';

export async function getAllMachines(req: Request, res: Response, next: NextFunction) {
	try {
		const allMachines = await getAllMachinesService();
		res.status(200).json({ allMachines });
	} catch (error) {
		next(new CustomError("Gagal untuk mengambil data semua mesin", 500));
	}
}

export async function createMachine(req: Request, res: Response, next: NextFunction) {
	const result = validationResult(req);
	if (!result.isEmpty()) {
		return next(new CustomError(JSON.stringify(result.array()), 400));
	}
	try {
		const machine = await createMachineService(req.body);
		res.status(201).json({ machine });
	} catch (error) {
		next(new CustomError("Gagal untuk membuat mesin baru", 500));
	}
}

export async function getMachineById(req: Request, res: Response, next: NextFunction) {
	const result = validationResult(req);
	if (!result.isEmpty()) {
		return next(new CustomError(JSON.stringify(result.array()), 400));
	}
	try {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
			return next(new CustomError("Parameter 'id' tidak valid", 400));
		}
		const machine = await getMachineByIdService(id);
        if (machine.length === 0) {
            return next(new CustomError("Mesin dengan ID tersebut tidak ditemukan", 404));
        }
		res.status(200).json({ machine });
	} catch (error) {
		next(new CustomError("Gagal untuk mengambil data mesin berdasarkan ID", 500));
	}
}

export async function updateMachineData(req: Request, res: Response, next: NextFunction) {
	const result = validationResult(req);
	if (!result.isEmpty()) {
		return next(new CustomError(JSON.stringify(result.array()), 400));
	}
	try {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
			return next(new CustomError("Parameter 'id' tidak valid", 400));
		}
		const updatedMachine = await updateMachineDataService(id, req.body);
		res.status(201).json({ updatedMachine });
	} catch (error) {
		next(new CustomError("Gagal untuk memperbarui data mesin", 500));
	}
}
