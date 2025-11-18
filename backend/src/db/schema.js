import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  probabilities: text('probabilities'),
  explanation: text('explanation'),
  metadata: text('metadata'),
  timestamp: timestamp('timestamp').notNull().defaultNow()
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('low'),
  source: text('source').notNull().default('auto'),
  createdAt: timestamp('createdAt').notNull().defaultNow()
});
