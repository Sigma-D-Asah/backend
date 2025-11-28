import { db } from '../models/db';
import { machines } from '../models/schema';
import { eq } from 'drizzle-orm';

export async function getAllMachinesService() {
    return await db.select().from(machines);
}

export async function createMachineService(data: any) {
    return await db.insert(machines).values(data).returning();
}

export async function getMachineByIdService(id: string) {
    return await db.select().from(machines).where(eq(machines.code, id));
}

export async function updateMachineDataService(id: string, data: any) {
    return await db.update(machines).set(data).where(eq(machines.code, id)).returning();
}