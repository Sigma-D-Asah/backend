import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { CustomError } from "../utils/customError";

import {
    getAllTicketsService,
    getTicketByIdService,
    createTicketService,
    updateTicketService,
} from "../services/tickets.service";


export async function getAllTickets(req: Request, res: Response, next: NextFunction) {
    try {
        const tickets = await getAllTicketsService();
        res.status(200).json({ tickets });
    } catch (error) {
        next(new CustomError("Gagal mengambil semua tiket", 500));
    }
}


export async function getTicketById(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }

    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return next(new CustomError("Parameter 'id' tidak valid", 400));
        }

        const ticket = await getTicketByIdService(id);

        if (!ticket) {
            return next(new CustomError("Ticket tidak ditemukan", 404));
        }

        res.status(200).json({ ticket });
    } catch (error) {
        next(new CustomError("Gagal mengambil tiket berdasarkan ID", 500));
    }
}


export async function createTicket(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }

    try {
        const ticket = await createTicketService(req.body);
        res.status(201).json({ ticket });
    } catch (error) {
        next(new CustomError("Gagal membuat tiket baru", 500));
    }
}


export async function updateTicket(req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new CustomError(JSON.stringify(result.array()), 400));
    }

    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return next(new CustomError("Parameter 'id' tidak valid", 400));
        }

        const updatedTicket = await updateTicketService(id, req.body);

        if (!updatedTicket) {
            return next(new CustomError("Ticket tidak ditemukan", 404));
        }

        res.status(200).json({ updatedTicket });
    } catch (error) {
        next(new CustomError("Gagal memperbarui tiket", 500));
    }
}
