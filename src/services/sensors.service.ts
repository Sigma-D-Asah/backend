import { db } from '../models/db';
import { sensorReadings, machines } from '../models/schema';
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
export async function getAllSensorReadingsService(
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    // Build query with conditional cursor
    const results = cursor
        ? await db.select()
            .from(sensorReadings)
            .where(lt(sensorReadings.timestamp, cursor))
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit + 1)
        : await db.select()
            .from(sensorReadings)
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit + 1);
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1]?.timestamp ?? null
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
export async function getSensorReadingsByMachineService(
    machineId: string,
    params: PaginationParams = {}
): Promise<PaginatedResponse<any>> {
    const limit = params.limit || 50;
    const cursor = params.cursor;
    
    const results = cursor
        ? await db.select()
            .from(sensorReadings)
            .where(and(
                eq(sensorReadings.machineId, machineId),
                lt(sensorReadings.timestamp, cursor)
            ))
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit + 1)
        : await db.select()
            .from(sensorReadings)
            .where(eq(sensorReadings.machineId, machineId))
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit + 1);
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1]?.timestamp ?? null
        : null;
    
    return {
        data,
        pagination: {
            nextCursor,
            hasMore
        }
    };
}

export async function getSensorReadingByIdService(readingId: string) {
    return await db.select()
        .from(sensorReadings)
        .where(eq(sensorReadings.readingId, readingId));
}

export async function createSensorReadingService(data: any) {
    return await db.insert(sensorReadings).values(data).returning();
}

export async function updateSensorReadingService(readingId: string, data: any) {
    return await db.update(sensorReadings)
        .set(data)
        .where(eq(sensorReadings.readingId, readingId))
        .returning();
}

export async function deleteSensorReadingService(readingId: string) {
    return await db.delete(sensorReadings)
        .where(eq(sensorReadings.readingId, readingId))
        .returning();
}

export async function getUnprocessedReadingsService() {
    return await db.select()
        .from(sensorReadings)
        .where(eq(sensorReadings.isProcessed, false))
        .orderBy(sensorReadings.timestamp);
}

export async function markReadingAsProcessedService(readingId: string) {
    return await db.update(sensorReadings)
        .set({
            isProcessed: true,
            processedAt: new Date().toISOString()
        })
        .where(eq(sensorReadings.readingId, readingId))
        .returning();
}

// Generate random sensor data for a machine
export async function generateRandomSensorDataService(machineId: string) {
    // Get machine info to determine type
    const [machine] = await db.select().from(machines).where(eq(machines.machineId, machineId));
    
    if (!machine) {
        throw new Error('Machine not found');
    }

    // Generate realistic sensor values
    const sensorData = {
        machineId,
        airTemperatureK: parseFloat((295 + Math.random() * 10).toFixed(1)), // 295-305 K
        processTemperatureK: parseFloat((305 + Math.random() * 10).toFixed(1)), // 305-315 K
        rotationalSpeedRpm: Math.floor(1200 + Math.random() * 800), // 1200-2000 RPM
        torqueNm: parseFloat((20 + Math.random() * 50).toFixed(1)), // 20-70 Nm
        toolWearMin: Math.floor(Math.random() * 250), // 0-250 minutes
        isProcessed: false
    };

    return await db.insert(sensorReadings).values(sensorData).returning();
}
