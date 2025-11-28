import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const MaintenanceTicketTool = createTool({
    id: "maintenance-ticket",
    description: "Tool to create a maintenance ticket for a given machine and issue.",
    inputSchema: z.object({
        machineId: z.string().describe("The unique identifier of the machine."),
    }),
    outputSchema: z.object({
        output: z.string().describe("The result of the maintenance ticket creation."),
    }),
    execute: async (input) => {
        return {
            output: `Maintenance ticket created for machine ID:`,
        };
    },
});
