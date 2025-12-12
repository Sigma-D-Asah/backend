import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../models/db";
import { sensorReadings, machines } from "../../models/schema";
import { eq, desc, and } from "drizzle-orm";

export const GetLatestSensorReadingsTool = createTool({
    id: "get-latest-sensor-readings",
    description: "Get the latest sensor readings for a specific machine or all machines. This shows current operational parameters like temperature, speed, torque, and tool wear.",
    inputSchema: z.object({
        machineCode: z.string().optional().describe("Optional machine code to filter readings for a specific machine"),
        limit: z.number().default(10).describe("Number of readings to return. Default is 10."),
    }),
    outputSchema: z.object({
        readings: z.array(z.object({
            readingId: z.string(),
            machineCode: z.string(),
            machineName: z.string(),
            airTemperatureK: z.number(),
            processTemperatureK: z.number(),
            rotationalSpeedRpm: z.number(),
            torqueNm: z.number(),
            toolWearMin: z.number(),
            isProcessed: z.boolean(),
            timestamp: z.string(),
        })),
        count: z.number(),
    }),
    execute: async ({ context }) => {
        try {
            const machineCode = context?.machineCode as string | undefined;
            const limit = (context?.limit as number) || 10;
            
            let query = db.select({
                reading: sensorReadings,
                machine: machines,
            })
            .from(sensorReadings)
            .leftJoin(machines, eq(sensorReadings.machineId, machines.machineId))
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit);
            
            const results = await query;
            
            let filteredResults = results;
            if (machineCode) {
                filteredResults = results.filter(r => r.machine?.code === machineCode);
            }
            
            return {
                readings: filteredResults.map(r => ({
                    readingId: r.reading.readingId,
                    machineCode: r.machine?.code || 'Unknown',
                    machineName: r.machine?.name || 'Unknown',
                    airTemperatureK: r.reading.airTemperatureK,
                    processTemperatureK: r.reading.processTemperatureK,
                    rotationalSpeedRpm: r.reading.rotationalSpeedRpm,
                    torqueNm: r.reading.torqueNm,
                    toolWearMin: r.reading.toolWearMin,
                    isProcessed: r.reading.isProcessed || false,
                    timestamp: r.reading.timestamp || new Date().toISOString(),
                })),
                count: filteredResults.length,
            };
        } catch (error: any) {
            throw new Error(`Failed to get sensor readings: ${error.message}`);
        }
    },
});

export const GetUnprocessedSensorReadingsTool = createTool({
    id: "get-unprocessed-sensor-readings",
    description: "Get sensor readings that haven't been analyzed by ML yet. These are pending predictions.",
    inputSchema: z.object({
        limit: z.number().default(20).describe("Number of unprocessed readings to return"),
    }),
    outputSchema: z.object({
        readings: z.array(z.object({
            readingId: z.string(),
            machineCode: z.string(),
            machineName: z.string(),
            timestamp: z.string(),
        })),
        count: z.number(),
    }),
    execute: async ({ context }) => {
        try {
            const limit = (context?.limit as number) || 20;
            
            const results = await db.select({
                reading: sensorReadings,
                machine: machines,
            })
            .from(sensorReadings)
            .leftJoin(machines, eq(sensorReadings.machineId, machines.machineId))
            .where(eq(sensorReadings.isProcessed, false))
            .orderBy(desc(sensorReadings.timestamp))
            .limit(limit);
            
            return {
                readings: results.map(r => ({
                    readingId: r.reading.readingId,
                    machineCode: r.machine?.code || 'Unknown',
                    machineName: r.machine?.name || 'Unknown',
                    timestamp: r.reading.timestamp || new Date().toISOString(),
                })),
                count: results.length,
            };
        } catch (error: any) {
            throw new Error(`Failed to get unprocessed readings: ${error.message}`);
        }
    },
});
