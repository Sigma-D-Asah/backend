import { relations } from "drizzle-orm/relations";
import { machines, sensorReadings, aiPredictions, maintenanceTickets } from "./schema";

export const sensorReadingsRelations = relations(sensorReadings, ({one, many}) => ({
	machine: one(machines, {
		fields: [sensorReadings.machineId],
		references: [machines.machineId]
	}),
	aiPredictions: many(aiPredictions),
}));

export const machinesRelations = relations(machines, ({many}) => ({
	sensorReadings: many(sensorReadings),
	aiPredictions: many(aiPredictions),
	maintenanceTickets: many(maintenanceTickets),
}));

export const aiPredictionsRelations = relations(aiPredictions, ({one, many}) => ({
	sensorReading: one(sensorReadings, {
		fields: [aiPredictions.readingId],
		references: [sensorReadings.readingId]
	}),
	machine: one(machines, {
		fields: [aiPredictions.machineId],
		references: [machines.machineId]
	}),
	maintenanceTickets: many(maintenanceTickets),
}));

export const maintenanceTicketsRelations = relations(maintenanceTickets, ({one}) => ({
	machine: one(machines, {
		fields: [maintenanceTickets.machineId],
		references: [machines.machineId]
	}),
	aiPrediction: one(aiPredictions, {
		fields: [maintenanceTickets.predictionId],
		references: [aiPredictions.predictionId]
	}),
}));