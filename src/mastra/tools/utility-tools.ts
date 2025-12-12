import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Tool untuk mendapatkan waktu/tanggal saat ini
 * Berguna untuk header laporan sesuai dengan format system prompt
 */
export const GetCurrentTimeTool = createTool({
    id: "get-current-time",
    description: "Dapatkan tanggal dan waktu saat ini dalam format Indonesia (WIB). Gunakan untuk membuat header laporan yang akurat.",
    inputSchema: z.object({
        format: z.enum(["full", "date", "time"]).default("full").describe("Format output: 'full' (tanggal + waktu), 'date' (tanggal saja), 'time' (waktu saja)"),
    }),
    outputSchema: z.object({
        timestamp: z.string().describe("Timestamp ISO"),
        formatted: z.string().describe("Format Indonesia: '12 Desember 2025, 14:30 WIB'"),
        date: z.string().describe("Tanggal: '12 Desember 2025'"),
        time: z.string().describe("Waktu: '14:30 WIB'"),
    }),
    execute: async ({ context }) => {
        const now = new Date();
        
        // Convert to WIB (UTC+7)
        const wibOffset = 7 * 60; // 7 hours in minutes
        const wibTime = new Date(now.getTime() + wibOffset * 60 * 1000);
        
        const monthNames = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        
        const day = wibTime.getUTCDate();
        const month = monthNames[wibTime.getUTCMonth()];
        const year = wibTime.getUTCFullYear();
        const hours = String(wibTime.getUTCHours()).padStart(2, '0');
        const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');
        
        const dateFormatted = `${day} ${month} ${year}`;
        const timeFormatted = `${hours}:${minutes} WIB`;
        const fullFormatted = `${dateFormatted}, ${timeFormatted}`;
        
        return {
            timestamp: now.toISOString(),
            formatted: fullFormatted,
            date: dateFormatted,
            time: timeFormatted,
        };
    },
});

/**
 * Tool untuk mendapatkan informasi lengkap mesin berdasarkan machineId atau code
 * Lebih robust daripada tool sebelumnya
 */
export const GetMachineDetailTool = createTool({
    id: "get-machine-detail",
    description: "Dapatkan informasi lengkap mesin berdasarkan machineId ATAU code. Tool ini lebih fleksibel untuk mencari mesin.",
    inputSchema: z.object({
        machineId: z.string().optional().describe("ID mesin (UUID)"),
        code: z.string().optional().describe("Kode mesin (contoh: MCH-001, T-101)"),
    }),
    outputSchema: z.object({
        found: z.boolean(),
        machine: z.object({
            machineId: z.string(),
            code: z.string(),
            name: z.string(),
            type: z.string().describe("L (Low Risk), M (Medium Risk), H (High Risk)"),
            typeLabel: z.string().describe("Label: Low Risk, Medium Risk, atau High Risk"),
            location: z.string(),
            status: z.string(),
            healthScore: z.number().optional(),
            metadata: z.any().optional(),
        }).nullable(),
    }),
    execute: async ({ context }) => {
        try {
            const { db } = await import("../../models/db");
            const { machines } = await import("../../models/schema");
            const { eq, or } = await import("drizzle-orm");
            
            const machineId = context?.machineId as string | undefined;
            const code = context?.code as string | undefined;
            
            if (!machineId && !code) {
                return { found: false, machine: null };
            }
            
            let query = db.select().from(machines);
            
            if (machineId && code) {
                query = query.where(or(
                    eq(machines.machineId, machineId),
                    eq(machines.code, code)
                )) as any;
            } else if (machineId) {
                query = query.where(eq(machines.machineId, machineId)) as any;
            } else if (code) {
                query = query.where(eq(machines.code, code)) as any;
            }
            
            const [machine] = await query;
            
            if (!machine) {
                return { found: false, machine: null };
            }
            
            // Type label mapping
            const typeLabelMap: Record<string, string> = {
                'L': 'Low Risk',
                'M': 'Medium Risk',
                'H': 'High Risk',
            };
            
            // Safe metadata access
            const metadata = machine.metadata as any;
            
            return {
                found: true,
                machine: {
                    machineId: machine.machineId,
                    code: machine.code,
                    name: machine.name,
                    type: machine.type,
                    typeLabel: typeLabelMap[machine.type] || machine.type,
                    location: machine.location || 'Unknown',
                    status: machine.status || 'ACTIVE',
                    healthScore: metadata?.healthScore || undefined,
                    metadata: metadata || {},
                },
            };
        } catch (error: any) {
            throw new Error(`Failed to get machine detail: ${error.message}`);
        }
    },
});
