import { db } from "../models/db";
import { maintenanceTickets } from "../models/schema";
import { eq } from "drizzle-orm";

// GET all tickets
export async function getAllTicketsService() {
    return await db.select().from(maintenanceTickets);
}

// GET ticket by ID
export async function getTicketByIdService(ticketId: string) {
    const rows = await db
        .select()
        .from(maintenanceTickets)
        .where(eq(maintenanceTickets.ticketId, ticketId));

    return rows.length ? rows[0] : null;
}

// CREATE new ticket
export async function createTicketService(data: any) {
    const payload = {
        machineId: data.machineId,
        predictionId: data.predictionId ?? null,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? null,
        status: data.status ?? "OPEN",
        aiRecommendation: data.aiRecommendation ?? null,
    };

    const [newTicket] = await db
        .insert(maintenanceTickets)
        .values(payload)
        .returning();

    return newTicket;
}

// UPDATE existing ticket
export async function updateTicketService(ticketId: string, data: any) {

    const payload: any = {};

    if (data.machineId !== undefined) payload.machineId = data.machineId;
    if (data.predictionId !== undefined) payload.predictionId = data.predictionId;
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.status !== undefined) payload.status = data.status;
    if (data.aiRecommendation !== undefined) payload.aiRecommendation = data.aiRecommendation;

    if (Object.keys(payload).length === 0) {
        return null; // tidak ada yang bisa diupdate
    }

    payload.updatedAt = new Date();

    const [updatedTicket] = await db
        .update(maintenanceTickets)
        .set(payload)
        .where(eq(maintenanceTickets.ticketId, ticketId))
        .returning();

    return updatedTicket ?? null;
}
