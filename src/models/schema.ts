import { pgTable, index, foreignKey, uuid, doublePrecision, integer, boolean, timestamp, unique, varchar, jsonb, text, check, serial, char } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const sensorReadings = pgTable("sensor_readings", {
	readingId: uuid("reading_id").default(sql`uuid_generate_v7()`).primaryKey().notNull(),
	machineId: uuid("machine_id").notNull(),
	airTemperatureK: doublePrecision("air_temperature_k").notNull(),
	processTemperatureK: doublePrecision("process_temperature_k").notNull(),
	rotationalSpeedRpm: integer("rotational_speed_rpm").notNull(),
	torqueNm: doublePrecision("torque_nm").notNull(),
	toolWearMin: integer("tool_wear_min").notNull(),
	isProcessed: boolean("is_processed").default(false),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_readings_machine_time").using("btree", table.machineId.asc().nullsLast().op("timestamptz_ops"), table.timestamp.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_readings_unprocessed").using("btree", table.readingId.asc().nullsLast().op("uuid_ops")).where(sql`(is_processed = false)`),
	foreignKey({
			columns: [table.machineId],
			foreignColumns: [machines.machineId],
			name: "sensor_readings_machine_id_fkey"
		}).onDelete("cascade"),
]);

export const aiPredictions = pgTable("ai_predictions", {
	predictionId: uuid("prediction_id").default(sql`uuid_generate_v7()`).primaryKey().notNull(),
	readingId: uuid("reading_id").notNull(),
	machineId: uuid("machine_id").notNull(),
	isFailure: boolean("is_failure").notNull(),
	failureType: varchar("failure_type", { length: 100 }),
	confidenceScore: doublePrecision("confidence_score"),
	explanationData: jsonb("explanation_data").default({}),
	naturalLanguageReason: text("natural_language_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_predictions_failure_type").using("btree", table.failureType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.readingId],
			foreignColumns: [sensorReadings.readingId],
			name: "ai_predictions_reading_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.machineId],
			foreignColumns: [machines.machineId],
			name: "ai_predictions_machine_id_fkey"
		}),
	unique("ai_predictions_reading_id_key").on(table.readingId),
]);

export const maintenanceTickets = pgTable("maintenance_tickets", {
	ticketId: uuid("ticket_id").default(sql`uuid_generate_v7()`).primaryKey().notNull(),
	machineId: uuid("machine_id").notNull(),
	predictionId: uuid("prediction_id"),
	ticketNumber: serial("ticket_number").notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	priority: varchar({ length: 10 }),
	status: varchar({ length: 20 }).default('OPEN'),
	aiRecommendation: text("ai_recommendation"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_tickets_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.machineId],
			foreignColumns: [machines.machineId],
			name: "maintenance_tickets_machine_id_fkey"
		}),
	foreignKey({
			columns: [table.predictionId],
			foreignColumns: [aiPredictions.predictionId],
			name: "maintenance_tickets_prediction_id_fkey"
		}),
	check("maintenance_tickets_priority_check", sql`(priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[])`),
	check("maintenance_tickets_status_check", sql`(status)::text = ANY ((ARRAY['OPEN'::character varying, 'ASSIGNED'::character varying, 'IN_PROGRESS'::character varying, 'RESOLVED'::character varying, 'CLOSED'::character varying])::text[])`),
]);

export const machines = pgTable("machines", {
	machineId: uuid("machine_id").default(sql`uuid_generate_v7()`).primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: char({ length: 1 }).notNull(),
	location: varchar({ length: 100 }).default('Factory Floor 1'),
	status: varchar({ length: 20 }).default('ACTIVE'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("machines_code_key").on(table.code),
	check("machines_status_check", sql`(status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'MAINTENANCE'::character varying, 'DECOMMISSIONED'::character varying])::text[])`),
]);
