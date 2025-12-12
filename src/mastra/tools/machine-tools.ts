import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../models/db";
import { machines } from "../../models/schema";
import { eq, desc } from "drizzle-orm";

export const GetAllMachinesTool = createTool({
    id: "get-all-machines",
    description: "Get list of all machines in the factory. Use this to see available machines, their status, types, and locations.",
    inputSchema: z.object({
        status: z.enum(["ACTIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional().describe("Filter by machine status. Optional."),
    }),
    outputSchema: z.object({
        machines: z.array(z.object({
            machineId: z.string(),
            code: z.string(),
            name: z.string(),
            type: z.string(),
            location: z.string(),
            status: z.string(),
        })),
        count: z.number(),
    }),
    execute: async ({ context }) => {
        try {
            const status = context?.status as string | undefined;
            
            let query = db.select().from(machines);
            
            if (status) {
                query = query.where(eq(machines.status, status)) as any;
            }
            
            const allMachines = await query;
            
            return {
                machines: allMachines.map(m => ({
                    machineId: m.machineId,
                    code: m.code,
                    name: m.name,
                    type: m.type,
                    location: m.location || 'Unknown',
                    status: m.status || 'ACTIVE',
                })),
                count: allMachines.length,
            };
        } catch (error: any) {
            throw new Error(`Failed to get machines: ${error.message}`);
        }
    },
});

export const GetMachineByCodeTool = createTool({
    id: "get-machine-by-code",
    description: "Get detailed information about a specific machine by its code (e.g., M001, L001, H001).",
    inputSchema: z.object({
        code: z.string().describe("The machine code/identifier"),
    }),
    outputSchema: z.object({
        machine: z.object({
            machineId: z.string(),
            code: z.string(),
            name: z.string(),
            type: z.string(),
            location: z.string(),
            status: z.string(),
            metadata: z.any().optional(),
        }).nullable(),
    }),
    execute: async ({ context }) => {
        try {
            const code = context?.code as string;
            
            const [machine] = await db.select()
                .from(machines)
                .where(eq(machines.code, code));
            
            if (!machine) {
                return { machine: null };
            }
            
            return {
                machine: {
                    machineId: machine.machineId,
                    code: machine.code,
                    name: machine.name,
                    type: machine.type,
                    location: machine.location || 'Unknown',
                    status: machine.status || 'ACTIVE',
                    metadata: machine.metadata,
                },
            };
        } catch (error: any) {
            throw new Error(`Failed to get machine: ${error.message}`);
        }
    },
});
