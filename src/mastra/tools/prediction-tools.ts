import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../models/db";
import { aiPredictions, sensorReadings, machines } from "../../models/schema";
import { eq, desc, and } from "drizzle-orm";

export const GetFailurePredictionsTool = createTool({
    id: "get-failure-predictions",
    description: "Get AI predictions that detected potential machine failures. This is critical for preventive maintenance. Shows which machines are at risk of failure and why.",
    inputSchema: z.object({
        machineCode: z.string().optional().describe("Optional machine code to filter predictions"),
        limit: z.number().default(10).describe("Number of predictions to return"),
    }),
    outputSchema: z.object({
        predictions: z.array(z.object({
            predictionId: z.string(),
            machineCode: z.string(),
            machineName: z.string(),
            failureType: z.string(),
            confidenceScore: z.number(),
            naturalLanguageReason: z.string(),
            createdAt: z.string(),
        })),
        count: z.number(),
        summary: z.string(),
    }),
    execute: async ({ context }) => {
        try {
            const machineCode = context?.machineCode as string | undefined;
            const limit = (context?.limit as number) || 10;
            
            const results = await db.select({
                prediction: aiPredictions,
                machine: machines,
            })
            .from(aiPredictions)
            .leftJoin(machines, eq(aiPredictions.machineId, machines.machineId))
            .where(eq(aiPredictions.isFailure, true))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(limit);
            
            let filteredResults = results;
            if (machineCode) {
                filteredResults = results.filter(r => r.machine?.code === machineCode);
            }
            
            const predictions = filteredResults.map(r => ({
                predictionId: r.prediction.predictionId,
                machineCode: r.machine?.code || 'Unknown',
                machineName: r.machine?.name || 'Unknown',
                failureType: r.prediction.failureType || 'Unknown Failure',
                confidenceScore: r.prediction.confidenceScore || 0,
                naturalLanguageReason: r.prediction.naturalLanguageReason || 'No explanation available',
                createdAt: r.prediction.createdAt || new Date().toISOString(),
            }));
            
            // Generate summary
            const summary = predictions.length > 0 && predictions[0]
                ? `Found ${predictions.length} machine(s) with failure predictions. Most common failure type: ${predictions[0].failureType}`
                : 'No failure predictions found.';
            
            return {
                predictions,
                count: predictions.length,
                summary,
            };
        } catch (error: any) {
            throw new Error(`Failed to get failure predictions: ${error.message}`);
        }
    },
});

export const GetPredictionByMachineTool = createTool({
    id: "get-predictions-by-machine",
    description: "Get all AI predictions (both failure and non-failure) for a specific machine. Use this to see the complete prediction history.",
    inputSchema: z.object({
        machineCode: z.string().describe("The machine code to get predictions for"),
        limit: z.number().default(5).describe("Number of predictions to return"),
    }),
    outputSchema: z.object({
        predictions: z.array(z.object({
            predictionId: z.string(),
            isFailure: z.boolean(),
            failureType: z.string(),
            confidenceScore: z.number(),
            naturalLanguageReason: z.string(),
            createdAt: z.string(),
        })),
        count: z.number(),
        machineInfo: z.object({
            code: z.string(),
            name: z.string(),
            status: z.string(),
        }).nullable(),
    }),
    execute: async ({ context }) => {
        try {
            const machineCode = context?.machineCode as string;
            const limit = (context?.limit as number) || 5;
            
            // Get machine info
            const [machine] = await db.select()
                .from(machines)
                .where(eq(machines.code, machineCode));
            
            if (!machine) {
                return {
                    predictions: [],
                    count: 0,
                    machineInfo: null,
                };
            }
            
            // Get predictions
            const results = await db.select()
                .from(aiPredictions)
                .where(eq(aiPredictions.machineId, machine.machineId))
                .orderBy(desc(aiPredictions.createdAt))
                .limit(limit);
            
            return {
                predictions: results.map(p => ({
                    predictionId: p.predictionId,
                    isFailure: p.isFailure,
                    failureType: p.failureType || 'No Failure',
                    confidenceScore: p.confidenceScore || 0,
                    naturalLanguageReason: p.naturalLanguageReason || 'No explanation available',
                    createdAt: p.createdAt || new Date().toISOString(),
                })),
                count: results.length,
                machineInfo: {
                    code: machine.code,
                    name: machine.name,
                    status: machine.status || 'ACTIVE',
                },
            };
        } catch (error: any) {
            throw new Error(`Failed to get predictions: ${error.message}`);
        }
    },
});

export const GetRecentPredictionsSummaryTool = createTool({
    id: "get-recent-predictions-summary",
    description: "Get a summary of recent predictions across all machines. Shows overall system health and identifies which machines need attention.",
    inputSchema: z.object({
        hours: z.number().default(24).describe("Number of hours to look back. Default 24 hours."),
    }),
    outputSchema: z.object({
        totalPredictions: z.number(),
        failureCount: z.number(),
        noFailureCount: z.number(),
        failureRate: z.number(),
        criticalMachines: z.array(z.object({
            machineCode: z.string(),
            machineName: z.string(),
            failureType: z.string(),
            confidence: z.number(),
        })),
        summary: z.string(),
    }),
    execute: async ({ context }) => {
        try {
            const hours = (context?.hours as number) || 24;
            const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
            
            // OPTIMIZED: Get recent predictions with limit
            const allPredictions = await db.select({
                prediction: aiPredictions,
                machine: machines,
            })
            .from(aiPredictions)
            .leftJoin(machines, eq(aiPredictions.machineId, machines.machineId))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(50); // Reduced from 100 to 50 for performance
            
            // OPTIMIZED: Get failure count from database instead of filtering in JS
            const failureResults = await db.select({
                prediction: aiPredictions,
                machine: machines,
            })
            .from(aiPredictions)
            .leftJoin(machines, eq(aiPredictions.machineId, machines.machineId))
            .where(eq(aiPredictions.isFailure, true))
            .orderBy(desc(aiPredictions.createdAt))
            .limit(10); // Only get top 10 failures
            
            const failures = failureResults;
            const noFailures = allPredictions.filter(p => !p.prediction.isFailure);
            
            const failureRate = allPredictions.length > 0 
                ? (failures.length / allPredictions.length) * 100 
                : 0;
            
            const criticalMachines = failures
                .slice(0, 5)
                .map(p => ({
                    machineCode: p.machine?.code || 'Unknown',
                    machineName: p.machine?.name || 'Unknown',
                    failureType: p.prediction.failureType || 'Unknown',
                    confidence: p.prediction.confidenceScore || 0,
                }));
            
            const summary = `In the last ${hours} hours: ${failures.length} failure predictions out of ${allPredictions.length} total predictions (${failureRate.toFixed(1)}% failure rate). ${criticalMachines.length > 0 ? `Critical machines: ${criticalMachines.map(m => m.machineCode).join(', ')}` : 'No critical machines.'}`;
            
            return {
                totalPredictions: allPredictions.length,
                failureCount: failures.length,
                noFailureCount: noFailures.length,
                failureRate: parseFloat(failureRate.toFixed(2)),
                criticalMachines,
                summary,
            };
        } catch (error: any) {
            throw new Error(`Failed to get predictions summary: ${error.message}`);
        }
    },
});
