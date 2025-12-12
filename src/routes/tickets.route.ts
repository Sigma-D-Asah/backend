import { Router } from "express";
import { getAllTickets, getTicketById, createTicket, updateTicket } from "../controllers/tickets.controller";

/**
 * @openapi
 * /api/v1/tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Ambil semua tiket
 *     description: Mengambil seluruh daftar Maintenance Ticketing dari database.
 *     responses:
 *       200:
 *         description: Daftar tiket berhasil diambil
 *       500:
 *         description: Terjadi kesalahan server
 *
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Buat tiket baru
 *     description: Menambahkan tiket baru ke database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               machineId:
 *                 type: string
 *                 example: "uuid-mesin"
 *               predictionId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               status:
 *                 type: string
 *                 enum: [OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED]
 *     responses:
 *       201:
 *         description: Tiket berhasil dibuat
 *       400:
 *         description: Input tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 *
 * /api/v1/tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Ambil tiket berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail tiket berhasil diambil
 *       404:
 *         description: Tiket tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 *
 *   put:
 *     tags:
 *       - Tickets
 *     summary: Update tiket berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tiket berhasil diperbarui
 *       404:
 *         description: Tiket tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */

const routerObject = Router();

routerObject.get("/tickets", getAllTickets);
routerObject.get("/tickets/:id", getTicketById);
routerObject.post("/tickets", createTicket);
routerObject.put("/tickets/:id", updateTicket);

export const ticketsRouter = routerObject;
