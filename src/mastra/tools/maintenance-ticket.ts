import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../models/db";
import { maintenanceTickets, machines, aiPredictions } from "../../models/schema";
import { eq } from "drizzle-orm";

export const MaintenanceTicketTool = createTool({
    id: "create-maintenance-ticket",
    description: "Create a maintenance ticket for a machine based on failure prediction. Use this when a machine needs maintenance attention.",
    inputSchema: z.object({
        machineCode: z.string().describe("The machine code (e.g., M001, L001, H001)"),
        title: z.string().describe("Brief title describing the issue"),
        description: z.string().describe("Detailed description of the issue and recommended actions"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).describe("Priority level based on severity"),
        predictionId: z.string().optional().describe("Optional prediction ID if this ticket is based on an AI prediction"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        ticketId: z.string().optional(),
        ticketNumber: z.number().optional(),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        try {
            const { machineCode, title, description, priority, predictionId } = context as {
                machineCode: string;
                title: string;
                description: string;
                priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
                predictionId?: string;
            };
            
            // Get machine by code
            const [machine] = await db.select()
                .from(machines)
                .where(eq(machines.code, machineCode));
            
            if (!machine) {
                return {
                    success: false,
                    message: `Machine with code ${machineCode} not found`,
                };
            }
            
            // Create ticket
            const [ticket] = await db.insert(maintenanceTickets).values({
                machineId: machine.machineId,
                predictionId: predictionId || null,
                title,
                description,
                priority,
                status: 'OPEN',
            }).returning();
            
            if (!ticket) {
                return {
                    success: false,
                    message: 'Failed to create maintenance ticket',
                };
            }

            return {
                success: true,
                ticketId: ticket.ticketId,
                ticketNumber: ticket.ticketNumber,
                message: `Maintenance ticket #${ticket.ticketNumber} created successfully for ${machine.name} (${machineCode})`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to create maintenance ticket: ${error.message}`,
            };
        }
    },
});

export const GetMaintenanceTicketsTool = createTool({
    id: "get-maintenance-tickets",
    description: "Get maintenance tickets filtered by status or machine. Use this to see pending, open, or resolved maintenance work.",
    inputSchema: z.object({
        status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional().describe("Filter by ticket status"),
        machineCode: z.string().optional().describe("Filter by machine code"),
        limit: z.number().default(10).describe("Number of tickets to return"),
    }),
    outputSchema: z.object({
        tickets: z.array(z.object({
            ticketId: z.string(),
            ticketNumber: z.number(),
            machineCode: z.string(),
            machineName: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            priority: z.string(),
            status: z.string(),
            createdAt: z.string(),
        })),
        count: z.number(),
    }),
    execute: async ({ context }) => {
        try {
            const { status, machineCode, limit } = context as {
                status?: string;
                machineCode?: string;
                limit: number;
            };
            
            let query = db.select({
                ticket: maintenanceTickets,
                machine: machines,
            })
            .from(maintenanceTickets)
            .leftJoin(machines, eq(maintenanceTickets.machineId, machines.machineId))
            .limit(limit || 10);
            
            const results = await query;
            
            let filtered = results;
            
            if (status) {
                filtered = filtered.filter(r => r.ticket.status === status);
            }
            
            if (machineCode) {
                filtered = filtered.filter(r => r.machine?.code === machineCode);
            }
            
            return {
                tickets: filtered.map(r => ({
                    ticketId: r.ticket.ticketId,
                    ticketNumber: r.ticket.ticketNumber,
                    machineCode: r.machine?.code || 'Unknown',
                    machineName: r.machine?.name || 'Unknown',
                    title: r.ticket.title || 'No title',
                    description: r.ticket.description,
                    priority: r.ticket.priority || 'MEDIUM',
                    status: r.ticket.status || 'OPEN',
                    createdAt: r.ticket.createdAt || new Date().toISOString(),
                })),
                count: filtered.length,
            };
        } catch (error: any) {
            throw new Error(`Failed to get maintenance tickets: ${error.message}`);
        }
    },
});

