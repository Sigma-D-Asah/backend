import { db } from "../models/db";
import { maintenanceTickets } from "../models/schema";
import { eq, desc, lt, and } from "drizzle-orm";

interface PaginationParams {
    limit?: number;
    cursor?: string;
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}

// OPTIMIZED: Added cursor-based pagination
export async function getAllTicketsService(
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    const results = cursor
        ? await db.select()
            .from(maintenanceTickets)
            .where(lt(maintenanceTickets.createdAt, cursor))
            .orderBy(desc(maintenanceTickets.createdAt))
            .limit(limit + 1)
        : await db.select()
            .from(maintenanceTickets)
            .orderBy(desc(maintenanceTickets.createdAt))
            .limit(limit + 1);
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1]?.createdAt ?? null
        : null;
    
    return {
        data,
        pagination: {
            nextCursor,
            hasMore
        }
    };
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
