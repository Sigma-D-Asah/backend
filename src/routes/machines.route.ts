import { Router } from 'express';
import { getAllMachines, createMachine, getMachineById, updateMachineData } from '../controllers/machines.controller';

/**
 * @openapi
 * components:
 *   schemas:
 *     Machine:
 *       type: object
 *       properties:
 *         machineId:
 *           type: string
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         location:
 *           type: string
 *         status:
 *           type: string
 *     MachineInput:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *     MachineUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         status:
 *           type: string
 * /api/v1/machines:
 *   get:
 *     tags:
 *       - Machines
 *     summary: Ambil seluruh daftar mesin
 *     description: Mengambil daftar semua mesin yang tersimpan di database.
 *     responses:
 *       200:
 *         description: Daftar mesin berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allMachines:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Machine'
 *       500:
 *         description: Terjadi kesalahan server
 *   post:
 *     tags:
 *       - Machines
 *     summary: Buat mesin baru
 *     description: Menambahkan mesin baru ke database. Field code, name, dan type wajib diisi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MachineInput'
 *     responses:
 *       201:
 *         description: Mesin berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 machine:
 *                   $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Data input tidak valid
 *       500:
 *         description: Terjadi kesalahan server
 *
 * /api/v1/machines/{id}:
 *   get:
 *     tags:
 *       - Machines
 *     summary: Ambil detail mesin berdasarkan ID/kode
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID atau kode mesin
 *     responses:
 *       200:
 *         description: Detail mesin berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 machine:
 *                   $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Parameter id tidak valid
 *       404:
 *         description: Mesin tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 *   put:
 *     tags:
 *       - Machines
 *     summary: Perbarui data mesin berdasarkan ID/kode
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID atau kode mesin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MachineUpdate'
 *     responses:
 *       200:
 *         description: Mesin berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedMachine:
 *                   $ref: '#/components/schemas/Machine'
 *       400:
 *         description: Data input tidak valid
 *       404:
 *         description: Mesin tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */

const routerObject = Router();

routerObject.get('/machines', getAllMachines);
routerObject.get('/machines/:id', getMachineById);
routerObject.post('/machines', createMachine);
routerObject.put('/machines/:id', updateMachineData);

export const machinesRouter = routerObject;