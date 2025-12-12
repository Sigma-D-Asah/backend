import { db } from '../models/db';
import { aiPredictions, sensorReadings } from '../models/schema';
import { eq, desc, and, lt } from 'drizzle-orm';

interface PaginationParams {
    limit?: number;
    cursor?: string; // timestamp cursor for pagination
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}

// OPTIMIZED: Added cursor-based pagination
export async function getAllPredictionsService(
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    const results = cursor
        ? await db.select()
            .from(aiPredictions)
            .where(lt(aiPredictions.createdAt, cursor))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(limit + 1)
        : await db.select()
            .from(aiPredictions)
            .orderBy(desc(aiPredictions.createdAt))
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

// OPTIMIZED: Added cursor-based pagination
export async function getPredictionsByMachineService(
    machineId: string,
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    const results = cursor
        ? await db.select()
            .from(aiPredictions)
            .where(and(
                eq(aiPredictions.machineId, machineId),
                lt(aiPredictions.createdAt, cursor)
            ))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(limit + 1)
        : await db.select()
            .from(aiPredictions)
            .where(eq(aiPredictions.machineId, machineId))
            .orderBy(desc(aiPredictions.createdAt))
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

export async function getPredictionByIdService(predictionId: string) {
    return await db.select()
        .from(aiPredictions)
        .where(eq(aiPredictions.predictionId, predictionId));
}

export async function getPredictionByReadingIdService(readingId: string) {
    return await db.select()
        .from(aiPredictions)
        .where(eq(aiPredictions.readingId, readingId));
}

export async function createPredictionService(data: any) {
    return await db.insert(aiPredictions).values(data).returning();
}

export async function updatePredictionService(predictionId: string, data: any) {
    return await db.update(aiPredictions)
        .set(data)
        .where(eq(aiPredictions.predictionId, predictionId))
        .returning();
}

export async function deletePredictionService(predictionId: string) {
    return await db.delete(aiPredictions)
        .where(eq(aiPredictions.predictionId, predictionId))
        .returning();
}

// OPTIMIZED: Added cursor-based pagination
export async function getFailurePredictionsService(
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    const results = cursor
        ? await db.select()
            .from(aiPredictions)
            .where(and(
                eq(aiPredictions.isFailure, true),
                lt(aiPredictions.createdAt, cursor)
            ))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(limit + 1)
        : await db.select()
            .from(aiPredictions)
            .where(eq(aiPredictions.isFailure, true))
            .orderBy(desc(aiPredictions.createdAt))
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
